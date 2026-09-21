import type { AppData } from "@/types";

export function checkAndTriggerReminders(data: AppData) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();
  // On calcule l'heure dans 5 minutes
  const alertTime = new Date(now.getTime() + 5 * 60000);
  const hours = String(alertTime.getHours()).padStart(2, "0");
  const minutes = String(alertTime.getMinutes()).padStart(2, "0");
  const targetTimeStr = `${hours}:${minutes}`;

  // Jour de la semaine (1 = Lundi ... 5 = Vendredi, selon comment tu stockes `slot.day`)
  const jsDay = now.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
  const dayMapping: Record<number, any[]> = {
    1:,
    2:,
    3:,
    4:,
    5:,
  };
  const todayKeys = dayMapping[jsDay] || [];

  // Cherche un cours qui commence dans 5 minutes
  const matchingSlot = data.schedule.find((slot: any) => {
    const slotStart = slot.startTime || slot.start;
    const slotDay = slot.day;
    const timeMatch = slotStart === targetTimeStr;
    const dayMatch = todayKeys.includes(slotDay);
    return timeMatch && dayMatch;
  });

  if (matchingSlot) {
    // Évite de spammer la notif en boucle pendant la même minute
    const notifKey = `notif_sent_${matchingSlot.id || targetTimeStr}_${targetTimeStr}`;
    if (sessionStorage.getItem(notifKey)) return;
    sessionStorage.setItem(notifKey, "true");

    const subject = data.subjects.find((s) => s.id === matchingSlot.subjectId);
    const subjectName = subject?.name || "Cours";
    const room = matchingSlot.room || "salle inconnue";

    new Notification("Espace Scolaire", {
      body: `T'as cours de ${subjectName} en ${room}`,
      tag: `next-course-${matchingSlot.id || targetTimeStr}`,
    });
  }
}
