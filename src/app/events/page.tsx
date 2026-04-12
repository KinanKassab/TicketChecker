import Link from "next/link";
import { getPublishedEvents } from "@/lib/db";
import EventsListWithPopup from "@/components/EventsListWithPopup";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const ref = params.ref?.trim() ?? "";
  const publishedEvents = await getPublishedEvents();
  const latestEvents = publishedEvents.map((event) => ({
    id: event.id,
    title: event.title,
    date: new Date(event.event_date).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    location: event.location,
    description: event.description ?? "ترقبوا المزيد من التفاصيل قريبًا.",
  }));

  return (
    <main dir="rtl" lang="ar" className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-black text-white">آخر الأحداث</h1>
        <p className="max-w-2xl text-sm text-white/70">
          هنا تقدر تطّلع على أحدث فعاليات FXI وكل التفاصيل المتعلقة بكل حدث.
        </p>
      </header>

      {latestEvents.length === 0 ? (
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/75 backdrop-blur-sm">
          لا توجد أحداث منشورة حاليًا.
        </article>
      ) : (
        <EventsListWithPopup events={latestEvents} agentCode={ref} />
      )}

      <div>
        <Link
          href={ref ? `/?ref=${encodeURIComponent(ref)}` : "/"}
          className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          الرجوع للصفحة الرئيسية
        </Link>
      </div>
    </main>
  );
}
