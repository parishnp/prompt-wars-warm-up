"use client";

import { X, ArrowRight, Replace, Leaf } from "lucide-react";

export interface Substitution {
  name: string;
  note: string;
}

interface SubstitutionDrawerProps {
  open: boolean;
  ingredientName: string | null;
  mealId: string | null;
  onClose: () => void;
  onSubstitute: (original: string, replacement: string, mealId: string | null) => void;
}

/**
 * Local substitution database — common 1:1 swaps. Keyed by lowercase name.
 * (Stand-in for a future API; keeping it local keeps the UI instant & offline.)
 */
const SUBSTITUTIONS: Record<string, Substitution[]> = {
  butter: [
    { name: "Olive oil", note: "¾ the amount; heart-healthy fats" },
    { name: "Coconut oil", note: "1:1; adds subtle sweetness" },
    { name: "Greek yogurt", note: "½ the amount for baking; cuts fat" },
  ],
  milk: [
    { name: "Almond milk", note: "1:1; nutty, dairy-free" },
    { name: "Oat milk", note: "1:1; creamy, great for sauces" },
    { name: "Soy milk", note: "1:1; highest protein alt" },
  ],
  eggs: [
    { name: "Flax egg", note: "1 tbsp flax + 3 tbsp water per egg" },
    { name: "Mashed banana", note: "¼ cup per egg; for baking" },
    { name: "Applesauce", note: "¼ cup per egg; keeps it moist" },
  ],
  sugar: [
    { name: "Honey", note: "¾ the amount; reduce liquids slightly" },
    { name: "Maple syrup", note: "¾ the amount; deeper flavor" },
    { name: "Stevia", note: "Tiny amount; zero-calorie" },
  ],
  flour: [
    { name: "Almond flour", note: "1:1; lower carb, gluten-free" },
    { name: "Oat flour", note: "1:1; blend rolled oats" },
    { name: "Whole wheat flour", note: "1:1; more fiber" },
  ],
  rice: [
    { name: "Quinoa", note: "1:1; complete protein" },
    { name: "Cauliflower rice", note: "1:1; low-carb" },
    { name: "Couscous", note: "1:1; faster to cook" },
  ],
  "chicken breast": [
    { name: "Tofu", note: "Firm, pressed; vegan protein" },
    { name: "Chickpeas", note: "1 can per breast; plant protein" },
    { name: "Turkey breast", note: "1:1; leaner option" },
  ],
  "soy sauce": [
    { name: "Tamari", note: "1:1; gluten-free" },
    { name: "Coconut aminos", note: "1:1; lower sodium, soy-free" },
  ],
  "heavy cream": [
    { name: "Coconut cream", note: "1:1; dairy-free richness" },
    { name: "Cashew cream", note: "Blend soaked cashews + water" },
  ],
  pasta: [
    { name: "Zucchini noodles", note: "Spiralized; low-carb" },
    { name: "Chickpea pasta", note: "1:1; high protein, GF" },
  ],
};

const GENERIC_FALLBACK: Substitution[] = [
  { name: "A similar pantry staple", note: "Match texture & moisture content" },
  { name: "Olive oil or stock", note: "For fats / liquids, adjust to taste" },
  { name: "Leave it out", note: "Omit if it's a garnish or optional" },
];

function getSubstitutions(name: string): Substitution[] {
  const key = name.trim().toLowerCase();
  if (SUBSTITUTIONS[key]) return SUBSTITUTIONS[key];
  const partial = Object.keys(SUBSTITUTIONS).find(
    (k) => key.includes(k) || k.includes(key),
  );
  return partial ? SUBSTITUTIONS[partial] : GENERIC_FALLBACK;
}

export default function SubstitutionDrawer({
  open,
  ingredientName,
  mealId,
  onClose,
  onSubstitute,
}: SubstitutionDrawerProps) {
  const subs = ingredientName ? getSubstitutions(ingredientName) : [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Ingredient substitutions"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-2">
            <Replace className="h-5 w-5 text-violet-400" />
            <h3 className="font-display text-lg font-semibold text-slate-100">
              Smart Substitution
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-5 text-sm text-slate-400">
            Swap{" "}
            <strong className="text-slate-100">{ingredientName ?? "ingredient"}</strong> for
            one of these:
          </p>

          <div className="flex flex-col gap-3">
            {subs.map((sub) => (
              <button
                key={sub.name}
                type="button"
                onClick={() =>
                  ingredientName && onSubstitute(ingredientName, sub.name, mealId)
                }
                className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-left transition hover:border-emerald-400/40 hover:bg-emerald-400/5"
              >
                <div className="flex items-start gap-3">
                  <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-100">{sub.name}</p>
                    <p className="text-xs text-slate-500">{sub.note}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-400" />
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs text-slate-600">
            Tip: substitutions update your meal plan and grocery list instantly.
          </p>
        </div>
      </aside>
    </>
  );
}
