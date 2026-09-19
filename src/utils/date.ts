export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = Math.round(minutes % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}`;
}

/** Retourne l'index du jour actuel selon la convention 0 = Lundi ... 6 = Dimanche */
export function currentDayIndex(): number {
  const jsDay = new Date().getDay(); // 0 = dimanche
  return jsDay === 0 ? 6 : jsDay - 1;
}
