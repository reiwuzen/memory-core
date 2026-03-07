import { useEffect, useMemo, useRef, useState } from "react";
import "./calendar.scss";
import { useLibrary } from "@/hooks/useLibrary";
import { Button, EmptyState } from "@/components/ui";

type CalendarEvent = {
  id: string;
  title: string;
  type: string;
  isoDate: string;
  timeLabel: string;
  score: number;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
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

const startOfDayISO = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return d.toISOString();
};

const toDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const buildCalendarMatrix = (anchor: Date) => {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const firstWeekDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: Date[] = [];

  for (let i = 0; i < firstWeekDay; i++) {
    cells.push(new Date(year, month - 1, daysInPrevMonth - firstWeekDay + i + 1));
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(year, month, i));
  }
  while (cells.length < 42) {
    const nextDay = cells.length - (firstWeekDay + daysInMonth) + 1;
    cells.push(new Date(year, month + 1, nextDay));
  }
  return cells;
};

const computeScore = (tags: string[], updatedAt: string) => {
  const ageDays = Math.max(0, (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  const freshness = Math.max(0, 100 - ageDays * 2.4);
  return Math.round(Math.min(100, freshness * 0.7 + tags.length * 6));
};

const buildYearRange = (dates: string[]) => {
  const currentYear = new Date().getFullYear();
  const parsed = dates
    .map((iso) => new Date(iso).getFullYear())
    .filter((year) => Number.isFinite(year));
  const minYear = Math.min(currentYear - 2, ...(parsed.length ? parsed : [currentYear]));
  const maxYear = Math.max(currentYear + 2, ...(parsed.length ? parsed : [currentYear]));
  const years: number[] = [];
  for (let year = minYear; year <= maxYear; year++) years.push(year);
  return years;
};

const Calendar = () => {
  const { pagesStore } = useLibrary();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [isCompact, setIsCompact] = useState(false);
  const [transitionSeed, setTransitionSeed] = useState(0);
  const [openMenu, setOpenMenu] = useState<"month" | "year" | "day" | null>(null);
  const pickersRef = useRef<HTMLDivElement>(null);

  const calendarDays = useMemo(() => buildCalendarMatrix(currentMonth), [currentMonth]);

  const events = useMemo<CalendarEvent[]>(() => {
    return pagesStore.pages.map(({ pageMeta }) => {
      const basis = pageMeta.lastUpdatedAt || pageMeta.createdAt || startOfDayISO(new Date());
      const eventDate = new Date(basis);
      const normalizedDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      return {
        id: pageMeta.id,
        title: pageMeta.title || "Untitled",
        type: pageMeta.type,
        isoDate: normalizedDate.toISOString(),
        timeLabel: new Date(basis).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        score: computeScore(pageMeta.tags, basis),
      };
    });
  }, [pagesStore.pages]);

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      const key = toDateKey(new Date(event.isoDate));
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
  }, [events]);

  const selectedEvents = eventsByDate[selectedDateKey] ?? [];
  const nowKey = toDateKey(new Date());
  const selectableYears = useMemo(
    () => buildYearRange(events.map((event) => event.isoDate)),
    [events],
  );
  const selectedDateObj = useMemo(() => new Date(`${selectedDateKey}T00:00:00`), [selectedDateKey]);
  const selectedDay = selectedDateObj.getDate();
  const selectedMonth = currentMonth.getMonth();
  const selectedYear = currentMonth.getFullYear();
  const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const applyDateSelection = (date: Date) => {
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDateKey(toDateKey(date));
    setTransitionSeed((prev) => prev + 1);
  };

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!pickersRef.current) return;
      if (!pickersRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [openMenu]);

  return (
    <section className={`calendar-page ${isCompact ? "is-compact" : ""}`} aria-label="Calendar workspace">
      <header className="calendar-header">
        <div>
          <p className="calendar-kicker">Planning Surface</p>
          <h1>{`${MONTH_LABELS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}</h1>
        </div>
        <div className="calendar-actions" ref={pickersRef}>
          <label className="calendar-picker calendar-picker--month">
            <span>Month</span>
            <div className="calendar-month-menu">
              <button
                type="button"
                className="calendar-month-trigger"
                aria-haspopup="listbox"
                aria-expanded={openMenu === "month"}
                onClick={() => setOpenMenu((prev) => (prev === "month" ? null : "month"))}
              >
                {MONTH_LABELS[selectedMonth]}
              </button>
              {openMenu === "month" && (
                <ul className="calendar-month-list" role="listbox" aria-label="Select month">
                  {MONTH_LABELS.map((label, index) => (
                    <li key={label}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={index === selectedMonth}
                        className={index === selectedMonth ? "is-active" : ""}
                        onClick={() => {
                          const month = index;
                          const safeDay = Math.min(selectedDay, new Date(selectedYear, month + 1, 0).getDate());
                          applyDateSelection(new Date(selectedYear, month, safeDay));
                          setOpenMenu(null);
                        }}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>
          <label className="calendar-picker calendar-picker--year">
            <span>Year</span>
            <div className="calendar-month-menu">
              <button
                type="button"
                className="calendar-month-trigger"
                aria-haspopup="listbox"
                aria-expanded={openMenu === "year"}
                onClick={() => setOpenMenu((prev) => (prev === "year" ? null : "year"))}
              >
                {selectedYear}
              </button>
              {openMenu === "year" && (
                <ul className="calendar-month-list" role="listbox" aria-label="Select year">
                  {selectableYears.map((year) => (
                    <li key={year}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={year === selectedYear}
                        className={year === selectedYear ? "is-active" : ""}
                        onClick={() => {
                          const safeDay = Math.min(selectedDay, new Date(year, selectedMonth + 1, 0).getDate());
                          applyDateSelection(new Date(year, selectedMonth, safeDay));
                          setOpenMenu(null);
                        }}
                      >
                        {year}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>
          <label className="calendar-picker calendar-picker--day">
            <span>Day</span>
            <div className="calendar-month-menu">
              <button
                type="button"
                className="calendar-month-trigger"
                aria-haspopup="listbox"
                aria-expanded={openMenu === "day"}
                onClick={() => setOpenMenu((prev) => (prev === "day" ? null : "day"))}
              >
                {selectedDay}
              </button>
              {openMenu === "day" && (
                <ul className="calendar-month-list" role="listbox" aria-label="Select day">
                  {Array.from({ length: daysInSelectedMonth }).map((_, index) => {
                    const day = index + 1;
                    return (
                      <li key={day}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={day === selectedDay}
                          className={day === selectedDay ? "is-active" : ""}
                          onClick={() => {
                            applyDateSelection(new Date(selectedYear, selectedMonth, day));
                            setOpenMenu(null);
                          }}
                        >
                          {day}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </label>
          <Button
            variant="ghost"
            onClick={() => setIsCompact((prev) => !prev)}
          >
            {isCompact ? "Comfort" : "Compact"}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const now = new Date();
              applyDateSelection(now);
            }}
          >
            Today
          </Button>
        </div>
      </header>

      <div className="calendar-layout">
        <article className="calendar-grid-panel">
          <div className="calendar-weekdays">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div key={transitionSeed} className="calendar-grid is-animated">
            {calendarDays.map((day) => {
              const key = toDateKey(day);
              const dayEvents = eventsByDate[key] ?? [];
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = key === nowKey;
              const isSelected = key === selectedDateKey;

              return (
                <button
                  key={`${key}-${day.getMonth()}`}
                  className={`calendar-cell ${isCurrentMonth ? "" : "is-muted"} ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
                  onClick={() => setSelectedDateKey(key)}
                >
                  <span className="calendar-cell-date">{day.getDate()}</span>
                  {dayEvents.length > 0 ? (
                    <div className="calendar-dot-row">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span key={event.id} className="calendar-dot" />
                      ))}
                      {dayEvents.length > 3 ? <small>+{dayEvents.length - 3}</small> : null}
                    </div>
                  ) : (
                    <small className="calendar-empty-marker">No items</small>
                  )}
                </button>
              );
            })}
          </div>
        </article>

        <aside className="calendar-agenda">
          <header>
            <h2>Agenda</h2>
            <p>{selectedDateKey}</p>
          </header>
          {selectedEvents.length === 0 ? (
            <EmptyState
              title="No items scheduled"
              description="No memory updates exist for this day. Pick another day or create new pages."
            />
          ) : (
            <ul>
              {selectedEvents
                .sort((a, b) => b.score - a.score)
                .map((event) => (
                  <li key={event.id} className="agenda-card">
                    <div className="agenda-card-head">
                      <strong>{event.title}</strong>
                      <span>{event.timeLabel}</span>
                    </div>
                    <div className="agenda-meta">
                      <span>{event.type}</span>
                      <span>Score {event.score}</span>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
};

export default Calendar;
