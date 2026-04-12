const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const {
  WhatsAppServiceError,
  getClientStatus,
  initializeWhatsAppClient,
  sendWhatsAppMessage
} = require("./whatsapp-client");

dotenv.config();

const app = express();
const servicePort = Number(process.env.PORT || process.env.servicePort || 3600);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use((error, request, response, nextFunction) => {
  if (error?.type === "entity.parse.failed") {
    response.status(400).json({
      ok: false,
      code: "invalidJson",
      message: "Request body must be valid JSON."
    });
    return;
  }

  nextFunction(error);
});

function normalizePhoneNumber(inputPhone) {
  const cleanPhone = String(inputPhone || "").replace(/[^\d]/g, "");
  if (!cleanPhone) {
    throw new WhatsAppServiceError("Phone number is required.", "invalidPhone");
  }

  if (cleanPhone.length < 8 || cleanPhone.length > 15) {
    throw new WhatsAppServiceError(
      "Phone number must contain 8 to 15 digits with country code.",
      "invalidPhone"
    );
  }

  return cleanPhone;
}

function validateMessageText(inputMessage) {
  const messageText = String(inputMessage || "").trim();
  if (!messageText) {
    throw new WhatsAppServiceError("Message text is required.", "invalidMessage");
  }

  if (messageText.length > 4096) {
    throw new WhatsAppServiceError(
      "Message is too long. Please keep it under 4096 characters.",
      "invalidMessage"
    );
  }

  return messageText;
}

function mapSendError(error) {
  if (!(error instanceof WhatsAppServiceError)) {
    return {
      statusCode: 500,
      code: "unknownError",
      message: "Unexpected server error while sending message."
    };
  }

  const statusMap = {
    invalidPhone: 400,
    invalidMessage: 400,
    clientNotInitialized: 503,
    clientNotReady: 503,
    sendFailed: 502
  };

  return {
    statusCode: statusMap[error.code] || 500,
    code: error.code || "serviceError",
    message: error.message
  };
}

function hasValidServiceToken(request) {
  const expectedToken = process.env.WHATSAPP_SERVICE_TOKEN;
  if (!expectedToken) {
    return true;
  }

  const authHeader = String(request.headers.authorization || "");
  if (!authHeader.startsWith("Bearer ")) {
    return false;
  }

  const providedToken = authHeader.slice("Bearer ".length).trim();
  return providedToken === expectedToken;
}

app.get("/api/status", (request, response) => {
  const statusData = getClientStatus();
  response.json({
    ok: true,
    status: statusData
  });
});

app.post("/api/messages/send", async (request, response) => {
  if (!hasValidServiceToken(request)) {
    response.status(401).json({
      ok: false,
      code: "unauthorized",
      message: "Missing or invalid authorization token."
    });
    return;
  }

  try {
    const phoneNumber = normalizePhoneNumber(request.body?.phoneNumber);
    const messageText = validateMessageText(request.body?.messageText);
    const chatId = `${phoneNumber}@c.us`;

    const sentData = await sendWhatsAppMessage(chatId, messageText);

    response.json({
      ok: true,
      message: "Message sent successfully.",
      data: {
        phoneNumber,
        chatId,
        ...sentData
      }
    });
  } catch (error) {
    const mappedError = mapSendError(error);
    response.status(mappedError.statusCode).json({
      ok: false,
      code: mappedError.code,
      message: mappedError.message,
      status: getClientStatus()
    });
  }
});

app.use((request, response) => {
  response.status(404).json({
    ok: false,
    code: "notFound",
    message: "Endpoint not found."
  });
});

initializeWhatsAppClient();

const httpServer = app.listen(servicePort, () => {
  console.log(`WhatsApp service is running on http://localhost:${servicePort}`);
});

httpServer.on("error", (error) => {
  if (error?.code === "EADDRINUSE") {
    console.error(
      `Port ${servicePort} is already in use. Stop the old process or set servicePort to a different value in .env.`
    );
    process.exit(1);
  }

  console.error("Unexpected server startup error:", error);
  process.exit(1);
});
