const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(amount) {
  return inr.format(Number(amount) || 0);
}

export function initials(firstName = "", lastName = "") {
  return `${firstName.trim()[0] ?? ""}${lastName.trim()[0] ?? ""}`.toUpperCase() || "?";
}

export function fullName(person) {
  return [person?.firstName, person?.lastName].filter(Boolean).join(" ");
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

/** Validates a rupee amount typed by the user. Returns an error message or null. */
export function validateAmount(raw, balance) {
  const text = String(raw ?? "").trim();
  if (!text) return "Enter an amount";
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return "Enter a valid amount with up to 2 decimals";
  const value = Number(text);
  if (value <= 0) return "Amount must be greater than zero";
  if (value > 100000) return "You can send at most ₹1,00,000 per transfer";
  if (balance != null && value > balance) return "Amount is more than your balance";
  return null;
}
