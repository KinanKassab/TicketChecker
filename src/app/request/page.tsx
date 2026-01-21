import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAllOrders,
  getAllAgents,
  getOrderByToken,
  updateOrder,
  createCommission,
  getAllCommissions,
  getAllTickets,
  createTicket,
  getNextTicketNumber,
} from "@/lib/db";
import { formatDateTime, formatSyp, formatTicketNumber } from "@/lib/format";
import { generateQrToken, generateTicketToken } from "@/lib/tokens";

export default async function RequestPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("admin_auth")?.value === "1";

  if (!isAuthed) {
    redirect("/admin");
  }

  const orders = await getAllOrders();
  const agents = await getAllAgents();
  const commissions = await getAllCommissions();

  // Filter to show only regular tickets (orders with agent_id)
  const regularOrders = orders.filter((order) => order.agent_id !== null);

  const agentNameById = agents.reduce<Record<string, string>>((acc, agent) => {
    acc[agent.id] = agent.name;
    return acc;
  }, {});

  const statusLabels = {
    PAID: "مدفوع",
    FAILED: "فشل",
    PENDING: "قيد الانتظار",
  } as const;

  const markPaid = async (formData: FormData) => {
    "use server";

    const orderToken = String(formData.get("orderToken") ?? "");
    const order = await getOrderByToken(orderToken);

    if (!order || order.status === "PAID") {
      redirect("/request");
    }

    await updateOrder(orderToken, {
      status: "PAID",
      paid_at: new Date().toISOString(),
    });

    if (order.agent_id) {
      const agent = agents.find((a) => a.id === order.agent_id);
      if (agent) {
        const commissionAmount = Math.round(
          (order.amount * agent.commission_percent) / 100
        );

        // Check if commission already exists
        const existingCommission = commissions.find(
          (c) => c.order_id === order.id
        );

        if (!existingCommission) {
          await createCommission({
            agent_id: order.agent_id,
            order_id: order.id,
            commission_amount: commissionAmount,
          });
        }
      }
    }

    // Create ticket for the paid order if it doesn't exist
    try {
      const allTickets = await getAllTickets();
      const existingTicket = allTickets.find((t) => t.order_id === order.id);
      if (!existingTicket) {
        const ticketNumberValue = await getNextTicketNumber();
        await createTicket({
          order_id: order.id,
          attendee_name: agents.find((a) => a.id === order.agent_id)?.name ?? "مشتري",
          ticket_number: formatTicketNumber(ticketNumberValue),
          ticket_token: generateTicketToken(),
          qr_token: generateQrToken(),
        });
      }
    } catch (err) {
      console.error("Error creating ticket after marking paid:", err);
      // don't block the flow if ticket creation fails
    }

    redirect("/request");
  };

  const markFailed = async (formData: FormData) => {
    "use server";

    const orderToken = String(formData.get("orderToken") ?? "");
    await updateOrder(orderToken, {
      status: "FAILED",
    });
    redirect("/request");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">الطلبات</h1>
        <p className="text-sm text-slate-600">
          عرض وإدارة الطلبات للتذاكر العادية فقط
        </p>
      </div>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">الطلبات</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">طريقة الدفع</th>
                <th className="py-2">الهاتف</th>
                <th className="py-2">رقم التذكرة</th>
                <th className="py-2">المسؤول</th>
                <th className="py-2">تاريخ الإنشاء</th>
                <th className="py-2">الرقم المدخل</th>
                <th className="py-2">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regularOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    لا توجد طلبات للتذاكر العادية بعد.
                  </td>
                </tr>
              ) : (
                regularOrders.map((order) => {
                  const getStatusColor = () => {
                    if (order.status === "PAID") {
                      return "bg-emerald-50 border-r-4 border-emerald-500";
                    }
                    if (order.status === "FAILED") {
                      return "bg-rose-50 border-r-4 border-rose-500";
                    }
                    return "bg-amber-50 border-r-4 border-amber-500";
                  };

                  return (
                    <tr key={order.id} className={getStatusColor()}>
                      <td className="py-3 pr-4">{order.method ?? "—"}</td>
                      <td className="py-3">{order.phone ?? "—"}</td>
                      <td className="py-3">{order.reference_code}</td>
                      <td className="py-3">
                        {order.agent_id
                          ? agentNameById[order.agent_id] ?? "—"
                          : "—"}
                      </td>
                      <td className="py-3">{formatDateTime(order.created_at)}</td>
                      <td className="py-3 font-mono">
                        {order.entered_verification_code ?? "—"}
                      </td>
                      <td className="py-3">
                        <form action={markPaid}>
                          <input
                            type="hidden"
                            name="orderToken"
                            value={order.order_token}
                          />
                          <button
                            type="submit"
                            className={`rounded-full border px-3 py-1 text-xs font-semibold disabled:opacity-60 ${
                              order.status === "PAID"
                                ? "border-emerald-300 bg-emerald-100 text-emerald-700 cursor-not-allowed"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                            disabled={order.status === "PAID"}
                          >
                            {order.status === "PAID" ? "مدفوع ✓" : "تأكيد الدفع"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
