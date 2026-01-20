import { z } from "zod";

export const orderUpdateSchema = z.object({
  method: z.enum(["SYRIATEL", "MTN"]),
  phone: z
    .string()
    .trim()
    .min(6, "Phone number is required")
    .max(30, "Phone number is too long"),
});

export const attendeeSchema = z.object({
  attendeeName: z
    .string()
    .trim()
    .min(3, "Full name is required")
    .max(120, "Name is too long"),
});

export const agentSchema = z.object({
  name: z.string().trim().min(2, "Agent name is required").max(100),
  commissionPercent: z
    .number()
    .min(0, "Minimum is 0")
    .max(100, "Maximum is 100"),
});

export const staffCheckinSchema = z.object({
  qrToken: z.string().trim().min(8),
});
