"use client";

import RegistrationForm from "@/components/RegistrationForm";

type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
};

type Props = {
  events: EventItem[];
  agentCode: string;
};

export default function EventsListWithPopup({ events, agentCode }: Props) {
  const latestEvent = events.at(-1);
  const previousEvents = events.slice(0, -1).reverse();

  if (!latestEvent) {
    return null;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="inline-flex rounded-full border border-emerald-300/45 bg-emerald-200/15 px-3 py-1 text-xs font-bold text-emerald-100">
          الحدث الأحدث
        </p>
        <article className="rounded-3xl border border-white/35 bg-linear-to-br from-white/18 to-white/8 p-6 shadow-[0_14px_45px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-8">
          <h2 className="text-2xl font-black text-white md:text-3xl">{latestEvent.title}</h2>
          <p className="mt-3 inline-flex rounded-xl border border-white/25 bg-white/12 px-4 py-2 text-sm text-white/85">
            {latestEvent.date} - {latestEvent.location}
          </p>
          <p className="mt-5 text-sm leading-8 text-white/85 md:text-base">
            {latestEvent.description}
          </p>
          <div className="mt-7 max-w-sm">
            <RegistrationForm
              agentCode={agentCode}
              triggerLabel="احجز مكانك الآن"
              triggerClassName="w-full rounded-full border border-emerald-200/60 bg-emerald-300/30 px-5 py-3 text-sm font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_20px_rgba(16,185,129,0.18)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-emerald-100/90 hover:bg-emerald-200/45 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_14px_28px_rgba(16,185,129,0.35)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100/75 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-900"
            />
          </div>
        </article>
      </section>

      {previousEvents.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-black text-white">الأحداث السابقة</h3>
            <p className="mt-1 text-sm text-white/70">
              لمحة سريعة عن أبرز فعالياتنا السابقة.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {previousEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-white/25 bg-white/10 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.16)] backdrop-blur-xl"
              >
                <h4 className="text-base font-bold text-white">{event.title}</h4>
                <p className="mt-2 text-xs text-white/70">
                  {event.date} - {event.location}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-white/80">
                  {event.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-white/15 bg-white/6 p-5 text-sm text-white/75 backdrop-blur-md">
          هذا أول حدث منشور لدينا حاليًا. تابعنا لمعرفة الأحداث القادمة.
        </section>
      )}
    </div>
  );
}
