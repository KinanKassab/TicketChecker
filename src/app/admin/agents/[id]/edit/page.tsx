import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAgentById, updateAgent } from "@/lib/db";
import { agentSchema } from "@/lib/validation";
import Link from "next/link";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("admin_auth")?.value === "1";
  if (!isAuthed) {
    redirect("/admin");
  }

  const { id } = await params;
  const agent = await getAgentById(id);

  if (!agent) {
    redirect("/admin/agents");
  }

  const updateAgentAction = async (formData: FormData) => {
    "use server";

    const parsed = agentSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      commissionPercent: Number(formData.get("commissionPercent") ?? 0),
    });

    if (!parsed.success) {
      return;
    }

    await updateAgent(id, {
      name: parsed.data.name,
      commission_percent: parsed.data.commissionPercent,
    });

    redirect("/admin/agents");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-6 py-12">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Edit agent
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Update agent information.
            </p>
          </div>
          <Link
            href="/admin/agents"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back
          </Link>
        </div>
        <form action={updateAgentAction} className="mt-6 grid gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Agent name
            </label>
            <input
              name="name"
              defaultValue={agent.name}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Agent name"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Commission percent
            </label>
            <input
              name="commissionPercent"
              type="number"
              min={0}
              max={100}
              defaultValue={agent.commission_percent}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Commission percent"
              required
            />
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-700">Agent Code</p>
            <code className="mt-1 block text-sm font-mono text-slate-900">
              {agent.code}
            </code>
            <p className="mt-1 text-xs text-slate-500">
              This code cannot be changed. Share it as:{" "}
              <code className="font-mono">
                {process.env.BASE_URL || "YOUR_URL"}/?ref={agent.code}
              </code>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/agents"
              className="flex-1 rounded-full border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Update agent
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
