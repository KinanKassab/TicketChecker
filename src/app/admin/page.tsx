import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAllOrders,
  getAllTickets,
  getAllAgents,
  getAllCommissions,
  getAgentStats,
} from "@/lib/db";
import { formatSyp } from "@/lib/format";

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
      redirect(
        `/admin?error=${encodeURIComponent("كلمة المرور غير صحيحة")}`
      );
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
        <div className="rounded-[2rem] border border-white/35 bg-white/20 p-8 shadow-[0_18px_50px_rgba(16,39,78,0.28)] backdrop-blur-xl">
          <h1 className="text-2xl font-black text-slate-900">
            دخول الإدارة
          </h1>
          <p className="mt-2 text-sm text-slate-700/90">
            أدخل كلمة مرور الإدارة لعرض لوحة التحكم.
          </p>
          <form action={authenticate} className="mt-6 grid gap-4">
            <input
              type="password"
              name="password"
              className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition placeholder:text-slate-500 focus:border-[#2f74c3] focus:ring-2 focus:ring-[#2f74c3]/20"
              placeholder="كلمة مرور الإدارة"
              required
            />
            <button
              type="submit"
              className="rounded-full bg-[#0f2850] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(15,40,80,0.35)] transition hover:bg-[#153567]"
            >
              دخول
            </button>
          </form>
          {searchParams?.error ? (
            <p className="mt-4 rounded-xl border border-rose-200/90 bg-rose-50/90 px-3 py-2 text-sm font-semibold text-rose-700">
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
  const agentStats = await getAgentStats();
  const agentNameById = agents.reduce<Record<string, string>>((acc, agent) => {
    acc[agent.id] = agent.name;
    return acc;
  }, {});
  const paidTickets = tickets.filter(
    (ticket) => ticket.order?.status === "PAID"
  );

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

  // Get base URL string for display
  const baseUrlStr = process.env.BASE_URL || "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:py-12">
      <div className="rounded-[2rem] border border-white/35 bg-white/20 p-6 shadow-[0_18px_50px_rgba(16,39,78,0.28)] backdrop-blur-xl md:p-8">
        <div>
          <span className="inline-flex rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700">
            Admin Dashboard
          </span>
          <h1 className="mt-3 text-3xl font-black text-slate-900">
            لوحة التحكم
          </h1>
          <p className="mt-1 text-sm text-slate-700/90">
            إحصائيات الزيارات والأوامر لكل رابط.
          </p>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <section className="rounded-[2rem] border border-white/35 bg-white/20 p-6 shadow-[0_18px_50px_rgba(16,39,78,0.28)] backdrop-blur-xl md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">إحصائيات الروابط</h2>
          <p className="text-xs text-slate-700/75">
            تظهر عدد الأشخاص الذين دخلوا من كل رابط وعدد التذاكر المبيعة
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/55 bg-white/55 p-2">
          <table className="min-w-full text-right text-sm">
            <thead className="text-xs uppercase text-slate-700/80">
              <tr>
                <th className="py-2">اسم المسؤول</th>
                <th className="py-2">الكود</th>
                <th className="py-2">عدد الزيارات</th>
                <th className="py-2">التذاكر المبيعة</th>
                <th className="py-2">الرابط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/65">
              {agentStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-600">
                    لا توجد روابط بعد.{" "}
                    <Link
                      href="/admin/agents/new"
                      className="font-semibold text-[#1f4f9a] underline hover:text-[#173d79]"
                    >
                      إنشاء رابط جديد
                    </Link>
                  </td>
                </tr>
              ) : (
                agentStats.map((stat) => (
                  <tr key={stat.agent.id} className="transition hover:bg-white/70">
                    <td className="py-3 font-semibold">{stat.agent.name}</td>
                    <td className="py-3">
                      <code className="rounded-full border border-white/80 bg-white/85 px-2.5 py-1 text-xs font-mono text-slate-700">
                        {stat.agent.code}
                      </code>
                    </td>
                    <td className="py-3">
                      <span className="font-medium text-slate-900">{stat.visits}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-emerald-600 font-medium">{stat.paid_orders}</span>
                    </td>
                    <td className="py-3">
                      <a
                        href={`/?ref=${stat.agent.code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-xs text-[#1f4f9a] underline hover:text-[#173d79]"
                        title={`${baseUrlStr}/?ref=${stat.agent.code}`}
                      >
                        {`${baseUrlStr}/?ref=${stat.agent.code}`}
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/35 bg-white/20 p-6 shadow-[0_18px_50px_rgba(16,39,78,0.28)] backdrop-blur-xl md:p-8">
        <h2 className="text-lg font-black text-slate-900">
          التذاكر المبيعة
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/55 bg-white/55 p-2">
          <table className="min-w-full text-right text-sm">
            <thead className="text-xs uppercase text-slate-700/80">
              <tr>
                <th className="py-2">رقم التذكرة</th>
                <th className="py-2">الاسم الكامل</th>
                <th className="py-2">رقم الطلب</th>
                <th className="py-2">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/65">
              {paidTickets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-600">
                    لا توجد تذاكر مبيعة بعد.
                  </td>
                </tr>
              ) : (
                paidTickets.map((ticket) => (
                  <tr key={ticket.id} className="transition hover:bg-white/70">
                    <td className="py-3 font-semibold">
                      {ticket.ticket_number}
                    </td>
                    <td className="py-3">{ticket.attendee_name}</td>
                    <td className="py-3">
                      {ticket.order ? ticket.order.reference_code : "—"}
                    </td>
                    <td className="py-3">
                      {ticket.order?.agent_id
                        ? agentNameById[ticket.order.agent_id] ?? "—"
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/35 bg-white/20 p-6 shadow-[0_18px_50px_rgba(16,39,78,0.28)] backdrop-blur-xl md:p-8">
        <h2 className="mb-4 text-lg font-black text-slate-900">
          إحصائيات المسؤولين
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/55 bg-white/55 p-2">
          <table className="min-w-full text-right text-sm">
            <thead className="text-xs uppercase text-slate-700/80">
              <tr>
                <th className="py-2">المسؤول</th>
                <th className="py-2">الكود</th>
                <th className="py-2">الطلبات المدفوعة</th>
                <th className="py-2">الإيرادات</th>
                <th className="py-2">العمولة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/65">
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-600">
                    لا يوجد مسؤولون بعد.{" "}
                  </td>
                </tr>
              ) : (
                <>
                  {agents.slice(0, 5).map((agent) => {
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
                    <tr key={agent.id} className="transition hover:bg-white/70">
                      <td className="py-3 font-semibold">{agent.name}</td>
                      <td className="py-3">
                        <code className="rounded-full border border-white/80 bg-white/85 px-2.5 py-1 text-xs font-mono text-slate-700">
                          {agent.code}
                        </code>
                      </td>
                      <td className="py-3">{agentPaidOrders.length}</td>
                      <td className="py-3">{formatSyp(revenue)}</td>
                      <td className="py-3">{formatSyp(commission)}</td>
                    </tr>
                  );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
