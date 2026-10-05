export function pkr(value: number) {
  return `PKR ${value.toLocaleString("en-PK")}`;
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
