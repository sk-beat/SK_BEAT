import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import FinancialHeader from "./FinancialHeader";
import FinancialModals, { type FinancialModalMode } from "./FinancialModals";
import FinancialSections from "./FinancialSections";
import type { EventBudget } from "./financialData";
import { supabase } from "../../../utils/supabase";
import type { AnnualBudget } from "./types";

export default function Financial() {
  const { logout } = useAuth();
  const [modalMode, setModalMode] = useState<FinancialModalMode>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventBudget | null>(null);

  const [annualBudget, setAnnualBudget] = useState<AnnualBudget | null>(null);

  function openEventModal(
    mode: "event-budget" | "event-expense",
    event: EventBudget
  ) {
    setSelectedEvent(event);
    setModalMode(mode);
  }

  function closeModal() {
    setModalMode(null);
    setSelectedEvent(null);
  }

  //CRUD
  async function getCurrentAnnualBudget() {
    const currentYear = new Date().getFullYear();

    const { data, error } = await supabase
      .from("annual_budgets")
      .select("*")
      .eq("fiscal_year", currentYear)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    setAnnualBudget(data); // data is either an object or null
  }

  async function handleCreateAnnualBudget(amount: number) {
    if (annualBudget) {
      console.log("Budget already exists.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("annual_budgets")
        .insert([
          {
            fiscal_year: new Date().getFullYear(),
            total_allocation: amount,
            remaining_balance: amount,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error inserting annual budget:", error.message);
        return;
      }

      console.log("Budget created successfully:", data);
      setAnnualBudget(data);

      return;
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }

  useEffect(() => {
    getCurrentAnnualBudget();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <FinancialHeader />

        <FinancialSections
          annualBudget={annualBudget}
          onEditEventBudget={(event) => openEventModal("event-budget", event)}
          onOpenEventExpense={(event) => openEventModal("event-expense", event)}
          onAddExpense={() => setModalMode("add-expense")}
          onOpenAnnualBudget={() => setModalMode("annual-budget")}
        />
      </main>
      <FinancialModals
        mode={modalMode}
        onClose={closeModal}
        selectedEvent={selectedEvent}
        annualBudget={annualBudget}
        onCreateAnnualBudget={handleCreateAnnualBudget}
      />
    </div>
  );
}
