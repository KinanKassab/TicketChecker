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
      name: required("EVENT_NAME"),
      date: required("EVENT_DATE"),
      location: required("EVENT_LOCATION"),
      ticketPriceSyp: numberRequired("TICKET_PRICE_SYP"),
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
