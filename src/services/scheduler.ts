import type { AppData } from "@/types";
import { sendNativeNotification } from "./notifications";

const notifiedKeys = new Set<string>();

export function checkAndTriggerReminders(data: AppData) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!data || !data.reminders || data.reminders.length === 0) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Dimanche = 0 -> 6, Lundi = 1 -> 0, Mardi = 2 -> 1, etc.
  const jsDay = now.getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

  const todayStr = now.toISOString().split("T")[0];

  data.reminders
    .filter((r) => r.enabled)
    .forEach((r) => {
      // Si jours vides = tous les jours, sinon vérifie le jour de la semaine
      const isToday = !r.days || r.days.length === 0 || r.days.includes(todayIndex);

      if (!r.time) return;
      const [rHours, rMinutes] = r.time.split(":").map(Number);
      const reminderMinutes = rHours * 60 + rMinutes;

      const key = `reminder-${r.id}-${todayStr}-${r.time}`;

      if (isToday && currentMinutes === reminderMinutes && !notifiedKeys.has(key)) {
        sendNativeNotification(`⏰ ${r.title}`, `Il est ${r.time} !`);
        notifiedKeys.add(key);
      }
    });
}
