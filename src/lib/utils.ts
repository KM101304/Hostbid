import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "Flexible timing";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeWindow(start?: string | null, end?: string | null) {
  if (!start && !end) {
    return "Timing flexible";
  }

  if (start && end) {
    return `${formatDateTime(start)} - ${formatDateTime(end)}`;
  }

  return formatDateTime(start ?? end);
}

export function interestLabel(activeBidCount: number) {
  if (activeBidCount >= 8) return "Highly sought after";
  if (activeBidCount >= 4) return "Strong interest";
  if (activeBidCount >= 2) return "Growing interest";
  if (activeBidCount >= 1) return "First offers arriving";
  return "New listing";
}
