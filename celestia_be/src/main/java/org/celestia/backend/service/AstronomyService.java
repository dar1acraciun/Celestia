package org.celestia.backend.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * Stateless astronomy math for the sky-map chatbot. Ports the frontend's exact Julian-date and
 * Local-Sidereal-Time formulas (astronomy.js) and adds the inverse RA/Dec -> alt/az transform, a
 * rise-time solver, and a four-state visibility classifier. All angles are degrees at the API
 * boundary; radians are used internally.
 */
@Service
public class AstronomyService {

    /** |alt| <= this counts as "at the horizon". */
    public static final double HORIZON_BAND_DEG = 3.0;
    /** alt > this counts as comfortably visible. */
    public static final double VISIBLE_MIN_DEG = 3.0;

    private static final String[] COMPASS = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"};

    public enum State {VISIBLE, AT_HORIZON, BELOW_RISES, NEVER_VISIBLE}

    /** Structured, deterministic visibility facts for a constellation at a given place/time. */
    public record VisibilityFacts(
            State state,
            double altitudeDeg,
            double azimuthDeg,
            String compass,
            Instant nextRiseUtc,
            Double nextRiseInHours,
            String riseCompass
    ) {}

    // --- Julian date / sidereal time (ported verbatim from astronomy.js) ---

    /** Julian date for an instant, computed from its UTC calendar fields (JS toJD port). */
    public double toJD(Instant instant) {
        OffsetDateTime t = instant.atOffset(ZoneOffset.UTC);
        int y = t.getYear();
        int m = t.getMonthValue();
        double d = t.getDayOfMonth()
                + t.getHour() / 24.0
                + t.getMinute() / 1440.0
                + t.getSecond() / 86400.0
                + t.getNano() / 1_000_000_000.0 / 86400.0;
        double a = Math.floor(y / 100.0);
        double b = 2 - a + Math.floor(a / 4.0);
        return Math.floor(365.25 * (y + 4716))
                + Math.floor(30.6001 * (m + 1))
                + d + b - 1524.5;
    }

    /** Local Sidereal Time in degrees for a given JD and longitude (JS getLST port). */
    public double getLST(double jd, double lon) {
        double tt = (jd - 2451545.0) / 36525.0;
        double gmst = (280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * tt * tt) % 360;
        return (((gmst + lon) % 360) + 360) % 360;
    }

    public double getLST(Instant instant, double lon) {
        return getLST(toJD(instant), lon);
    }

    // --- Inverse transform RA/Dec -> alt/az (azimuth North-through-East) ---

    /** Returns {altDeg, azDeg} for the given equatorial coordinates, LST and latitude (all degrees). */
    public double[] altAz(double raDeg, double decDeg, double lstDeg, double latDeg) {
        double h = Math.toRadians(lstDeg - raDeg);
        double dec = Math.toRadians(decDeg);
        double lat = Math.toRadians(latDeg);

        double sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(h);
        double alt = Math.asin(clamp(sinAlt, -1.0, 1.0));

        double az = Math.atan2(
                -Math.sin(h) * Math.cos(dec),
                Math.cos(lat) * Math.sin(dec) - Math.sin(lat) * Math.cos(dec) * Math.cos(h)
        );
        double azDeg = (Math.toDegrees(az) + 360) % 360;
        return new double[]{Math.toDegrees(alt), azDeg};
    }

    // --- Compass ---

    /** Maps an azimuth (degrees, North-through-East) to an 8-point compass label. */
    public String compass(double azDeg) {
        return COMPASS[(int) Math.round(azDeg / 45.0) % 8];
    }

    // --- Classifier + rise solver ---

