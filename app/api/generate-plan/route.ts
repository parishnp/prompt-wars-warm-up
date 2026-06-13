import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { parseAgendaToGaps } from "@/lib/parser";
import type { FreeGap, PlanResponse } from "@/lib/types";

export const runtime = "nodejs";

/** "HH:MM" (24-hour) -> minutes since midnight. Returns NaN if malformed. */
function hhmmToMinutes(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Gemini responseSchema mirroring PlanResponse from @/lib/types.
 * `propertyOrdering` keeps the model's output stable and the enums constrain
 * the course field to the three valid values.
 */
const ingredientSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    qty: { type: Type.STRING },
    cost: { type: Type.NUMBER },
    category: { type: Type.STRING },
  },
  required: ["name", "qty", "cost", "category"],
  propertyOrdering: ["name", "qty", "cost", "category"],
};

const COURSE_ENUM = ["breakfast", "lunch", "dinner"];

const planResponseSchema = {
  type: Type.OBJECT,
  properties: {
    meals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          course: { type: Type.STRING, enum: COURSE_ENUM },
          name: { type: Type.STRING },
          desc: { type: Type.STRING },
          time: { type: Type.NUMBER, description: "active prep minutes" },
          cost: { type: Type.NUMBER },
          ingredients: { type: Type.ARRAY, items: ingredientSchema },
        },
        required: ["id", "course", "name", "desc", "time", "cost", "ingredients"],
        propertyOrdering: ["id", "course", "name", "desc", "time", "cost", "ingredients"],
      },
    },
    groceryList: { type: Type.ARRAY, items: ingredientSchema },
    todoList: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          mealId: { type: Type.STRING },
          course: { type: Type.STRING, enum: COURSE_ENUM },
          time: { type: Type.STRING, description: '24-hour "HH:MM" start time' },
          duration: { type: Type.NUMBER, description: "minutes" },
          text: { type: Type.STRING },
        },
        required: ["id", "mealId", "course", "time", "duration", "text"],
        propertyOrdering: ["id", "mealId", "course", "time", "duration", "text"],
      },
    },
  },
  required: ["meals", "groceryList", "todoList"],
  propertyOrdering: ["meals", "groceryList", "todoList"],
};

const SYSTEM_INSTRUCTION = `You are PrepMaster AI, a meal-planning and kitchen-scheduling engine.
You receive a user's daily budget, dietary profile, current pantry inventory, and a list of FREE TIME GAPS (the only windows in which they can cook).

You MUST follow these rules without exception:
1. Plan exactly 3 meals — one "breakfast", one "lunch", and one "dinner".
2. For each meal provide ingredients with realistic quantities and per-item USD cost.
3. Compile a single, merged todoList of cooking/prep tasks across all 3 meals.
4. Every task's [time, time + duration] interval MUST fit ENTIRELY inside ONE of the provided free gaps. Never schedule a task outside a gap, and never let a task cross a gap boundary. Use 24-hour "HH:MM" times.
5. Build groceryList by combining all meal ingredients and EXCLUDING anything already in the user's pantry. Respect the dietary profile for every ingredient.
6. The total cost of the groceryList (items the user must actually buy) MUST stay strictly under the user's daily budget.
7. Each task's mealId must reference the id of the meal it belongs to, and its course must match that meal's course.
Output ONLY JSON conforming to the provided schema — no prose, no markdown.`;

interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Validate the model output against the two hard constraints:
 *  - total cost of non-pantry grocery items is under budget
 *  - every cooking task fits strictly inside one parsed free gap
 */
function validatePlan(
  plan: PlanResponse,
  gaps: FreeGap[],
  budget: number,
  pantry: string[],
): ValidationResult {
  const errors: string[] = [];

  // ── Budget check (non-pantry items only) ────────────────────────────
  const pantrySet = new Set(pantry.map((p) => p.trim().toLowerCase()));
  const nonPantryCost = plan.groceryList
    .filter((item) => !pantrySet.has(item.name.trim().toLowerCase()))
    .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  if (!(nonPantryCost < budget)) {
    errors.push(
      `Grocery cost $${nonPantryCost.toFixed(2)} is not under the budget of $${budget.toFixed(2)}.`,
    );
  }

  // ── Schedule check (each task strictly within one gap) ──────────────
  const gapWindows = gaps.map((g) => ({
    start: hhmmToMinutes(g.startTime),
    end: hhmmToMinutes(g.endTime),
  }));

  for (const task of plan.todoList) {
    const start = hhmmToMinutes(task.time);
    if (Number.isNaN(start)) {
      errors.push(`Task "${task.text}" has an invalid time "${task.time}".`);
      continue;
    }
    const end = start + (Number(task.duration) || 0);
    const fits = gapWindows.some((w) => start >= w.start && end <= w.end);
    if (!fits) {
      errors.push(
        `Task "${task.text}" (${task.time}, ${task.duration}min) does not fit within any free gap.`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

export async function POST(request: Request) {
  // 1. Extract inputs ----------------------------------------------------
  let body: {
    agenda?: string;
    budget?: number | string;
    diet?: string;
    pantry?: string[] | string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const agenda = typeof body.agenda === "string" ? body.agenda : "";
  const budget = Number(body.budget);
  const diet = typeof body.diet === "string" && body.diet ? body.diet : "anything";
  const pantry = Array.isArray(body.pantry)
    ? body.pantry.map(String)
    : typeof body.pantry === "string"
      ? body.pantry.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  if (!Number.isFinite(budget) || budget <= 0) {
    return NextResponse.json(
      { error: "A positive numeric budget is required." },
      { status: 400 },
    );
  }

  // 2. Compute the free gaps from the agenda ----------------------------
  const gaps = parseAgendaToGaps(agenda);
  if (gaps.length === 0) {
    return NextResponse.json(
      { error: "No free time gaps were found in the agenda to schedule cooking." },
      { status: 422 },
    );
  }

  // 3. Initialize Gemini -------------------------------------------------
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY." },
      { status: 500 },
    );
  }
  const ai = new GoogleGenAI({ apiKey });

  // 4. Build the user prompt --------------------------------------------
  const userPrompt = `Plan my cooking day.

Daily budget (USD): ${budget}
Dietary profile: ${diet}
Pantry I already have: ${pantry.length ? pantry.join(", ") : "(nothing)"}

FREE TIME GAPS — schedule ALL cooking/prep tasks strictly inside these windows:
${JSON.stringify(gaps, null, 2)}

Produce 3 meals (breakfast, lunch, dinner), a merged todoList placed inside the gaps above, and a groceryList excluding pantry items and costing strictly under $${budget}.`;

  // 5. Call Gemini with a forced JSON schema ----------------------------
  let plan: PlanResponse;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: planResponseSchema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 },
      );
    }
    plan = JSON.parse(text) as PlanResponse;
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate a plan.", detail: String(err) },
      { status: 502 },
    );
  }

  // 6. Validate budget + schedule constraints ---------------------------
  const validation = validatePlan(plan, gaps, budget, pantry);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Generated plan failed validation.", issues: validation.errors, plan },
      { status: 422 },
    );
  }

  // 7. Return the validated payload -------------------------------------
  return NextResponse.json(plan, { status: 200 });
}
