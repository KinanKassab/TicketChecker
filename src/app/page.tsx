import { headers, cookies } from "next/headers";
import { eventConfig } from "@/lib/config";
import { getAgentByCode, createLinkVisit } from "@/lib/db";
import EventLandingContent from "@/components/EventLandingContent";

export default async function Home({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const params = await searchParams;
  const ref = params.ref?.trim() ?? "";
  const agent = ref ? await getAgentByCode(ref) : null;

  if (!ref || !agent) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-lg">
           <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           </div>
           <h1 className="text-xl font-bold text-gray-900 mb-2">رابط غير صالح</h1>
           <p className="text-gray-500 text-sm">يرجى استخدام الرابط الرسمي المقدم من الوكيل.</p>
        </div>
      </main>
    );
  }

  // --- Tracking Logic ---
  try {
    const cookieStore = await cookies();
    const cookieName = `visited_agent_${agent.code}`;
    if (!cookieStore.has(cookieName)) {
      const headersList = await headers();
      await createLinkVisit({
        agent_code: ref,
        agent_id: agent.id,
        ip_address: headersList.get("x-forwarded-for")?.split(',')[0] || headersList.get("x-real-ip"),
        user_agent: headersList.get("user-agent"),
      });
      cookieStore.set(cookieName, "true", { maxAge: 86400, httpOnly: true });
    }
  } catch (error) { console.error("Tracking Error", error); }

  return (
    <EventLandingContent
      eventConfig={eventConfig}
      teamMembers={[]}
      agentCode={agent.code}
      initialNowMs={Date.now()}
    />
  );
}
