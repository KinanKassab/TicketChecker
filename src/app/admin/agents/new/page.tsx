import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllAgents, createAgent } from "@/lib/db";
import { agentSchema } from "@/lib/validation";
import { generateAgentCode } from "@/lib/tokens";

const generateUniqueAgentCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateAgentCode();
    const allAgents = await getAllAgents();
    const existing = allAgents.find((a) => a.code === code);
    if (!existing) return code;
  }
  throw new Error("Unable to generate unique agent code.");
};

export default async function NewAgentPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("admin_auth")?.value === "1";
  if (!isAuthed) {
    redirect("/admin");
  }

  const createAgentAction = async (formData: FormData) => {
    "use server";

    const parsed = agentSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      commissionPercent: Number(formData.get("commissionPercent") ?? 0),
    });

    if (!parsed.success) {
      return;
    }

    const code = await generateUniqueAgentCode();
    await createAgent({
      name: parsed.data.name,
      commission_percent: parsed.data.commissionPercent,
      code,
    });

    redirect("/admin");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-6 py-12">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">New agent</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create a referral agent and generate a unique code.
        </p>
        <form action={createAgentAction} className="mt-6 grid gap-4">
          <input
            name="name"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Agent name"
            required
          />
          <input
            name="commissionPercent"
            type="number"
            min={0}
            max={100}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Commission percent"
            required
          />
          <button
            type="submit"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Create agent
          </button>
        </form>
      </div>
    </main>
  );
}
