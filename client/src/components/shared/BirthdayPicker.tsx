import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MIN_DATE = "1900-01-01";
const DEFAULT_VIEW_AGE = 30;

type BirthdayPickerProps = {
  disabled?: boolean;
  error?: string;
  label?: string;
  onChange: (value: string) => void;
  value: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatReadableDate(value: string) {
  const date = parseDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getTodayString() {
  const today = new Date();
  return toDateString(today.getFullYear(), today.getMonth(), today.getDate());
}

function getMinimumAllowedDate() {
  return parseDate(MIN_DATE) ?? new Date(1900, 0, 1);
}

function isAllowedDate(value: string) {
  return Boolean(value && value >= MIN_DATE && value <= getTodayString());
}

function getInitialViewDate(value: string) {
  const selected = parseDate(value);
  if (selected) return selected;

  const today = new Date();
  const defaultYear = Math.max(today.getFullYear() - DEFAULT_VIEW_AGE, 1900);
  return new Date(defaultYear, today.getMonth(), 1);
}

export default function BirthdayPicker({
  disabled = false,
  error,
  label = "Birthday",
  onChange,
  value,
}: BirthdayPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [manualValue, setManualValue] = useState(value);
  const [viewDate, setViewDate] = useState(() => getInitialViewDate(value));
  const containerRef = useRef<HTMLDivElement>(null);

  const minAllowed = useMemo(() => getMinimumAllowedDate(), []);
  const maxAllowed = useMemo(() => new Date(), []);
  const years = useMemo(() => {
    const start = minAllowed.getFullYear();
    const end = maxAllowed.getFullYear();
    return Array.from({ length: end - start + 1 }, (_, index) => end - index);
  }, [maxAllowed, minAllowed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setManualValue(value);
    if (value) {
      const selected = parseDate(value);
      if (selected) setViewDate(selected);
    }
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();
  const leadingBlankDays = firstDay.getDay();
  const selectedReadable = value ? formatReadableDate(value) : "";
  const selectedDate = parseDate(value);

  function updateView(nextYear: number, nextMonth: number) {
    setViewDate(new Date(nextYear, nextMonth, 1));
  }

  function moveMonth(offset: number) {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1),
    );
  }

  function handleManualChange(nextValue: string) {
    setManualValue(nextValue);
    const parsed = parseDate(nextValue);
    if (parsed) {
      setViewDate(parsed);
      if (isAllowedDate(nextValue)) onChange(nextValue);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <button
        aria-expanded={isOpen}
        className={[
          "flex w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2.5 text-left text-sm outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70",
          error ? "border-red-300" : "border-slate-200",
        ].join(" ")}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={selectedReadable ? "text-slate-800" : "text-slate-400"}>
          {selectedReadable || "Select birthday"}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
      </button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}

      {isOpen ? (
        <div className="absolute left-0 z-50 mt-2 w-full min-w-[19rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:w-[22rem]">
          <div className="grid grid-cols-[1fr_6rem_2.5rem_2.5rem] gap-2">
            <select
              aria-label="Month"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15"
              onChange={(event) =>
                updateView(viewDate.getFullYear(), Number(event.target.value))
              }
              value={viewDate.getMonth()}
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              aria-label="Year"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15"
              onChange={(event) =>
                updateView(Number(event.target.value), viewDate.getMonth())
              }
              value={viewDate.getFullYear()}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              aria-label="Previous month"
              className="grid place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              onClick={() => moveMonth(-1)}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next month"
              className="grid place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              onClick={() => moveMonth(1)}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
            {WEEKDAYS.map((weekday) => (
              <span className="py-1" key={weekday}>
                {weekday}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlankDays }).map((_, index) => (
              <span key={`blank-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateString = toDateString(
                viewDate.getFullYear(),
                viewDate.getMonth(),
                day,
              );
              const isSelected =
                selectedDate?.getFullYear() === viewDate.getFullYear() &&
                selectedDate?.getMonth() === viewDate.getMonth() &&
                selectedDate?.getDate() === day;
              const isDisabled = !isAllowedDate(dateString);

              return (
                <button
                  className={[
                    "aspect-square rounded-lg text-sm font-medium transition",
                    isSelected
                      ? "bg-[#1e3a5f] text-white"
                      : "text-slate-700 hover:bg-blue-50",
                    isDisabled
                      ? "cursor-not-allowed text-slate-300 hover:bg-transparent"
                      : "",
                  ].join(" ")}
                  disabled={isDisabled}
                  key={dateString}
                  onClick={() => {
                    onChange(dateString);
                    setManualValue(dateString);
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-xs font-medium text-slate-500">
                Manual entry
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15"
                inputMode="numeric"
                onChange={(event) => handleManualChange(event.target.value)}
                placeholder="YYYY-MM-DD"
                value={manualValue}
              />
            </label>
            {value ? (
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                onClick={() => {
                  onChange("");
                  setManualValue("");
                }}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
