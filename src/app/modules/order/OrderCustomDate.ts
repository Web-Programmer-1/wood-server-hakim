// src/app/utils/dhakaDate.ts
// Asia/Dhaka timezone safe date range helpers (UTC+6) without external libs.

export const BD_OFFSET_MINUTES = 6 * 60; // UTC+6
export const BD_OFFSET_MS = BD_OFFSET_MINUTES * 60 * 1000;

export const toInt = (v: any, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Convert a UTC Date -> Dhaka-local "parts" by shifting +6h and reading as UTC parts.
 */
export const getDhakaParts = (date = new Date()) => {
  const d = new Date(date.getTime() + BD_OFFSET_MS);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth(), // 0-11
    day: d.getUTCDate(), // 1-31
    dow: d.getUTCDay(), // 0-6 (Sun-Sat)
  };
};

/**
 * Dhaka local midnight -> UTC Date boundary.
 * Dhaka 00:00 equals UTC previous day 18:00 (for UTC+6).
 */
export const dhakaLocalMidnightToUtc = (y: number, m0: number, day: number) => {
  return new Date(Date.UTC(y, m0, day, 0, 0, 0) - BD_OFFSET_MS);
};

export const addDaysUtc = (d: Date, days: number) =>
  new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

export const parseYYYYMMDD = (s: string) => {
  // expects "YYYY-MM-DD"
  const [yy, mm, dd] = s.split("-").map(Number);
  if (!yy || !mm || !dd) return null;
  return { y: yy, m0: mm - 1, day: dd };
};

/**
 * Returns [startUtc, endUtc) for a Dhaka local day.
 */
export const getDhakaDayRangeUtc = (dateStr: string) => {
  const p = parseYYYYMMDD(dateStr);
  if (!p) return null;
  const start = dhakaLocalMidnightToUtc(p.y, p.m0, p.day);
  const end = addDaysUtc(start, 1);
  return { start, end };
};

/**
 * Returns [startUtc, endUtc) for Dhaka local range (end inclusive).
 * endDate inclusive => end boundary is endDate + 1 day midnight.
 */
export const getDhakaRangeUtcInclusive = (startDateStr: string, endDateStr: string) => {
  const ps = parseYYYYMMDD(startDateStr);
  const pe = parseYYYYMMDD(endDateStr);
  if (!ps || !pe) return null;

  const start = dhakaLocalMidnightToUtc(ps.y, ps.m0, ps.day);
  const endInclusiveMidnight = dhakaLocalMidnightToUtc(pe.y, pe.m0, pe.day);
  const end = addDaysUtc(endInclusiveMidnight, 1);
  return { start, end };
};

/**
 * Returns [startUtc, endUtc) for "this week" in Dhaka.
 * weekStart: 0=Sunday, 1=Monday, ... 6=Saturday
 */
export const getDhakaThisWeekRangeUtc = (weekStart = 1) => {
  const ws = Math.min(6, Math.max(0, weekStart));
  const nowParts = getDhakaParts(new Date());
  const todayMidUtc = dhakaLocalMidnightToUtc(nowParts.y, nowParts.m, nowParts.day);

  const todayDow = nowParts.dow;
  const diff = (todayDow - ws + 7) % 7;
  const start = addDaysUtc(todayMidUtc, -diff);
  const end = addDaysUtc(start, 7);

  return { start, end };
};

/**
 * Returns [startUtc, endUtc) for "this month" in Dhaka.
 */
export const getDhakaThisMonthRangeUtc = () => {
  const nowParts = getDhakaParts(new Date());

  const start = dhakaLocalMidnightToUtc(nowParts.y, nowParts.m, 1);

  const nextMonthY = nowParts.m === 11 ? nowParts.y + 1 : nowParts.y;
  const nextMonthM = nowParts.m === 11 ? 0 : nowParts.m + 1;

  const end = dhakaLocalMidnightToUtc(nextMonthY, nextMonthM, 1);

  return { start, end };
};