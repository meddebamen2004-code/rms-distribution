export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return toISODate(new Date());
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const dt = parse(iso);
  dt.setDate(dt.getDate() + n);
  return toISODate(dt);
}

export function mondayOf(iso: string): string {
  const dow = (parse(iso).getDay() + 6) % 7; // lundi = 0
  return addDays(iso, -dow);
}

export function isValidISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parse(s).getTime());
}

export function labelJour(iso: string): string {
  return parse(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}