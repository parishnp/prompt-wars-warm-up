"use client";

import { Clock, Wallet, Check } from "lucide-react";
import type { Meal } from "@/lib/types";

interface MealCardProps {
  meal: Meal;
  pantry: string[];
  onIngredientClick?: (ingredientName: string, meal: Meal) => void;
}

const COURSE_STYLES: Record<Meal["course"], string> = {
  breakfast: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  lunch: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  dinner: "border-violet-400/30 bg-violet-400/10 text-violet-300",
};

export default function MealCard({ meal, pantry, onIngredientClick }: MealCardProps) {
  const owned = new Set(pantry.map((p) => p.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span
            className={`w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${COURSE_STYLES[meal.course]}`}
          >
            {meal.course}
          </span>
          <h4 className="font-display text-lg font-semibold leading-tight text-slate-100">
            {meal.name}
          </h4>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-400">{meal.desc}</p>

      <div className="flex items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1.5 text-slate-300">
          <Clock className="h-4 w-4 text-cyan-400" />
          {meal.time} min active
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-300">
          <Wallet className="h-4 w-4 text-emerald-400" />
          ${meal.cost.toFixed(2)}
        </span>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Ingredients
        </span>
        <div className="flex flex-wrap gap-2">
          {meal.ingredients.map((ing) => {
            const isOwned = owned.has(ing.name.trim().toLowerCase());
            return (
              <button
                key={ing.name}
                type="button"
                onClick={() => onIngredientClick?.(ing.name, meal)}
                title={isOwned ? "In your pantry" : `${ing.qty} · $${ing.cost.toFixed(2)}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isOwned
                    ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.25)]"
                    : "border-white/10 bg-slate-800/60 text-slate-300 hover:border-violet-400/40 hover:text-violet-200"
                }`}
              >
                {isOwned && <Check className="h-3 w-3" />}
                {ing.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
