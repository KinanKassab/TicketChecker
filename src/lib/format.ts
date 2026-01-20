export const formatSyp = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SYP",
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDateTime = (value?: Date | string | null) => {
  if (!value) return "—";
  
  // Convert string to Date if needed
  const date = typeof value === "string" ? new Date(value) : value;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "—";
  }
  
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const formatTicketNumber = (sequence: number) =>
  `EVT2026-${String(sequence).padStart(6, "0")}`;
