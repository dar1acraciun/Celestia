package org.celestia.backend.service;

import org.celestia.backend.service.AstronomyService.State;
import org.celestia.backend.service.AstronomyService.VisibilityFacts;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class AstronomyServiceTest {

    private final AstronomyService service = new AstronomyService();

    private static final double LAT = 44.4;
    private static final double LST = 100.0;

    @Test
    void pole_altEqualsLatitude_azNorth() {
        double[] aa = service.altAz(123.0, 90.0, LST, LAT); // RA arbitrary at the pole
        assertEquals(44.4, aa[0], 0.01, "altitude of the celestial pole equals latitude");
        assertEquals(0.0, aa[1], 0.01, "pole is due North");
    }

    @Test
    void meridianSouthOfZenith_azSouth() {
        double[] aa = service.altAz(LST, 10.0, LST, LAT); // RA==LST, dec<lat -> south of zenith
        assertEquals(55.6, aa[0], 0.01);
        assertEquals(180.0, aa[1], 0.01, "object culminating south of zenith is due South");
    }

    @Test
    void zenith_altNinety() {
        double[] aa = service.altAz(LST, LAT, LST, LAT); // RA==LST, dec==lat
        assertEquals(90.0, aa[0], 0.01);
    }

    @Test
    void crux_fromBucharest_neverVisible() {
        // Crux line-member center dec ~= -59.31. x = -tan(44.4)*tan(-59.31) ~= 1.65 > 1.
        VisibilityFacts f = service.computeVisibility(188.65, -59.31, LAT, 26.1, Instant.now());
        assertEquals(State.NEVER_VISIBLE, f.state());
        assertNull(f.nextRiseUtc());
    }

    @Test
    void nearEquatorialBelowHorizon_belowRises_withPlausibleRise() {
        // Fixed sample: at 2026-01-15T21:30Z from Bucharest, RA=0/Dec=0 is below the horizon but rises.
        Instant now = OffsetDateTime.of(2026, 1, 15, 21, 30, 0, 0, ZoneOffset.UTC).toInstant();
        VisibilityFacts f = service.computeVisibility(0.0, 0.0, LAT, 26.1, now);

        assertEquals(State.BELOW_RISES, f.state());
        assertNotNull(f.nextRiseInHours());
        assertTrue(f.nextRiseInHours() > 0 && f.nextRiseInHours() <= 24,
                "nextRiseInHours in (0,24], was " + f.nextRiseInHours());
        assertNotNull(f.nextRiseUtc(), "normal path emits a UTC rise instant");
        assertTrue(f.nextRiseUtc().isAfter(now), "rise is in the future");
        assertTrue(f.nextRiseUtc().isBefore(now.plusSeconds(25 * 3600)), "rise within ~24h");
        assertTrue(java.util.Set.of("N", "NE", "E", "SE", "S", "SW", "W", "NW").contains(f.riseCompass()),
                "riseCompass is a valid 8-point value, was " + f.riseCompass());
    }

    @Test
    void compassBins() {
        assertEquals("N", service.compass(0));
        assertEquals("E", service.compass(90));
        assertEquals("S", service.compass(180));
        assertEquals("W", service.compass(270));
        assertEquals("SE", service.compass(135));
        assertEquals("N", service.compass(350)); // boundary wrap
    }

    @Test
    void jdAndLst_matchFrontendForFixedSample() {
        // Frontend-computed values for 2026-01-15T21:30:00Z (astronomy.js toJD/getLST).
        Instant sample = OffsetDateTime.of(2026, 1, 15, 21, 30, 0, 0, ZoneOffset.UTC).toInstant();
        double jd = service.toJD(sample);
        assertEquals(2461054.3958333335, jd, 1e-9);
        assertEquals(75.87160285562277, service.getLST(jd, 0.0), 1e-9);
        assertEquals(101.97160285562279, service.getLST(jd, 26.1), 1e-9);
    }
}
