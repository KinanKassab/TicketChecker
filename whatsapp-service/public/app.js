const messageForm = document.getElementById("messageForm");
const phoneNumberInput = document.getElementById("phoneNumberInput");
const messageTextInput = document.getElementById("messageTextInput");
const submitButton = document.getElementById("submitButton");
const feedbackBanner = document.getElementById("feedbackBanner");
const statusBanner = document.getElementById("statusBanner");

function showBanner(targetElement, tone, text) {
  targetElement.className = `${targetElement.id === "feedbackBanner" ? "feedbackBanner" : "statusBanner"} ${tone}`;
  targetElement.textContent = text;
  targetElement.classList.remove("hidden");
}

function hideFeedback() {
  feedbackBanner.className = "feedbackBanner hidden";
  feedbackBanner.textContent = "";
}

function setLoadingState(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Sending..." : "Send message";
}

function validateFormValues(phoneNumber, messageText) {
  const cleanPhone = phoneNumber.replace(/[^\d]/g, "");
  if (cleanPhone.length < 8 || cleanPhone.length > 15) {
    throw new Error("Please enter a valid phone number with country code (8 to 15 digits).");
  }

  if (!messageText.trim()) {
    throw new Error("Message text cannot be empty.");
  }
}

async function refreshStatus() {
  try {
    const response = await fetch("/api/status");
    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      throw new Error("Unable to read WhatsApp status.");
    }

    if (payload.status?.isClientReady) {
      showBanner(statusBanner, "success", "WhatsApp is connected and ready.");
      return;
    }

    const reasonText = payload.status?.lastDisconnectReason
      ? ` Reason: ${payload.status.lastDisconnectReason}`
      : "";
    showBanner(
      statusBanner,
      "info",
      `WhatsApp is not ready yet. Scan the QR in your terminal if needed.${reasonText}`
    );
  } catch (error) {
    showBanner(
      statusBanner,
      "error",
      "Could not check WhatsApp status. Confirm the backend service is running."
    );
  }
}

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideFeedback();

  const phoneNumber = phoneNumberInput.value.trim();
  const messageText = messageTextInput.value.trim();

  try {
    validateFormValues(phoneNumber, messageText);
    setLoadingState(true);

    const response = await fetch("/api/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phoneNumber,
        messageText
      })
    });

    const payload = await response.json();

    if (!response.ok || !payload?.ok) {
      const apiMessage =
        payload?.message || "Failed to send message. Please verify number and connection.";
      showBanner(feedbackBanner, "error", apiMessage);
      return;
    }

    showBanner(
      feedbackBanner,
      "success",
      `Message sent successfully to ${payload.data?.phoneNumber || phoneNumber}.`
    );
    messageTextInput.value = "";
    await refreshStatus();
  } catch (error) {
    showBanner(feedbackBanner, "error", error.message || "Failed to send message.");
  } finally {
    setLoadingState(false);
  }
});

refreshStatus();
