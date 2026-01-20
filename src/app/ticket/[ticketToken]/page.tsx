import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getTicketByToken } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

type TicketPageProps = {
  params: Promise<{ ticketToken: string }> | { ticketToken: string };
};

export default async function TicketPage({ params }: TicketPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const ticket = await getTicketByToken(resolvedParams.ticketToken);

  if (!ticket) {
    notFound();
  }

  const qrDataUrl = await QRCode.toDataURL(ticket.qr_token, {
    margin: 1,
    width: 240,
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Your ticket</h1>
        <div className="mt-6 grid gap-4">
          <div>
            <p className="text-sm text-slate-500">Attendee</p>
            <p className="text-lg font-semibold text-slate-900">
              {ticket.attendee_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Ticket number</p>
            <p className="text-lg font-semibold text-slate-900">
              {ticket.ticket_number}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className="text-lg font-semibold text-slate-900">
              {ticket.checked_in_at ? "Checked in" : "Valid"}
            </p>
            {ticket.checked_in_at ? (
              <p className="text-sm text-slate-500">
                Checked in at {formatDateTime(ticket.checked_in_at)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">QR Code</h2>
        <p className="mt-2 text-sm text-slate-600">
          Show this QR code at the entrance for check-in.
        </p>
        <div className="mt-6 flex justify-center">
          <img
            src={qrDataUrl}
            alt="Ticket QR code"
            className="h-60 w-60"
          />
        </div>
      </div>
    </main>
  );
}
