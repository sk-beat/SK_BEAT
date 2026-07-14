import { supabase } from "../../../utils/supabase";

export type ActivityEventStatus =
  | "draft"
  | "scheduled"
  | "ongoing"
  | "completed"
  | "cancelled";

export type ActivityExpense = {
  expense_id?: number;
  event_id?: number;
  expense_type: string;
  amount: number;
  description?: string | null;
};

export type ActivityEvent = {
  event_id: number;
  budget_year_id: number | null;
  event_name: string;
  category: string;
  allocated_budget: number;
  status: ActivityEventStatus;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  expected_attendees: number | null;
  cover_image: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string | null;
  event_expenses: ActivityExpense[];
};

export type SaveActivityEventPayload = {
  event_id: number | null;
  budget_year_id: number | null;
  event_name: string;
  category: string;
  status: ActivityEventStatus;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  expected_attendees: number;
  description: string | null;
  expenses: ActivityExpense[];
};

type AnnualBudgetRow = {
  budget_year_id: number;
};

export async function getActivityEvents() {
  const { data, error } = await supabase
    .from("events")
    .select(
      "event_id,budget_year_id,event_name,category,allocated_budget,status,event_date,event_time,location,expected_attendees,cover_image,description,created_by,created_at,event_expenses(expense_id,event_id,expense_type,amount,description)",
    )
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as ActivityEvent[], error };
}

export async function getCurrentBudgetYearId() {
  const { data, error } = await supabase
    .from("annual_budgets")
    .select("budget_year_id")
    .eq("fiscal_year", new Date().getFullYear())
    .maybeSingle();

  return { data: data as AnnualBudgetRow | null, error };
}

export async function saveActivityEvent(payload: SaveActivityEventPayload) {
  const { data, error } = await supabase.rpc("save_admin_event_with_expenses", {
    p_budget_year_id: payload.budget_year_id,
    p_category: payload.category,
    p_description: payload.description,
    p_event_date: payload.event_date,
    p_event_id: payload.event_id,
    p_event_name: payload.event_name,
    p_event_time: payload.event_time,
    p_expected_attendees: payload.expected_attendees,
    p_expenses: payload.expenses.map((expense) => ({
      amount: expense.amount,
      description: expense.description ?? null,
      expense_type: expense.expense_type,
    })),
    p_location: payload.location,
    p_status: payload.status,
  });

  return { data: data as ActivityEvent | null, error };
}

export async function deleteActivityEvent(eventId: number) {
  return await supabase.rpc("delete_admin_event", {
    p_event_id: eventId,
  });
}
