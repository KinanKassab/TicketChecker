import { redirect } from "next/navigation";
import { eventConfig } from "@/lib/config";
import { getAgentByCode, createOrder, getOrderByReferenceCode } from "@/lib/db";
import { formatSyp } from "@/lib/format";
import { generateOrderToken, generateReferenceCode } from "@/lib/tokens";

type HomeProps = {
  searchParams?: { ref?: string };
};

const createUniqueReferenceCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referenceCode = generateReferenceCode();
    const existing = await getOrderByReferenceCode(referenceCode);
    if (!existing) return referenceCode;
  }
  throw new Error("Unable to create unique reference code.");
};

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ?? {};
  const ref = params.ref?.trim() ?? "";
  const agent = ref ? await getAgentByCode(ref) : null;

  const createOrderAction = async (formData: FormData) => {
    "use server";

    try {
      const rawRef = String(formData.get("ref") ?? "").trim();
      const selectedAgent = rawRef ? await getAgentByCode(rawRef) : null;

      const orderToken = generateOrderToken();
      const referenceCode = await createUniqueReferenceCode();

      const order = await createOrder({
        order_token: orderToken,
        amount: eventConfig.ticketPriceSyp,
        reference_code: referenceCode,
        agent_id: selectedAgent?.id ?? null,
      });

      redirect(`/pay/${order.order_token}`);
    } catch (error) {
      console.error("Error creating order:", error);
      // Re-throw to show error to user
      throw error;
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 py-12">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">
          {eventConfig.name}
        </h1>
        <p className="mt-2 text-slate-600">{eventConfig.date}</p>
        <p className="text-slate-600">{eventConfig.location}</p>
        <p className="mt-4 text-2xl font-semibold text-slate-900">
          {formatSyp(eventConfig.ticketPriceSyp)}{" "}
          <span className="text-base font-medium text-slate-500">SYP</span>
        </p>
        {agent ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            You are buying via Agent: {agent.name}
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Buy your ticket</h2>
        <p className="mt-2 text-sm text-slate-600">
          Secure your seat. You will receive payment instructions next.
        </p>
        <form action={createOrderAction} className="mt-6">
          <input type="hidden" name="ref" value={agent?.code ?? ""} />
          <button
            type="submit"
            className="w-full rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white hover:bg-slate-800"
          >
            Pay
          </button>
        </form>
      </section>
    </main>
  );
}
