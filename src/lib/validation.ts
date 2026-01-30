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

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم الثلاثي مطلوب").max(120),
  dob: z.string().trim().min(1, "تاريخ الميلاد مطلوب"),
  pob: z.string().trim().min(2, "مكان الولادة مطلوب").max(100),
  specialization: z.string().trim().min(2, "التخصص مطلوب").max(120),
  dreamJob: z.string().trim().min(2, "الوظيفة مطلوبة").max(100),
  company: z.string().trim().min(2, "الشركة مطلوبة").max(100),
  dream: z.string().trim().min(10, "اكتب شيئاً عن حلمك").max(500),
  skills: z.string().trim().min(2, "المهارات مطلوبة").max(200),
  visitCountry: z.string().trim().min(2, "البلد مطلوب").max(80),
});
