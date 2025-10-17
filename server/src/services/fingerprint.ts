import crypto from "crypto";

export function normalizeText(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[€]/g, "E")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function ymd(d: Date) {
  return d.toISOString().slice(0,10); // YYYY-MM-DD
}

export function to2(n: number) {
  return Number((Math.round(n*100)/100).toFixed(2));
}

export function makeFingerprint(input: {
  bank: string;
  dateOperation: Date;
  amount: number;
  label: string;
  details?: string | null;
  accountIban?: string | null;
}) {
  const base = [
    input.bank || "",
    ymd(input.dateOperation),
    to2(input.amount).toFixed(2),
    normalizeText(`${input.label || ""} ${input.details || ""}`),
    input.accountIban || "" // optionnel
  ].join("|");
  return crypto.createHash("sha1").update(base).digest("hex");
}
