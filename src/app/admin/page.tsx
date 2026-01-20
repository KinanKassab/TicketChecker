import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAllOrders,
  getAllTickets,
  getAllAgents,
  getAllCommissions,
  getOrderByToken,
  updateOrder,
  createCommission,
} from "@/lib/db";
import { formatDateTime, formatSyp } from "@/lib/format";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("admin_auth")?.value === "1";

  const authenticate = async (formData: FormData) => {
    "use server";

    const password = String(formData.get("password") ?? "");
    if (password !== process.env.ADMIN_PASSWORD) {
      redirect("/admin?error=Invalid password");
    }
    const responseCookies = await cookies();
    responseCookies.set("admin_auth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect("/admin");
  };

  if (!isAuthed) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Admin access
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter the admin password to view dashboard.
          </p>
          <form action={authenticate} className="mt-6 grid gap-4">
            <input
              type="password"
              name="password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Admin password"
              required
            />
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Enter
            </button>
          </form>
          {searchParams?.error ? (
            <p className="mt-4 text-sm text-rose-600">
              {searchParams.error}
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  const orders = await getAllOrders();
  const tickets = await getAllTickets();
  const agents = await getAllAgents();
  const commissions = await getAllCommissions();

  // Get paid orders per agent
  const paidOrdersByAgent = orders
    .filter((o) => o.status === "PAID" && o.agent_id)
    .reduce((acc, order) => {
      if (!order.agent_id) return acc;
      if (!acc[order.agent_id]) {
        acc[order.agent_id] = [];
      }
      acc[order.agent_id].push(order);
      return acc;
    }, {} as Record<string, typeof orders>);

  const markPaid = async (formData: FormData) => {
    "use server";

    const orderToken = String(formData.get("orderToken") ?? "");
    const order = await getOrderByToken(orderToken);

    if (!order || order.status === "PAID") {
      redirect("/admin");
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

    redirect("/admin");
  };

  const markFailed = async (formData: FormData) => {
    "use server";

    const orderToken = String(formData.get("orderToken") ?? "");
    await updateOrder(orderToken, {
      status: "FAILED",
    });
    redirect("/admin");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
          <p className="text-sm text-slate-600">
            Manual reconciliation and reporting.
          </p>
        </div>
        <Link
          href="/admin/agents"
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
        >
          Manage Agents
        </Link>
      </div>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Status</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Method</th>
                <th className="py-2">Phone</th>
                <th className="py-2">Reference</th>
                <th className="py-2">Agent</th>
                <th className="py-2">Created</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => {
                const getStatusColor = () => {
                  if (order.status === "PAID") {
                    return "bg-emerald-50 border-l-4 border-emerald-500";
                  }
                  if (order.status === "FAILED") {
                    return "bg-rose-50 border-l-4 border-rose-500";
                  }
                  return "bg-amber-50 border-l-4 border-amber-500";
                };

                return (
                  <tr key={order.id} className={getStatusColor()}>
                    <td className="py-3 font-semibold">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          order.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "FAILED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3">{formatSyp(order.amount)}</td>
                    <td className="py-3">{order.method ?? "—"}</td>
                    <td className="py-3">{order.phone ?? "—"}</td>
                    <td className="py-3">{order.reference_code}</td>
                    <td className="py-3">
                      {order.agent ? order.agent.name : "—"}
                    </td>
                    <td className="py-3">{formatDateTime(order.created_at)}</td>
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
                          {order.status === "PAID" ? "Paid ✓" : "Mark Paid"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Tickets</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Ticket</th>
                <th className="py-2">Attendee</th>
                <th className="py-2">Order Ref</th>
                <th className="py-2">Checked in</th>
                <th className="py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="py-3 font-semibold">{ticket.ticket_number}</td>
                  <td className="py-3">{ticket.attendee_name}</td>
                  <td className="py-3">
                    {ticket.order ? ticket.order.reference_code : "—"}
                  </td>
                  <td className="py-3">
                    {ticket.checked_in_at
                      ? formatDateTime(ticket.checked_in_at)
                      : "—"}
                  </td>
                  <td className="py-3">{formatDateTime(ticket.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Agents</h2>
          <Link
            href="/admin/agents"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            View all →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Agent</th>
                <th className="py-2">Code</th>
                <th className="py-2">Paid orders</th>
                <th className="py-2">Revenue</th>
                <th className="py-2">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No agents yet.{" "}
                    <Link
                      href="/admin/agents/new"
                      className="text-slate-900 underline hover:text-slate-700"
                    >
                      Create your first agent
                    </Link>
                  </td>
                </tr>
              ) : (
                agents.slice(0, 5).map((agent) => {
                  const agentPaidOrders = paidOrdersByAgent[agent.id] || [];
                  const revenue = agentPaidOrders.reduce(
                    (total, order) => total + order.amount,
                    0
                  );
                  const agentCommissions = commissions.filter(
                    (c) => c.agent_id === agent.id
                  );
                  const commission = agentCommissions.reduce(
                    (total, item) => total + item.commission_amount,
                    0
                  );
                  return (
                    <tr key={agent.id}>
                      <td className="py-3 font-semibold">{agent.name}</td>
                      <td className="py-3">
                        <code className="rounded bg-slate-100 px-2 py-1 text-xs font-mono">
                          {agent.code}
                        </code>
                      </td>
                      <td className="py-3">{agentPaidOrders.length}</td>
                      <td className="py-3">{formatSyp(revenue)}</td>
                      <td className="py-3">{formatSyp(commission)}</td>
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
