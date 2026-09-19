import type { AppData } from "@/types";

const notifiedKeys = new Set<string>();

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return -1;
  }

  return hours * 60 + minutes;
}

function sendNativeNotification(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

export function checkAndTriggerReminders(data: AppData): void {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayIndex = (now.getDay() + 6) % 7; // Lundi = 0 ... Dimanche = 6
  const todayStr = now.toISOString().slice(0, 10);

  for (const reminder of data.reminders ?? []) {
    if (!reminder.enabled) continue;

    const isToday =
      reminder.days.length === 0 || reminder.days.includes(todayIndex);

    const reminderMinutes = timeToMinutes(reminder.time);
    if (!isToday || reminderMinutes !== currentMinutes) continue;

    const key = `reminder-${reminder.id}-${todayStr}`;
    if (notifiedKeys.has(key)) continue;

    sendNativeNotification(`⏰ ${reminder.title}`, `Il est ${reminder.time} !`);
    notifiedKeys.add(key);
  }
}
