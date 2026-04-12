import { NextResponse } from "next/server";
import {
  getTicketByNumber,
  getTicketByQrToken,
  getTicketByToken,
  updateTicketCheckIn,
} from "@/lib/db";
import { staffCheckinSchema } from "@/lib/validation";
import { formatDateTime } from "@/lib/format";

function extractToken(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const queryToken =
      url.searchParams.get("qrToken") ??
      url.searchParams.get("qr") ??
      url.searchParams.get("token") ??
      "";
    if (queryToken) return queryToken.trim();

    const parts = url.pathname.split("/").filter(Boolean);
    const lastPart = parts.at(-1) ?? "";
    return lastPart.trim() || raw;
  } catch {
    return raw;
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = staffCheckinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "رقم التذكرة غير صالح." },
      { status: 400 }
    );
  }

  const extractedToken = extractToken(parsed.data.qrToken);
  let ticket = await getTicketByQrToken(extractedToken);
  let qrTokenToUpdate = extractedToken;

  // Support full ticket links where the last segment is ticket_token.
  if (!ticket) {
    const ticketByToken = await getTicketByToken(extractedToken);
    if (ticketByToken) {
      ticket = ticketByToken;
      qrTokenToUpdate = ticketByToken.qr_token;
    }
  }

  // Support direct manual check-in by ticket number.
  if (!ticket) {
    const ticketByNumber = await getTicketByNumber(extractedToken);
    if (ticketByNumber) {
      ticket = ticketByNumber;
      qrTokenToUpdate = ticketByNumber.qr_token;
    }
  }

  if (!ticket) {
    return NextResponse.json(
      { message: "لم يتم العثور على التذكرة." },
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

  const updated = await updateTicketCheckIn(qrTokenToUpdate);

  return NextResponse.json({
    status: "success",
    attendeeName: updated.attendee_name,
    ticketNumber: updated.ticket_number,
  });
}
