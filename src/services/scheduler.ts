import type { AppData } from "@/types";

export function checkAndTriggerReminders(data: AppData) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();
  // Calcule l'heure dans 5 minutes
  const alertTime = new Date(now.getTime() + 5 * 60000);
  const hours = String(alertTime.getHours()).padStart(2, "0");
  const minutes = String(alertTime.getMinutes()).padStart(2, "0");
  const targetTimeStr = `${hours}:${minutes}`;

  // JS getDay(): 0=Dimanche, 1=Lundi, ..., 5=Vendredi
  const jsDay = now.getDay();
  if (jsDay === 0 || jsDay === 6) return; // Pas cours le week-end
  const expectedSlotDay = jsDay - 1; // 1 (Lundi) -> 0, etc.

  const currentWeek = data.settings?.currentWeek || "A";

  const matchingSlot = data.schedule.find((slot) => {
    const timeMatch = slot.start === targetTimeStr;
    const dayMatch = slot.day === expectedSlotDay;
    const weekMatch = slot.week === "BOTH" || slot.week === currentWeek;
    return timeMatch && dayMatch && weekMatch;
  });

  if (matchingSlot) {
    const notifKey = `notif_sent_${matchingSlot.id}_${targetTimeStr}`;
    if (sessionStorage.getItem(notifKey)) return;
    sessionStorage.setItem(notifKey, "true");

    const subject = data.subjects.find((s) => s.id === matchingSlot.subjectId);
    const subjectName = subject ? subject.name : (matchingSlot.label || "Cours");
    const roomStr = matchingSlot.room ? ` en ${matchingSlot.room}` : "";

    new Notification("Espace Scolaire", {
      body: `T'as cours de ${subjectName}${roomStr}`,
      tag: `next-course-${matchingSlot.id || targetTimeStr}`,
    });
  }
}
