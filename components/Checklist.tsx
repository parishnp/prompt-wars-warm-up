"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  CheckCircle2,
  Circle,
  ListTodo,
  Volume2,
} from "lucide-react";
import type { CookingTask } from "@/lib/types";

interface ChecklistProps {
  tasks: CookingTask[];
  completed: Record<string, boolean>;
  onToggle: (id: string) => void;
}

/* ── Minimal Web Speech API typings (not in lib.dom) ──────────────────── */
interface SpeechRecognitionResultLike {
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

const COURSE_DOT: Record<CookingTask["course"], string> = {
  breakfast: "bg-amber-400",
  lunch: "bg-cyan-400",
  dinner: "bg-violet-400",
};

function formatTime(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return hhmm;
  const h = Number(m[1]);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${period}`;
}

export default function Checklist({ tasks, completed, onToggle }: ChecklistProps) {
  const sorted = [...tasks].sort((a, b) => a.time.localeCompare(b.time));
  const total = sorted.length;
  const doneCount = sorted.filter((t) => completed[t.id]).length;

  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean>(() =>
    typeof window === "undefined" ? true : !!getRecognitionCtor(),
  );

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);
  // Latest data for the (long-lived) recognition callbacks; refreshed after
  // each render so the async voice handlers never read stale state.
  const latest = useRef({ sorted, completed, onToggle });
  useEffect(() => {
    latest.current = { sorted, completed, onToggle };
  });

  /** Check off the first incomplete step and announce the one after it. */
  function completeNext() {
    const { sorted: list, completed: done, onToggle: toggle } = latest.current;
    const current = list.find((t) => !done[t.id]);
    if (!current) {
      speak("All steps are already complete. Nice work!");
      return;
    }
    toggle(current.id);
    const next = list.find((t) => !done[t.id] && t.id !== current.id);
    speak(next ? `Done. Next up: ${next.text}` : "That was the last step. All done!");
  }

  function stopListening() {
    wantListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  function startListening() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase().trim();
      if (/\b(next|done|check|complete)\b/.test(transcript)) {
        completeNext();
      } else if (/\b(stop|pause|exit)\b/.test(transcript)) {
        stopListening();
      } else if (/\brepeat\b/.test(transcript)) {
        const cur = latest.current.sorted.find((t) => !latest.current.completed[t.id]);
        if (cur) speak(cur.text);
      }
    };
    rec.onend = () => {
      // The engine stops itself periodically; restart while still wanted.
      if (wantListeningRef.current) {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      }
    };
    rec.onerror = () => {
      /* swallow no-speech / network blips; onend handles restart */
    };

    recognitionRef.current = rec;
    wantListeningRef.current = true;
    rec.start();
    setListening(true);

    const first = sorted.find((t) => !completed[t.id]);
    speak(
      first
        ? `Voice mode on. Say "next" when you finish a step. First step: ${first.text}`
        : "Voice mode on. All steps are already complete.",
    );
  }

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      recognitionRef.current?.stop();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-emerald-400" />
          <h3 className="font-display text-lg font-semibold text-slate-100">
            Unified Cooking To-Do
          </h3>
        </div>
        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          disabled={!supported || total === 0}
          title={supported ? "Voice control" : "Voice recognition not supported in this browser"}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            listening
              ? "bg-rose-500/90 text-white shadow-[0_0_14px_rgba(244,63,94,0.5)]"
              : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
          }`}
        >
          {listening ? (
            <>
              <MicOff className="h-4 w-4" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              🎙️ Start Hands-Free Voice Mode
            </>
          )}
        </button>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="mb-5">
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
            <span>
              {doneCount} of {total} steps complete
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {listening && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
          <Volume2 className="h-4 w-4 animate-pulse" />
          Listening… say <strong>“next”</strong> or <strong>“done”</strong> to check off a
          step, <strong>“repeat”</strong> to hear it again, <strong>“stop”</strong> to end.
        </div>
      )}

      {/* Steps */}
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Your unified cooking checklist will appear here once you generate a plan.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {sorted.map((task) => {
            const isDone = !!completed[task.id];
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onToggle(task.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    isDone
                      ? "border-emerald-400/20 bg-emerald-400/5"
                      : "border-white/10 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/70"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-slate-500" />
                  )}
                  <span className={`h-2 w-2 shrink-0 rounded-full ${COURSE_DOT[task.course]}`} />
                  <span className="w-14 shrink-0 font-mono text-xs text-slate-400">
                    {formatTime(task.time)}
                  </span>
                  <span
                    className={`flex-1 text-sm ${
                      isDone ? "text-slate-500 line-through" : "text-slate-200"
                    }`}
                  >
                    {task.text}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">{task.duration}m</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
