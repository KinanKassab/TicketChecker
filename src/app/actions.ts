"use server";

import { redirect } from "next/navigation";
import { getAgentByCode, createOrder, getOrderByReferenceCode } from "@/lib/db";
import { registrationSchema } from "@/lib/validation";
import { generateOrderToken, generateReferenceCode } from "@/lib/tokens";
import { eventConfig } from "@/lib/config";

const createUniqueReferenceCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referenceCode = generateReferenceCode();
    const existing = await getOrderByReferenceCode(referenceCode);
    if (!existing) return referenceCode;
  }
  throw new Error("Unable to create unique reference code.");
};

export type CreateOrderResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; formData?: Record<string, string> };

export async function createOrderAction(
  _prevState: CreateOrderResult | null,
  formData: FormData
): Promise<CreateOrderResult> {
  const parsed = registrationSchema.safeParse({
    fullName: formData.get("fullName"),
    dob: formData.get("dob"),
    pob: formData.get("pob"),
    specialization: formData.get("specialization"),
    dreamJob: formData.get("dreamJob"),
    company: formData.get("company"),
    dream: formData.get("dream"),
    skills: formData.get("skills"),
    visitCountry: formData.get("visitCountry"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    const issues = parsed.error.issues ?? parsed.error.errors ?? [];
    issues.forEach((e: { path?: (string | number)[]; message?: string }) => {
      const path = e.path?.[0]?.toString();
      if (path && e.message) fieldErrors[path] = e.message;
    });
    const submittedValues: Record<string, string> = {
      fullName: String(formData.get("fullName") ?? ""),
      dob: String(formData.get("dob") ?? ""),
      pob: String(formData.get("pob") ?? ""),
      specialization: String(formData.get("specialization") ?? ""),
      dreamJob: String(formData.get("dreamJob") ?? ""),
      company: String(formData.get("company") ?? ""),
      dream: String(formData.get("dream") ?? ""),
      skills: String(formData.get("skills") ?? ""),
      visitCountry: String(formData.get("visitCountry") ?? ""),
    };
    return {
      ok: false,
      error: "يرجى تصحيح الأخطاء في النموذج",
      fieldErrors,
      formData: submittedValues,
    };
  }

  const rawRef = String(formData.get("ref") ?? "").trim();
  const selectedAgent = rawRef ? await getAgentByCode(rawRef) : null;
  const orderToken = generateOrderToken();
  const referenceCode = await createUniqueReferenceCode();

  const { data: reg } = parsed;
  const attendeeInfo = {
    full_name: reg.fullName,
    birth_date: reg.dob,
    birth_place: reg.pob,
    specialization: reg.specialization,
    future_dream: reg.dream,
    dream_job: reg.dreamJob,
    skills: reg.skills,
    wish_visit_country: reg.visitCountry,
    company_affinity: reg.company,
  };

  try {
    await createOrder({
      order_token: orderToken,
      amount: eventConfig.ticketPriceSyp,
      reference_code: referenceCode,
      agent_id: selectedAgent?.id ?? null,
      ...attendeeInfo,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل إنشاء الطلب. حاول مرة أخرى.",
    };
  }

  redirect(`/pay/${orderToken}`);
}
