"use client";

import { Clock } from "lucide-react";
import type { CalendarEvent, CookingTask } from "@/lib/types";

interface TimelineVisualizerProps {
  events: CalendarEvent[];
  cookingTasks: CookingTask[];
}

/** The visualized day window: 08:00 (480) to 21:00 (1260). */
const DAY_START = 8 * 60;
const DAY_END = 21 * 60;
const SPAN = DAY_END - DAY_START; // 780 minutes

function toMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Convert a [start, end] minute range into left/width percentages of the day. */
function toBlockStyle(startMin: number, endMin: number) {
  const left = clampPercent(((startMin - DAY_START) / SPAN) * 100);
  const right = clampPercent(((endMin - DAY_START) / SPAN) * 100);
  return { left: `${left}%`, width: `${Math.max(0, right - left)}%` };
}

function formatLabel(hhmm: string): string {
  const min = toMinutes(hhmm);
  if (Number.isNaN(min)) return hhmm;
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// Hour markers every 2 hours across the window, plus the closing hour.
const HOUR_TICKS = [8, 10, 12, 14, 16, 18, 20, 21];

export default function TimelineVisualizer({
  events,
  cookingTasks,
}: TimelineVisualizerProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-400" />
          <h3 className="font-display text-lg font-semibold text-slate-100">
            Your Day at a Glance
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500/80" />
            Commitments
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            Cooking
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="relative">
        {/* Background lane */}
        <div className="relative h-16 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
          {/* Hour gridlines */}
          {HOUR_TICKS.map((h) => {
            const left = clampPercent(((h * 60 - DAY_START) / SPAN) * 100);
            return (
              <div
                key={`grid-${h}`}
                className="absolute top-0 h-full w-px bg-white/5"
                style={{ left: `${left}%` }}
              />
            );
          })}

          {/* Calendar commitments — dark slate-blue / purple */}
          {events.map((ev, i) => {
            const start = toMinutes(ev.startTime);
            const end = toMinutes(ev.endTime);
            if (Number.isNaN(start) || Number.isNaN(end)) return null;
            return (
              <div
                key={`ev-${i}`}
                title={`${ev.name} · ${formatLabel(ev.startTime)}–${formatLabel(ev.endTime)}`}
                className="group absolute top-1.5 flex h-[calc(50%-0.375rem)] items-center overflow-hidden rounded-md border border-indigo-400/30 bg-gradient-to-b from-indigo-600/70 to-violet-700/70 px-2"
                style={toBlockStyle(start, end)}
              >
                <span className="truncate text-[11px] font-medium text-indigo-100">
                  {ev.name}
                </span>
              </div>
            );
          })}

          {/* Cooking / prep sessions — neon green */}
          {cookingTasks.map((task) => {
            const start = toMinutes(task.time);
            if (Number.isNaN(start)) return null;
            const end = start + (Number(task.duration) || 0);
            return (
              <div
                key={`task-${task.id}`}
                title={`${task.text} · ${formatLabel(task.time)} (${task.duration}min)`}
                className="absolute bottom-1.5 flex h-[calc(50%-0.375rem)] items-center overflow-hidden rounded-md border border-emerald-300/50 bg-emerald-400/90 px-2 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                style={toBlockStyle(start, end)}
              >
                <span className="truncate text-[11px] font-semibold text-emerald-950">
                  {task.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hour labels */}
        <div className="relative mt-2 h-4">
          {HOUR_TICKS.map((h) => {
            const left = clampPercent(((h * 60 - DAY_START) / SPAN) * 100);
            return (
              <span
                key={`label-${h}`}
                className="absolute -translate-x-1/2 text-[10px] font-medium text-slate-500"
                style={{ left: `${left}%` }}
              >
                {formatLabel(`${String(h).padStart(2, "0")}:00`)}
              </span>
            );
          })}
        </div>
      </div>

      {events.length === 0 && cookingTasks.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">
          Paste your agenda and generate a plan to see your day mapped out.
        </p>
      )}
    </div>
  );
}
