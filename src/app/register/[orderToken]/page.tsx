import { redirect } from "next/navigation";
import { getOrderByToken, getAllTickets, createTicket, getNextTicketNumber } from "@/lib/db";
import { attendeeSchema } from "@/lib/validation";
import { formatTicketNumber } from "@/lib/format";
import { generateQrToken, generateTicketToken } from "@/lib/tokens";

type RegisterPageProps = {
  params: Promise<{ orderToken: string }> | { orderToken: string };
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const order = await getOrderByToken(resolvedParams.orderToken);

  if (!order || order.status !== "PAID") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Payment required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This order is not paid yet. Please complete payment first.
          </p>
        </div>
      </main>
    );
  }

  // Check if ticket already exists
  const allTickets = await getAllTickets();
  const existingTicket = allTickets.find(t => t.order_id === order.id);

  if (existingTicket) {
    redirect(`/ticket/${existingTicket.ticket_token}`);
  }

  const createTicketAction = async (formData: FormData) => {
    "use server";

    const parsed = attendeeSchema.safeParse({
      attendeeName: String(formData.get("attendeeName") ?? ""),
    });

    if (!parsed.success) {
      return;
    }

    const latestOrder = await getOrderByToken(resolvedParams.orderToken);

    if (!latestOrder || latestOrder.status !== "PAID") {
      redirect(`/pay/${resolvedParams.orderToken}`);
    }

    // Check again if ticket exists
    const allTicketsCheck = await getAllTickets();
    const existingTicketCheck = allTicketsCheck.find(t => t.order_id === latestOrder.id);
    if (existingTicketCheck) {
      redirect(`/ticket/${existingTicketCheck.ticket_token}`);
    }

    const ticketNumberValue = await getNextTicketNumber();
    const ticket = await createTicket({
      order_id: latestOrder.id,
      attendee_name: parsed.data.attendeeName,
      ticket_number: formatTicketNumber(ticketNumberValue),
      ticket_token: generateTicketToken(),
      qr_token: generateQrToken(),
    });

    redirect(`/ticket/${ticket.ticket_token}`);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Register attendee
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Please enter the attendee full name to generate the ticket.
        </p>
        <form action={createTicketAction} className="mt-6 grid gap-4">
          <input
            name="attendeeName"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Full name"
            required
          />
          <button
            type="submit"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Generate ticket
          </button>
        </form>
      </div>
    </main>
  );
}
