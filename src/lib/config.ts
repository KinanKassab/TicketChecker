const required = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const numberRequired = (key: string) => {
  const raw = required(key);
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid number for env var: ${key}`);
  }
  return value;
};

export const eventConfig = {
  name: required("EVENT_NAME"),
  date: required("EVENT_DATE"),
  location: required("EVENT_LOCATION"),
  ticketPriceSyp: numberRequired("TICKET_PRICE_SYP"),
  currency: "SYP" as const,
};

export const merchantConfig = {
  syriatel: required("SYRIATEL_MERCHANT_NUMBER"),
  mtn: required("MTN_MERCHANT_NUMBER"),
};

export const baseUrl = required("BASE_URL");
