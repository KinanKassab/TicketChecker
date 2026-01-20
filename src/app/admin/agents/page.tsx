import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllAgents, getAllOrders, getAllCommissions, deleteAgent } from "@/lib/db";
import { formatSyp } from "@/lib/format";
import { DeleteAgentButton } from "./DeleteAgentButton";

export default async function AgentsPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("admin_auth")?.value === "1";
  if (!isAuthed) {
    redirect("/admin");
  }

  const agents = await getAllAgents();
  const orders = await getAllOrders();
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

  const deleteAgentAction = async (formData: FormData) => {
    "use server";

    const agentId = String(formData.get("agentId") ?? "");
    if (!agentId) return;

    await deleteAgent(agentId);
    redirect("/admin/agents");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Agents</h1>
          <p className="text-sm text-slate-600">
            Manage referral agents and their commissions.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
          >
            Back to Admin
          </Link>
          <Link
            href="/admin/agents/new"
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New agent
          </Link>
        </div>
      </div>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Agent</th>
                <th className="py-2">Code</th>
                <th className="py-2">Commission %</th>
                <th className="py-2">Paid orders</th>
                <th className="py-2">Revenue</th>
                <th className="py-2">Total Commission</th>
                <th className="py-2">Created</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
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
                agents.map((agent) => {
                  const agentPaidOrders = paidOrdersByAgent[agent.id] || [];
                  const revenue = agentPaidOrders.reduce(
                    (total, order) => total + order.amount,
                    0
                  );
                  const agentCommissions = commissions.filter(
                    (c) => c.agent_id === agent.id
                  );
                  const totalCommission = agentCommissions.reduce(
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
                      <td className="py-3">{agent.commission_percent}%</td>
                      <td className="py-3">{agentPaidOrders.length}</td>
                      <td className="py-3">{formatSyp(revenue)}</td>
                      <td className="py-3">{formatSyp(totalCommission)}</td>
                      <td className="py-3">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/agents/${agent.id}/edit`}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </Link>
                          <form action={deleteAgentAction} className="inline">
                            <input
                              type="hidden"
                              name="agentId"
                              value={agent.id}
                            />
                            <DeleteAgentButton agentName={agent.name} />
                          </form>
                        </div>
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
