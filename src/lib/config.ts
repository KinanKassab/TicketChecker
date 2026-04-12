const required = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback: string) => {
  const value = process.env[key];
  if (!value) return fallback;
  return value;
};

const numberWithDevFallback = (key: string, fallback: number) => {
  const raw = process.env[key];
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required env var: ${key}`);
    }
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid number for env var: ${key}`);
  }
  return value;
};

type EventConfig = {
  name: string;
  date: string;
  location: string;
  ticketPriceSyp: number;
  currency: "SYP";
};

type MerchantConfig = {
  syriatel: string;
  mtn: string;
};

// Lazy initialization to avoid reading env vars at build time
let _eventConfig: EventConfig | null = null;
const getEventConfig = (): EventConfig => {
  if (!_eventConfig) {
    _eventConfig = {
      name: optional("EVENT_NAME", "FXI Summit 2026"),
      date: optional("EVENT_DATE", "١٥ أبريل ٢٠٢٦"),
      location: optional("EVENT_LOCATION", "الرياض، المملكة العربية السعودية"),
      ticketPriceSyp: numberWithDevFallback("TICKET_PRICE_SYP", 0),
      currency: "SYP" as const,
    };
  }
  return _eventConfig;
};

let _merchantConfig: MerchantConfig | null = null;
const getMerchantConfig = (): MerchantConfig => {
  if (!_merchantConfig) {
    _merchantConfig = {
      syriatel: required("SYRIATEL_MERCHANT_NUMBER"),
      mtn: required("MTN_MERCHANT_NUMBER"),
    };
  }
  return _merchantConfig;
};

let _baseUrl: string | null = null;
const getBaseUrl = () => {
  if (!_baseUrl) {
    _baseUrl = required("BASE_URL");
  }
  return _baseUrl;
};

// Export as getters using Proxy to avoid reading env vars at build time
export const eventConfig = new Proxy({} as EventConfig, {
  get(_target, prop) {
    return getEventConfig()[prop as keyof EventConfig];
  },
});

export const merchantConfig = new Proxy({} as MerchantConfig, {
  get(_target, prop) {
    return getMerchantConfig()[prop as keyof MerchantConfig];
  },
});

export const baseUrl = new Proxy({} as { valueOf(): string; toString(): string }, {
  get(_target, prop) {
    if (prop === "valueOf" || prop === "toString") {
      return () => getBaseUrl();
    }
    return getBaseUrl();
  },
}) as unknown as string;
