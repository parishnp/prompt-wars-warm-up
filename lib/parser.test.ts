/**
 * Simple mock runner for lib/parser.ts — no test framework required.
 * Run with:  npx tsx lib/parser.test.ts
 *
 * Exits with a non-zero code if any assertion fails.
 */
import { parseAgendaToGaps, to24Hour } from "./parser";
import type { FreeGap } from "./types";

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}\n      expected: ${e}\n      actual:   ${a}`);
  }
}

const gap = (startTime: string, endTime: string, durationMinutes: number): FreeGap => ({
  startTime,
  endTime,
  durationMinutes,
});

// ── 12h → 24h conversion ──────────────────────────────────────────────
console.log("to24Hour");
check("12 AM -> 0 (midnight)", to24Hour(12, "AM"), 0);
check("12 PM -> 12 (noon)", to24Hour(12, "PM"), 12);
check("1 PM -> 13", to24Hour(1, "PM"), 13);
check("9 AM -> 9", to24Hour(9, "AM"), 9);
check("meridiem case-insensitive", to24Hour(2, "pm"), 14);

// ── AM/PM agenda → gaps (the spec's worked example) ───────────────────
console.log("parseAgendaToGaps — AM/PM example");
check(
  "focus 9–12, sync 1–2 leaves 8–9, 12–1, 2–9",
  parseAgendaToGaps(
    "09:00 AM - 12:00 PM: Focus Work\n1:00 PM - 2:00 PM: Team Sync",
  ),
  [gap("08:00", "09:00", 60), gap("12:00", "13:00", 60), gap("14:00", "21:00", 420)],
);

// ── Overlapping events get merged ─────────────────────────────────────
console.log("parseAgendaToGaps — overlap handling");
check(
  "9–12 overlapping 10–1 merges into 9–1",
  parseAgendaToGaps(
    "09:00 AM - 12:00 PM: Focus\n10:00 AM - 01:00 PM: Standup",
  ),
  [gap("08:00", "09:00", 60), gap("13:00", "21:00", 480)],
);
check(
  "fully-nested event ignored (10–11 inside 9–12)",
  parseAgendaToGaps(
    "09:00 AM - 12:00 PM: Focus\n10:00 AM - 11:00 AM: Call",
  ),
  [gap("08:00", "09:00", 60), gap("12:00", "21:00", 540)],
);

// ── Gaps shorter than 10 minutes are dropped ──────────────────────────
console.log("parseAgendaToGaps — min-gap filtering");
check(
  "5-minute opening gap (8:00–8:05) is excluded",
  parseAgendaToGaps("08:05 AM - 09:00 AM: Early Meeting"),
  [gap("09:00", "21:00", 720)],
);
check(
  "exactly 10-minute gap is kept",
  parseAgendaToGaps("08:10 AM - 09:00 AM: Meeting"),
  [gap("08:00", "08:10", 10), gap("09:00", "21:00", 720)],
);

// ── Edge cases: empty / unparseable / out-of-window ───────────────────
console.log("parseAgendaToGaps — edge cases");
check("empty agenda -> whole day free", parseAgendaToGaps(""), [
  gap("08:00", "21:00", 780),
]);
check(
  "unparseable lines ignored",
  parseAgendaToGaps("Buy groceries\nrandom note\n"),
  [gap("08:00", "21:00", 780)],
);
check(
  "events outside the day window are clamped",
  parseAgendaToGaps(
    "06:00 AM - 07:00 AM: Gym\n08:00 PM - 11:00 PM: Movie",
  ),
  [gap("08:00", "20:00", 720)],
);
check(
  "event spanning the whole day -> no gaps",
  parseAgendaToGaps("08:00 AM - 09:00 PM: All-day Workshop"),
  [],
);

// ── Summary ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
