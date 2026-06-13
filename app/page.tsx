"use client";

import { useMemo, useState } from "react";
import { ChefHat, AlertTriangle, ShoppingCart } from "lucide-react";
import IntakeForm, { type IntakePayload } from "@/components/IntakeForm";
import TimelineVisualizer from "@/components/TimelineVisualizer";
import MealCard from "@/components/MealCard";
import { parseAgendaEvents } from "@/lib/parser";
import type { PlanResponse } from "@/lib/types";

export default function Home() {
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [pantry, setPantry] = useState<string[]>([]);
  const [agenda, setAgenda] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse commitments from the submitted agenda for the timeline.
  const events = useMemo(() => parseAgendaEvents(agenda), [agenda]);

  async function handleSubmit(payload: IntakePayload) {
    setLoading(true);
    setError(null);
    setPantry(payload.pantry);
    setAgenda(payload.agenda);

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const issues = Array.isArray(data?.issues) ? ` ${data.issues.join(" ")}` : "";
        setError(`${data?.error ?? "Something went wrong."}${issues}`);
        setPlan(null);
        return;
      }
      setPlan(data as PlanResponse);
    } catch {
      setError("Could not reach the planner. Check your connection and try again.");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient glow backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/30">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              PrepMaster{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                AI
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Your Day, Your Budget, Your Cooking To-Do List
            </p>
          </div>
        </header>

        {/* Layout: intake + dashboard */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left: intake */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <IntakeForm onSubmit={handleSubmit} loading={loading} />
          </div>

          {/* Right: dashboard */}
          <div className="flex flex-col gap-6">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <p>{error}</p>
              </div>
            )}

            <TimelineVisualizer events={events} cookingTasks={plan?.todoList ?? []} />

            {/* Meal plan */}
            <section className="flex flex-col gap-4">
              <h3 className="font-display text-lg font-semibold text-slate-100">
                Your Custom Meal Plan
              </h3>
              {plan ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {plan.meals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} pantry={pantry} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center">
                  <ChefHat className="h-10 w-10 text-slate-600" />
                  <h4 className="font-display text-base font-semibold text-slate-300">
                    Ready to build your menu?
                  </h4>
                  <p className="max-w-sm text-sm text-slate-500">
                    Fill out your daily constraints and tap{" "}
                    <span className="text-slate-400">Generate Custom Cooking Day</span>{" "}
                    to build an AI-powered meal path.
                  </p>
                </div>
              )}
            </section>

            {/* Grocery summary */}
            {plan && plan.groceryList.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-display text-lg font-semibold text-slate-100">
                    Smart Grocery List
                  </h3>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {plan.groceryList.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2 text-sm"
                      >
                        <span className="text-slate-200">
                          {item.name}{" "}
                          <span className="text-slate-500">· {item.qty}</span>
                        </span>
                        <span className="font-medium text-emerald-300">
                          ${item.cost.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
