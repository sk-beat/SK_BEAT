import { useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import FinancialHeader from "./FinancialHeader";
import FinancialModals, { type FinancialModalMode } from "./FinancialModals";
import FinancialSections from "./FinancialSections";
import type { EventBudget } from "./financialData";

export default function Financial() {
  const { logout } = useAuth();
  const [modalMode, setModalMode] = useState<FinancialModalMode>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventBudget | null>(null);

  function openEventModal(mode: "event-budget" | "event-expense", event: EventBudget) {
    setSelectedEvent(event);
    setModalMode(mode);
  }

  function closeModal() {
    setModalMode(null);
    setSelectedEvent(null);
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <FinancialHeader />
        <FinancialSections
          onAddExpense={() => setModalMode("add-expense")}
          onEditEventBudget={(event) => openEventModal("event-budget", event)}
          onOpenAnnualBudget={() => setModalMode("annual-budget")}
          onOpenEventExpense={(event) => openEventModal("event-expense", event)}
        />
      </main>
      <FinancialModals
        mode={modalMode}
        onClose={closeModal}
        selectedEvent={selectedEvent}
      />
    </div>
  );
}