    /**
     * Classifies visibility and (for BELOW_RISES) solves the next rise time.
     *
     * @param raDeg  constellation center RA (deg)
     * @param decDeg constellation center Dec (deg)
     * @param latDeg observer latitude (deg)
     * @param lonDeg observer longitude (deg)
     * @param now    the instant to evaluate at
     */
    public VisibilityFacts computeVisibility(double raDeg, double decDeg, double latDeg, double lonDeg, Instant now) {
        double lst = getLST(now, lonDeg);
        double[] aa = altAz(raDeg, decDeg, lst, latDeg);
        double alt = aa[0];
        double az = aa[1];
        String compass = compass(az);

        double x = -Math.tan(Math.toRadians(latDeg)) * Math.tan(Math.toRadians(decDeg));

        if (alt > VISIBLE_MIN_DEG) {
            return new VisibilityFacts(State.VISIBLE, alt, az, compass, null, null, null);
        }
        if (Math.abs(alt) <= HORIZON_BAND_DEG) {
            return new VisibilityFacts(State.AT_HORIZON, alt, az, compass, null, null, null);
        }
        // alt < -HORIZON_BAND_DEG: below the band. Decide via the closed-form x test.
        if (x > 1.0) {
            return new VisibilityFacts(State.NEVER_VISIBLE, alt, az, compass, null, null, null);
        }
        // Rises here (circumpolar x < -1 would already have landed in VISIBLE): solve next rise.
        return solveRise(raDeg, decDeg, latDeg, lonDeg, lst, now, alt, az, compass, x);
    }

    private VisibilityFacts solveRise(double raDeg, double decDeg, double latDeg, double lonDeg,
                                      double lst, Instant now, double alt, double az, String compass, double x) {
        double h0 = Math.toDegrees(Math.acos(clamp(x, -1.0, 1.0)));
        double deltaLstDeg = (((raDeg - h0) - lst) % 360 + 360) % 360;
        double deltaHours = deltaLstDeg / 15.0 * (1.0 / 1.0027379);
        Instant analyticRise = now.plusMillis(Math.round(deltaHours * 3_600_000.0));

        // Refine: step +/- minutes around the analytic estimate to land the upward 0-crossing.
        Instant refined = refineRise(raDeg, decDeg, latDeg, lonDeg, analyticRise);

        if (refined != null) {
            double hoursToRise = Duration.between(now, refined).toMinutes() / 60.0;
            // Strictly positive by construction (deltaLstDeg in [0,360)); guard against rounding.
            if (hoursToRise <= 0) {
                hoursToRise = Math.max(deltaHours, 1.0 / 60.0);
            }
            String riseCompass = compassAt(raDeg, decDeg, latDeg, lonDeg, refined);
            return new VisibilityFacts(State.BELOW_RISES, alt, az, compass,
                    refined, round(hoursToRise, 2), riseCompass);
        }

        // Degraded fallback: emit nextRiseInHours from the analytic deltaHours, omit nextRiseUtc.
        double hours = Math.max(round(deltaHours, 2), 1.0 / 60.0);
        String riseCompass = compassAt(raDeg, decDeg, latDeg, lonDeg, analyticRise);
        return new VisibilityFacts(State.BELOW_RISES, alt, az, compass,
                null, hours, riseCompass);
    }

    /**
     * Searches a small window around the analytic estimate for the exact upward crossing of the
     * horizon (alt == 0 going from negative to positive). Steps by one minute over +/-90 minutes.
     */
    private Instant refineRise(double raDeg, double decDeg, double latDeg, double lonDeg, Instant estimate) {
        int windowMinutes = 90;
        Instant start = estimate.minusSeconds(windowMinutes * 60L);
        double prevAlt = altAt(raDeg, decDeg, latDeg, lonDeg, start);
        for (int i = 1; i <= windowMinutes * 2; i++) {
            Instant t = start.plusSeconds(i * 60L);
            double a = altAt(raDeg, decDeg, latDeg, lonDeg, t);
            if (prevAlt < 0 && a >= 0) {
                return t;
            }
            prevAlt = a;
        }
        return null;
    }

    private double altAt(double raDeg, double decDeg, double latDeg, double lonDeg, Instant t) {
        return altAz(raDeg, decDeg, getLST(t, lonDeg), latDeg)[0];
    }

    private String compassAt(double raDeg, double decDeg, double latDeg, double lonDeg, Instant t) {
        double[] aa = altAz(raDeg, decDeg, getLST(t, lonDeg), latDeg);
        return compass(aa[1]);
    }

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    private static double round(double v, int places) {
        double f = Math.pow(10, places);
        return Math.round(v * f) / f;
    }
}
