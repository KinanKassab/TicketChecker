import { z } from "zod";

const MINIMUM_REGISTRATION_AGE = 15;
const DOB_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDob = (value: string) => {
  if (!DOB_PATTERN.test(value)) return null;

  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const isValidDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValidDate) return null;
  return { year, month, day };
};

const isAtLeastAge = (dob: string, age: number) => {
  const parsed = parseDob(dob);
  if (!parsed) return false;

  const today = new Date();
  let currentAge = today.getFullYear() - parsed.year;
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (currentMonth < parsed.month || (currentMonth === parsed.month && currentDay < parsed.day)) {
    currentAge -= 1;
  }

  return currentAge >= age;
};

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
  fullName: z
    .string()
    .trim()
    .min(2, "الاسم الثلاثي مطلوب")
    .max(120)
    .refine((value) => value.split(/\s+/).filter(Boolean).length === 3, "يجب إدخال الاسم الثلاثي (3 أسماء)"),
  dob: z
    .string()
    .trim()
    .min(1, "تاريخ الميلاد مطلوب")
    .refine((value) => parseDob(value) !== null, "تاريخ الميلاد غير صالح")
    .refine(
      (value) => isAtLeastAge(value, MINIMUM_REGISTRATION_AGE),
      `العمر يجب أن يكون ${MINIMUM_REGISTRATION_AGE} سنة على الأقل`
    ),
  pob: z.string().trim().min(2, "مكان الولادة مطلوب").max(100),
  specialization: z.string().trim().min(2, "التخصص مطلوب").max(120),
  dreamJob: z.string().trim().min(2, "الوظيفة مطلوبة").max(100),
  company: z.string().trim().min(2, "الشركة مطلوبة").max(100),
  dream: z.string().trim().min(5, "اكتب شيئاً عن حلمك (5 أحرف على الأقل)").max(500),
  skills: z.string().trim().min(2, "المهارات مطلوبة").max(200),
  visitCountry: z.string().trim().min(2, "البلد مطلوب").max(80),
});
