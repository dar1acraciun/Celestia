import * as tr from "three";

export const toJD = (date) => {
  const y = date.getUTCFullYear(),
    m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;
  const A = Math.floor(y / 100),
    B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    B -
    1524.5
  );
};

export const getLST = (date, lon) => {
  const jd = toJD(date);
  const T = (jd - 2451545.0) / 36525.0;
  const gmst =
    (280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T) %
    360;
  return (((gmst + lon) % 360) + 360) % 360;
};

export const eqVec = (ra_deg, dec_deg, R = 800) => {
  const ra = (ra_deg * Math.PI) / 180;
  const dc = (dec_deg * Math.PI) / 180;
  return new tr.Vector3(
    -R * Math.cos(dc) * Math.cos(ra),
    R * Math.sin(dc),
    R * Math.cos(dc) * Math.sin(ra),
  );
};

export const altAzLookTarget = (alt_deg, az_deg, lst_deg, lat_deg) => {
  const alt = (alt_deg * Math.PI) / 180;
  const az = (az_deg * Math.PI) / 180;
  const lat = (lat_deg * Math.PI) / 180;
  const sinDec =
    Math.sin(lat) * Math.sin(alt) +
    Math.cos(lat) * Math.cos(alt) * Math.cos(az);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
  const num = Math.sin(alt) - Math.sin(lat) * sinDec;
  const den = Math.cos(lat) * Math.cos(dec) + 1e-10;
  let ha = (Math.acos(Math.max(-1, Math.min(1, num / den))) * 180) / Math.PI;
  if (Math.sin(az) > 0) ha = 360 - ha;
  const ra = (((lst_deg - ha) % 360) + 360) % 360;
  return eqVec(ra, (dec * 180) / Math.PI);
};
