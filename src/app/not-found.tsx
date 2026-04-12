import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-2xl rounded-[2rem] border border-white/35 bg-white/15 p-8 text-center text-white shadow-[0_20px_60px_rgba(13,26,54,0.35)] backdrop-blur-xl md:p-12">
        <span className="inline-flex items-center rounded-full border border-white/35 bg-white/20 px-4 py-1 text-sm font-semibold tracking-wide">
          Error 404
        </span>

        <h1 className="mt-6 text-5xl font-black leading-tight md:text-7xl">404</h1>
        <h2 className="mt-3 text-2xl font-bold md:text-3xl">الصفحة غير موجودة</h2>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/90 md:text-base">
          يبدو أن الرابط الذي تحاول الوصول إليه غير متوفر أو تم نقله. يمكنك
          العودة للصفحة الرئيسية أو استعراض الأحداث المتاحة.
        </p>

        <div className="mt-8 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-full border border-white/45 bg-white px-6 py-3 text-sm font-bold text-[#1f4f9a] transition hover:bg-white/90 sm:w-auto"
          >
            العودة للرئيسية
          </Link>
          <Link
            href="/events"
            className="inline-flex w-full items-center justify-center rounded-full border border-white/45 bg-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/25 sm:w-auto"
          >
            صفحة الأحداث
          </Link>
        </div>
      </section>
    </main>
  );
}
