import { NextResponse } from "next/server";
import { getTicketByQrToken, updateTicketCheckIn } from "@/lib/db";
import { staffCheckinSchema } from "@/lib/validation";
import { formatDateTime } from "@/lib/format";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = staffCheckinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid QR token." },
      { status: 400 }
    );
  }

  const ticket = await getTicketByQrToken(parsed.data.qrToken);

  if (!ticket) {
    return NextResponse.json(
      { message: "Ticket not found." },
      { status: 404 }
    );
  }

  if (ticket.checked_in_at) {
    return NextResponse.json({
      status: "already_checked_in",
      attendeeName: ticket.attendee_name,
      ticketNumber: ticket.ticket_number,
      checkedInAt: formatDateTime(ticket.checked_in_at),
    });
  }

  const updated = await updateTicketCheckIn(parsed.data.qrToken);

  return NextResponse.json({
    status: "success",
    attendeeName: updated.attendee_name,
    ticketNumber: updated.ticket_number,
  });
}
