import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CheckinClient from "./CheckinClient";

type Message = {
  error?: string;
};

export default async function CheckinPage({
  searchParams,
}: {
  searchParams?: Message;
}) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("staff_auth")?.value === "1";

  const authenticate = async (formData: FormData) => {
    "use server";

    const password = String(formData.get("password") ?? "");
    if (password !== process.env.STAFF_PASSWORD) {
      redirect("/checkin?error=Invalid password");
    }
    const responseCookies = await cookies();
    responseCookies.set("staff_auth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect("/checkin");
  };

  if (!isAuthed) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Staff access
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter the staff password to access check-in.
          </p>
          <form action={authenticate} className="mt-6 grid gap-4">
            <input
              type="password"
              name="password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Staff password"
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <CheckinClient />
    </main>
  );
}
