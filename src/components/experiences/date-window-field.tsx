"use client";

import { useEffect, useMemo, useState } from "react";
import { addHours, isBefore, startOfDay, subHours } from "date-fns";
import { DayPicker, type DateRange, getDefaultClassNames } from "react-day-picker";
import { CalendarDays, Clock3, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const defaultClassNames = getDefaultClassNames();
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const value = `${String(hours).padStart(2, "0")}:${minutes}`;

  return {
    value,
    label: `${displayHour}:${minutes} ${period}`,
  };
});

function formatLocalInput(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function parseLocalInput(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return formatLocalInput(next);
}

function getTimeValue(value: string, fallback: string) {
  const parsed = parseLocalInput(value);

  if (!parsed) {
    return fallback;
  }

  return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
}

function applyPreset(daysFromNow: number, startHour: number, endHour: number) {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(startHour, 0, 0, 0);

  const end = new Date(start);
  end.setHours(endHour, 0, 0, 0);

  return {
    start: formatLocalInput(start),
    end: formatLocalInput(end),
    expiresAt: formatLocalInput(getSuggestedDeadline(start)),
  };
}

function applyNextWeekdayPreset(targetDay: number, startHour: number, endHour: number) {
  const today = new Date();
  const daysUntilTarget = (targetDay - today.getDay() + 7) % 7 || 7;
  return applyPreset(daysUntilTarget, startHour, endHour);
}

function getSuggestedDeadline(start: Date) {
  const twelveHoursBefore = subHours(start, 12);
  const oneHourFromNow = addHours(new Date(), 1);

  if (isBefore(twelveHoursBefore, oneHourFromNow)) {
    return isBefore(oneHourFromNow, start) ? oneHourFromNow : subHours(start, 1);
  }

  return twelveHoursBefore;
}

const QUICK_WINDOWS = [
  {
    label: "Tomorrow evening",
    values: applyPreset(1, 19, 22),
  },
  {
    label: "Saturday brunch",
    values: applyNextWeekdayPreset(6, 11, 14),
  },
  {
    label: "Next week dinner",
    values: applyPreset(7, 19, 21),
  },
];

type DateWindowFieldProps = {
  start: string;
  end: string;
  expiresAt: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onExpiresAtChange: (value: string) => void;
};

export function DateWindowField({
  start,
  end,
  expiresAt,
  onStartChange,
  onEndChange,
  onExpiresAtChange,
}: DateWindowFieldProps) {
  const [monthsToShow, setMonthsToShow] = useState(2);

  useEffect(() => {
    function syncCalendarDensity() {
      setMonthsToShow(window.innerWidth < 900 ? 1 : 2);
    }

    syncCalendarDensity();
    window.addEventListener("resize", syncCalendarDensity);

    return () => window.removeEventListener("resize", syncCalendarDensity);
  }, []);

  const selectedRange = useMemo<DateRange | undefined>(() => {
    const startDate = parseLocalInput(start);
    const endDate = parseLocalInput(end);

    if (!startDate && !endDate) {
      return undefined;
    }

    return {
      from: startDate,
      to: endDate,
    };
  }, [end, start]);

  const deadlineDate = parseLocalInput(expiresAt);
  const startTime = getTimeValue(start, "19:00");
  const endTime = getTimeValue(end, "21:00");
  const deadlineTime = getTimeValue(expiresAt, "17:00");

  function handleRangeSelect(range: DateRange | undefined) {
    if (!range?.from) {
      onStartChange("");
      onEndChange("");
      return;
    }

    onStartChange(combineDateAndTime(range.from, startTime));

      if (range.to) {
        onEndChange(combineDateAndTime(range.to, endTime));
        if (!expiresAt || (deadlineDate && !isBefore(deadlineDate, range.from))) {
          onExpiresAtChange(formatLocalInput(getSuggestedDeadline(range.from)));
        }
        return;
      }

    onEndChange("");
  }

  function updateTime(kind: "start" | "end" | "deadline", value: string) {
    if (kind === "deadline") {
      const baseDate = deadlineDate ?? (parseLocalInput(start) ? subHours(parseLocalInput(start) as Date, 24) : new Date());
      onExpiresAtChange(combineDateAndTime(baseDate, value));
      return;
    }

    const source = kind === "start" ? start : end;
    const parsed = parseLocalInput(source) ?? (kind === "start" ? parseLocalInput(start) : parseLocalInput(end));

    if (!parsed) {
      return;
    }

    const nextValue = combineDateAndTime(parsed, value);

    if (kind === "start") {
      onStartChange(nextValue);
      return;
    }

    onEndChange(nextValue);
  }

  function updateDeadlineDate(date: Date | undefined) {
    if (!date) {
      onExpiresAtChange("");
      return;
    }

    onExpiresAtChange(combineDateAndTime(date, deadlineTime));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-[linear-gradient(135deg,rgba(254,215,170,0.18),rgba(255,255,255,0.96),rgba(239,246,255,0.9))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-slate-900">Calendar window</p>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Pick the date range first, then tune the times. It should feel like setting availability, not filling out a spreadsheet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_WINDOWS.map((option) => (
              <button
                key={option.label}
                type="button"
                className="rounded-full border border-white/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                onClick={() => {
                  onStartChange(option.values.start);
                  onEndChange(option.values.end);
                  onExpiresAtChange(option.values.expiresAt);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="touch-pan-y mt-5 overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-3 shadow-soft-md sm:p-5">
          <DayPicker
            mode="range"
            numberOfMonths={monthsToShow}
            pagedNavigation
            showOutsideDays
            fixedWeeks
            navLayout="after"
            resetOnSelect
            selected={selectedRange}
            month={selectedRange?.from}
            onSelect={handleRangeSelect}
            startMonth={new Date()}
            endMonth={new Date(new Date().getFullYear() + 1, 11, 31)}
            disabled={{ before: startOfDay(new Date()) }}
            className="w-full"
            classNames={{
              root: cn(defaultClassNames.root, "w-full"),
              months: cn(defaultClassNames.months, "flex flex-col gap-6 lg:flex-row"),
              month: cn(defaultClassNames.month, "w-full space-y-4"),
              month_caption: cn(defaultClassNames.month_caption, "flex items-center justify-between pt-1"),
              caption_label: cn(defaultClassNames.caption_label, "text-sm font-semibold text-slate-900"),
              nav: cn(defaultClassNames.nav, "flex items-center gap-2"),
              button_previous: cn(
                defaultClassNames.button_previous,
                "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50",
              ),
              button_next: cn(
                defaultClassNames.button_next,
                "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50",
              ),
              month_grid: cn(defaultClassNames.month_grid, "w-full border-collapse"),
              weekdays: cn(defaultClassNames.weekdays, "grid grid-cols-7"),
              weekday: cn(defaultClassNames.weekday, "pb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400"),
              week: cn(defaultClassNames.week, "grid grid-cols-7"),
              day: cn(defaultClassNames.day, "relative flex justify-center py-0.5"),
              day_button: cn(
                defaultClassNames.day_button,
                "flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 min-[380px]:h-11 min-[380px]:w-11",
              ),
              today: cn(defaultClassNames.today, "text-primary"),
              selected: cn(defaultClassNames.selected, "bg-primary text-white hover:bg-primary hover:text-white"),
              range_start: cn(defaultClassNames.range_start, "rounded-l-[18px] bg-primary/14"),
              range_middle: cn(defaultClassNames.range_middle, "bg-primary/10 text-slate-900 [&>button]:rounded-none [&>button]:bg-transparent"),
              range_end: cn(defaultClassNames.range_end, "rounded-r-[18px] bg-primary/14"),
              outside: cn(defaultClassNames.outside, "text-slate-300"),
              disabled: cn(defaultClassNames.disabled, "text-slate-300 opacity-50"),
              chevron: cn(defaultClassNames.chevron, "h-4 w-4 fill-current"),
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft-md">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-500" />
            <p className="text-sm font-semibold text-slate-900">Event timing</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Starts</label>
              <select className="field-input" aria-label="Experience start time" value={startTime} onChange={(event) => updateTime("start", event.target.value)}>
                {TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Ends</label>
              <select className="field-input" aria-label="Experience end time" value={endTime} onChange={(event) => updateTime("end", event.target.value)}>
                {TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            If you only choose one day so far, guests will still see a clear anchor time while you keep the rest flexible.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft-md">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-sky-600" />
            <p className="text-sm font-semibold text-slate-900">Offer deadline</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Close offers before the experience starts so people know exactly when decisions happen.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              onClick={() => start && onExpiresAtChange(formatLocalInput(getSuggestedDeadline(parseLocalInput(start) as Date)))}
              disabled={!start}
            >
              12 hours before
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              onClick={() => start && onExpiresAtChange(formatLocalInput(subHours(parseLocalInput(start) as Date, 24)))}
              disabled={!start}
            >
              1 day before
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              onClick={() => start && onExpiresAtChange(formatLocalInput(subHours(parseLocalInput(start) as Date, 48)))}
              disabled={!start}
            >
              2 days before
            </button>
          </div>

          <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-3">
            <DayPicker
              mode="single"
              selected={deadlineDate}
              onSelect={updateDeadlineDate}
              month={deadlineDate ?? selectedRange?.from}
              startMonth={new Date()}
              endMonth={new Date(new Date().getFullYear() + 1, 11, 31)}
              disabled={{ before: startOfDay(new Date()) }}
              classNames={{
                root: cn(defaultClassNames.root, "w-full"),
                month: cn(defaultClassNames.month, "w-full"),
                month_caption: cn(defaultClassNames.month_caption, "mb-3 flex items-center justify-between"),
                caption_label: cn(defaultClassNames.caption_label, "text-sm font-semibold text-slate-900"),
                nav: cn(defaultClassNames.nav, "flex items-center gap-2"),
                button_previous: cn(defaultClassNames.button_previous, "flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"),
                button_next: cn(defaultClassNames.button_next, "flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"),
                month_grid: cn(defaultClassNames.month_grid, "w-full border-separate border-spacing-y-1"),
                weekdays: cn(defaultClassNames.weekdays, "grid grid-cols-7"),
                weekday: cn(defaultClassNames.weekday, "pb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400"),
                week: cn(defaultClassNames.week, "grid grid-cols-7"),
                day: cn(defaultClassNames.day, "flex justify-center py-0.5"),
                day_button: cn(defaultClassNames.day_button, "flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-medium text-slate-700 transition hover:bg-white"),
                selected: cn(defaultClassNames.selected, "bg-sky-600 text-white hover:bg-sky-600 hover:text-white"),
                outside: cn(defaultClassNames.outside, "text-slate-300"),
                disabled: cn(defaultClassNames.disabled, "text-slate-300 opacity-50"),
                chevron: cn(defaultClassNames.chevron, "h-4 w-4 fill-current"),
              }}
            />
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-slate-800">Deadline time</label>
            <select className="field-input" aria-label="Offer deadline time" value={deadlineTime} onChange={(event) => updateTime("deadline", event.target.value)}>
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 hidden">
            <Input type="datetime-local" value={expiresAt} onChange={(event) => onExpiresAtChange(event.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
