"use client";

import { useState } from "react";
import {
  Sliders,
  ChevronDown,
  Plus,
  X,
  CalendarDays,
  Sparkles,
  Loader2,
} from "lucide-react";

export interface IntakePayload {
  agenda: string;
  budget: number;
  diet: string;
  pantry: string[];
}

interface IntakeFormProps {
  onSubmit: (payload: IntakePayload) => void;
  loading?: boolean;
}

const DIET_OPTIONS = [
  { value: "anything", label: "Anything (No Restrictions)" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "keto", label: "Keto" },
  { value: "mediterranean", label: "Mediterranean" },
];

const SAMPLE_AGENDA = `09:00 AM - 12:00 PM: Focus Work
1:00 PM - 2:00 PM: Team Sync
3:30 PM - 5:00 PM: Client Call`;

export default function IntakeForm({ onSubmit, loading = false }: IntakeFormProps) {
  const [diet, setDiet] = useState("anything");
  const [budget, setBudget] = useState(20);
  const [pantry, setPantry] = useState<string[]>(["rice", "olive oil", "salt"]);
  const [pantryInput, setPantryInput] = useState("");
  const [agenda, setAgenda] = useState("");

  function addPantryItem() {
    const item = pantryInput.trim().toLowerCase();
    if (!item) return;
    if (!pantry.includes(item)) setPantry((prev) => [...prev, item]);
    setPantryInput("");
  }

  function removePantryItem(item: string) {
    setPantry((prev) => prev.filter((p) => p !== item));
  }

  function handlePantryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addPantryItem();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    onSubmit({ agenda, budget, diet, pantry });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <Sliders className="h-5 w-5 text-violet-400" />
        <h2 className="font-display text-lg font-semibold text-slate-100">
          Daily Constraints
        </h2>
      </div>

      {/* Dietary profile */}
      <div className="flex flex-col gap-2">
        <label htmlFor="diet-select" className="text-sm font-medium text-slate-300">
          Dietary Profile
        </label>
        <div className="relative">
          <select
            id="diet-select"
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 pr-10 text-sm text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
          >
            {DIET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Budget slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="budget-input" className="text-sm font-medium text-slate-300">
            Daily Budget
          </label>
          <span className="rounded-lg bg-violet-500/15 px-2.5 py-1 font-display text-sm font-semibold text-violet-300">
            ${budget}
          </span>
        </div>
        <input
          id="budget-input"
          type="range"
          min={10}
          max={60}
          step={5}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-500"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>$10</span>
          <span>$35</span>
          <span>$60</span>
        </div>
      </div>

      {/* Pantry tags editor */}
      <div className="flex flex-col gap-2">
        <label htmlFor="pantry-input" className="text-sm font-medium text-slate-300">
          In My Pantry / Fridge
        </label>
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
          {pantry.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {pantry.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removePantryItem(item)}
                    aria-label={`Remove ${item}`}
                    className="rounded-full p-0.5 text-emerald-300/70 transition hover:bg-emerald-400/20 hover:text-emerald-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              id="pantry-input"
              type="text"
              value={pantryInput}
              onChange={(e) => setPantryInput(e.target.value)}
              onKeyDown={handlePantryKeyDown}
              placeholder="e.g., rice, olive oil, salt..."
              className="flex-1 rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-400"
            />
            <button
              type="button"
              onClick={addPantryItem}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Calendar agenda */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="agenda-input" className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
            <CalendarDays className="h-4 w-4 text-cyan-400" />
            Paste Your Calendar
          </label>
          <button
            type="button"
            onClick={() => setAgenda(SAMPLE_AGENDA)}
            className="text-xs text-violet-400 transition hover:text-violet-300"
          >
            Use sample
          </button>
        </div>
        <textarea
          id="agenda-input"
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          rows={6}
          placeholder={"09:00 AM - 12:00 PM: Focus Work\n1:00 PM - 2:00 PM: Team Sync"}
          className="w-full resize-y rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 font-mono text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
        />
        <p className="text-xs text-slate-500">
          One event per line: <span className="text-slate-400">HH:MM AM - HH:MM PM: Title</span>
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3.5 font-display text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Building your day...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 transition group-hover:scale-110" />
            Generate Custom Cooking Day
          </>
        )}
      </button>
    </form>
  );
}
