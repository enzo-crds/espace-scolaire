import type { AppData } from "@/types";
import { sendNativeNotification } from "./notifications";

const notifiedKeys = new Set<string>();

export function checkAndTriggerReminders(data: AppData) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!data.reminders || data.reminders.length === 0) return;

  const now = new Date();
  
  // Convertit l'heure actuelle en minutes (ex: 14h30 -> 14 * 60 + 30 = 870)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Dimanche = 0, Lundi = 1, ..., Samedi = 6 dans DateJS
  // On adapte pour aligner avec ton tableau : Lundi = 0, Mardi = 1, ..., Dimanche = 6
  const jsDay = now.getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1; 

  const todayStr = now.toISOString().split("T")[0];

  data.reminders
    .filter((r) => r.enabled)
    .forEach((r) => {
      // Vérifie si le jour actuel fait partie des jours sélectionnés
      const isToday = r.days.length === 0 || r.days.includes(todayIndex);

      // Convertit l'heure du rappel (ex: "07:30") en minutes
      const [rHours, rMinutes] = r.time.split(":").map(Number);
      const reminderMinutes = rHours * 60 + rMinutes;

      const key = `reminder-${r.id}-${todayStr}`;

      // Si l'heure correspond et qu'on ne l'a pas déjà notifiée aujourd'hui
      if (isToday && currentMinutes === reminderMinutes && !notifiedKeys.has(key)) {
        sendNativeNotification(`⏰ ${r.title}`, `Il est ${r.time} !`);
        notifiedKeys.add(key);
      }
    });
}
