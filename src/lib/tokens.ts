import { randomBytes } from "crypto";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomFromAlphabet = (length: number) => {
  const bytes = randomBytes(length);
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += alphabet[bytes[i] % alphabet.length];
  }
  return output;
};

export const generateOrderToken = () => randomBytes(18).toString("hex");
export const generateTicketToken = () => randomBytes(18).toString("hex");
export const generateQrToken = () => randomBytes(16).toString("hex");
export const generateAgentCode = () => randomFromAlphabet(8);
export const generateReferenceCode = () => `EVT-${randomFromAlphabet(5)}`;
