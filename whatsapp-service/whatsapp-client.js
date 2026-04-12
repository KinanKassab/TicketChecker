const { Client, LocalAuth } = require("whatsapp-web.js");
const qrTerminal = require("qrcode-terminal");
const fs = require("fs");

class WhatsAppServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "WhatsAppServiceError";
    this.code = code;
  }
}

let hasStartedClient = false;
let isClientReady = false;
let hasAuthenticated = false;
let lastDisconnectReason = "Client has not connected yet.";

function resolveChromeExecutablePath() {
  const envPath = process.env.whatsAppChromePath;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  const commonWindowsPath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  if (fs.existsSync(commonWindowsPath)) {
    return commonWindowsPath;
  }

  return undefined;
}

const chromeExecutablePath = resolveChromeExecutablePath();
const authDataPath = process.env.whatsAppAuthDataPath;

const whatsappClient = new Client({
  authStrategy: new LocalAuth({
    clientId: process.env.whatsAppClientId || "mainClient",
    dataPath: authDataPath || undefined
  }),
  puppeteer: {
    headless: process.env.whatsAppHeadless !== "false",
    executablePath: chromeExecutablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

whatsappClient.on("qr", (qrCodeText) => {
  console.log("\nScan this QR code with your WhatsApp mobile app:\n");
  qrTerminal.generate(qrCodeText, { small: true });
  console.log("\nWaiting for scan confirmation...\n");
});

whatsappClient.on("authenticated", () => {
  hasAuthenticated = true;
  console.log("WhatsApp authentication successful.");
});

whatsappClient.on("ready", () => {
  isClientReady = true;
  lastDisconnectReason = "";
  console.log("WhatsApp client is ready to send messages.");
});

whatsappClient.on("disconnected", (reason) => {
  isClientReady = false;
  lastDisconnectReason = reason || "Unknown disconnect reason.";
  console.error(`WhatsApp client disconnected: ${lastDisconnectReason}`);
});

whatsappClient.on("auth_failure", (failureMessage) => {
  hasAuthenticated = false;
  isClientReady = false;
  console.error(`WhatsApp authentication failed: ${failureMessage}`);
});

function initializeWhatsAppClient() {
  if (hasStartedClient) {
    return;
  }

  hasStartedClient = true;
  console.log("Initializing WhatsApp client...");
  whatsappClient.initialize().catch((error) => {
    isClientReady = false;
    const reasonText = error?.message || "Unknown initialization error.";
    lastDisconnectReason = reasonText;
    console.error(
      "WhatsApp initialization failed. Set `whatsAppChromePath` to a valid Chrome executable or run `npx puppeteer browsers install chrome`."
    );
    console.error(reasonText);
  });
}

function getClientStatus() {
  return {
    hasStartedClient,
    hasAuthenticated,
    isClientReady,
    lastDisconnectReason
  };
}

async function sendWhatsAppMessage(chatId, messageText) {
  if (!hasStartedClient) {
    throw new WhatsAppServiceError(
      "WhatsApp client is not initialized yet.",
      "clientNotInitialized"
    );
  }

  if (!isClientReady) {
    throw new WhatsAppServiceError(
      "WhatsApp client is not ready. Make sure your phone is online and linked.",
      "clientNotReady"
    );
  }

  try {
    const sentMessage = await whatsappClient.sendMessage(chatId, messageText);

    return {
      messageId: sentMessage.id?.id || "",
      timestamp: sentMessage.timestamp || Date.now()
    };
  } catch (error) {
    throw new WhatsAppServiceError(
      error?.message || "Failed to send WhatsApp message.",
      "sendFailed"
    );
  }
}

module.exports = {
  WhatsAppServiceError,
  initializeWhatsAppClient,
  getClientStatus,
  sendWhatsAppMessage
};
