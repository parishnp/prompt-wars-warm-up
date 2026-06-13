import type { CalendarEvent, FreeGap } from "./types";

/** The cooking day window: 08:00 AM (inclusive) to 09:00 PM. */
export const DAY_START_MIN = 8 * 60; // 08:00 -> 480
export const DAY_END_MIN = 21 * 60; // 21:00 -> 1260

/** Gaps shorter than this (in minutes) are not useful for cooking and are dropped. */
export const MIN_GAP_MINUTES = 10;

interface TimeInterval {
  /** minutes since midnight */
  start: number;
  /** minutes since midnight */
  end: number;
}

/**
 * Matches one event line, e.g.:
 *   "09:00 AM - 12:00 PM: Focus Work"
 *   "1:00 PM - 2:00 PM: Team Sync"
 * Capture groups: 1=startHour 2=startMin 3=startMeridiem 4=endHour 5=endMin 6=endMeridiem
 * The separator accepts a hyphen, en dash, or em dash.
 */
const EVENT_REGEX =
  /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i;

/** Convert a 12-hour clock hour + meridiem into a 24-hour integer (0–23). */
export function to24Hour(hour12: number, meridiem: string): number {
  const isPM = meridiem.toUpperCase() === "PM";
  const base = hour12 % 12; // 12 -> 0, so 12 AM -> 0 and 12 PM -> 12 (below)
  return isPM ? base + 12 : base;
}

/** Minutes since midnight for a parsed 12-hour time. */
function toMinutes(hour12: number, minutes: number, meridiem: string): number {
  return to24Hour(hour12, meridiem) * 60 + minutes;
}

/** Format minutes-since-midnight as a 24-hour "HH:MM" string. */
function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Parse each line of the agenda into time intervals (minutes since midnight).
 * Lines that don't match the expected timeline format are ignored, as are
 * intervals whose end is not after their start.
 */
export function parseAgendaToEvents(agendaText: string): TimeInterval[] {
  const events: TimeInterval[] = [];
  for (const line of agendaText.split(/\r?\n/)) {
    const match = line.match(EVENT_REGEX);
    if (!match) continue;

    const start = toMinutes(Number(match[1]), Number(match[2]), match[3]);
    const end = toMinutes(Number(match[4]), Number(match[5]), match[6]);

    if (end > start) events.push({ start, end });
  }
  return events;
}

/**
 * Like the event regex but also captures the trailing label after the colon,
 * e.g. "Focus Work" in "09:00 AM - 12:00 PM: Focus Work".
 */
const NAMED_EVENT_REGEX =
  /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*:?\s*(.*)$/i;

/**
 * Parse the agenda into named CalendarEvents (24-hour "HH:MM" times), preserving
 * each commitment's label for display. Intervals with non-positive duration are
 * skipped. Useful for visualizing the day; for free-time math use
 * parseAgendaToGaps.
 */
export function parseAgendaEvents(agendaText: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const line of agendaText.split(/\r?\n/)) {
    const match = line.match(NAMED_EVENT_REGEX);
    if (!match) continue;

    const start = toMinutes(Number(match[1]), Number(match[2]), match[3]);
    const end = toMinutes(Number(match[4]), Number(match[5]), match[6]);
    if (end <= start) continue;

    events.push({
      name: match[7]?.trim() || "Busy",
      startTime: formatMinutes(start),
      endTime: formatMinutes(end),
    });
  }
  return events;
}

/** Sort by start time and merge any overlapping/adjacent intervals into one. */
function mergeIntervals(events: TimeInterval[]): TimeInterval[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => a.start - b.start);
  const merged: TimeInterval[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.start <= last.end) {
      // Overlapping or touching — extend the current interval.
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

/**
 * Parse an agenda of timed events and return the free gaps between them within
 * the cooking day (08:00–21:00).
 *
 * Overlapping events are merged before gaps are computed, and any gap shorter
 * than MIN_GAP_MINUTES is excluded. The result is sorted chronologically.
 */
export function parseAgendaToGaps(agendaText: string): FreeGap[] {
  // Merge raw events, then clamp each to the cooking-day window and drop any
  // that fall entirely outside it.
  const events = mergeIntervals(parseAgendaToEvents(agendaText))
    .map((e) => ({
      start: Math.max(e.start, DAY_START_MIN),
      end: Math.min(e.end, DAY_END_MIN),
    }))
    .filter((e) => e.end > e.start);

  const gaps: FreeGap[] = [];
  const pushGap = (start: number, end: number) => {
    const durationMinutes = end - start;
    if (durationMinutes < MIN_GAP_MINUTES) return;
    gaps.push({
      startTime: formatMinutes(start),
      endTime: formatMinutes(end),
      durationMinutes,
    });
  };

  // Walk the timeline, recording the free space before each event.
  let cursor = DAY_START_MIN;
  for (const e of events) {
    if (e.start > cursor) pushGap(cursor, e.start);
    cursor = Math.max(cursor, e.end);
  }
  // Trailing free time until the end of the cooking day.
  if (cursor < DAY_END_MIN) pushGap(cursor, DAY_END_MIN);

  return gaps;
}
