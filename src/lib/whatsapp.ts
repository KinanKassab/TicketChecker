type SendWhatsAppParams = {
  phoneNumber: string;
  messageText: string;
};

function normalizePhoneNumber(phoneNumber: string) {
  return String(phoneNumber || "").replace(/[^\d]/g, "");
}

export function isWhatsAppServiceConfigured() {
  return Boolean(process.env.WHATSAPP_SERVICE_URL);
}

export async function sendWhatsAppMessage({
  phoneNumber,
  messageText,
}: SendWhatsAppParams) {
  const serviceUrl = process.env.WHATSAPP_SERVICE_URL;
  if (!serviceUrl) {
    return { ok: false, reason: "missingServiceUrl" as const };
  }

  const cleanPhoneNumber = normalizePhoneNumber(phoneNumber);
  if (!cleanPhoneNumber || !messageText.trim()) {
    return { ok: false, reason: "invalidPayload" as const };
  }

  const endpoint = new URL("/api/messages/send", serviceUrl).toString();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.WHATSAPP_SERVICE_TOKEN) {
    headers.Authorization = `Bearer ${process.env.WHATSAPP_SERVICE_TOKEN}`;
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 10000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        phoneNumber: cleanPhoneNumber,
        messageText: messageText.trim(),
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const responseText = await response.text();
      return {
        ok: false,
        reason: "serviceError" as const,
        status: response.status,
        responseText,
      };
    }

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false,
      reason: "networkError" as const,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    clearTimeout(timeout);
  }
}
