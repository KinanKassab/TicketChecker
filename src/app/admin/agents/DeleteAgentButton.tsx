"use client";

export function DeleteAgentButton({ agentName }: { agentName: string }) {
  return (
    <button
      type="submit"
      className="rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
      onClick={(e) => {
        if (
          !confirm(
            `Are you sure you want to delete ${agentName}? This action cannot be undone.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      Delete
    </button>
  );
}
