/** randomUUID is a secure-context API; LAN HTTP previews still expose getRandomValues. */
export function installUUIDFallback(
  target: Pick<Crypto, "getRandomValues"> &
    Partial<Pick<Crypto, "randomUUID">> = crypto,
) {
  if (typeof target.randomUUID === "function") return;
  Object.defineProperty(target, "randomUUID", {
    configurable: true,
    value: () => {
      const bytes = target.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      const hex = Array.from(bytes, (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    },
  });
}
