const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};

export const stableFingerprint = (payload: unknown) =>
  JSON.stringify(canonicalize(payload));

export const createLatestRequestGate = () => {
  let sequence = 0;
  return {
    begin: () => ++sequence,
    isLatest: (request: number) => request === sequence,
  };
};

export const createIntentKeyStore = (generate = () => crypto.randomUUID()) => {
  let current: { fingerprint: string; key: string } | null = null;
  return {
    forPayload(payload: unknown) {
      const fingerprint = stableFingerprint(payload);
      if (current?.fingerprint !== fingerprint) {
        current = { fingerprint, key: generate() };
      }
      return current.key;
    },
    clear() {
      current = null;
    },
  };
};
