import { redirect } from "next/navigation";
import { getAgentByCode } from "@/lib/db";

export default async function Responsible2Page() {
  // Get agent code from env or use default
  const agentCode = process.env.RESPONSIBLE_2_CODE ?? "";
  
  // Verify agent exists
  const agent = await getAgentByCode(agentCode ?? "");
  if (!agent) {
    // If agent doesn't exist, redirect to home without ref
    redirect("/");
  }
  
  redirect(`/?ref=${agentCode}`);
}
