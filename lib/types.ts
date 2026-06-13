export interface CalendarEvent {
  name: string;
  /** e.g. "09:00" */
  startTime: string;
  /** e.g. "12:00" */
  endTime: string;
}

export interface FreeGap {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface Ingredient {
  name: string;
  qty: string;
  cost: number;
  category: string;
}

export interface CookingTask {
  id: string;
  mealId: string;
  course: "breakfast" | "lunch" | "dinner";
  time: string;
  duration: number;
  text: string;
}

export interface Meal {
  id: string;
  course: "breakfast" | "lunch" | "dinner";
  name: string;
  desc: string;
  time: number;
  cost: number;
  ingredients: Ingredient[];
}

export interface PlanResponse {
  meals: Meal[];
  groceryList: Ingredient[];
  todoList: CookingTask[];
}
