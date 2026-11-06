/** Match the protected WorldStore's 60 UTF-16-unit name limit before uniqueness checks. */
export function adventureCopyName(
  original: string,
  label: "interiors" | "updated adventure" | "recovered",
  used: ReadonlySet<string>,
) {
  const base = original.trim() || "Adventure";
  for (let index = 1; ; index++) {
    const tail = ` · ${label}${index === 1 ? "" : " " + index}`,
      prefix = base
        .slice(0, 60 - tail.length)
        .replace(/[\uD800-\uDBFF]$/, "")
        .trimEnd(),
      candidate = prefix + tail;
    if (!used.has(candidate)) return candidate;
  }
}
