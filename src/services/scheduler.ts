import type { AppData } from "@/types";

const notifiedKeys = new Set<string>();

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

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

/**
 * Checks enabled reminders and triggers each reminder once per day.
 */
export function checkAndTriggerReminders(data: AppData): void {
  if (typeof window === "undefined") {
    return;
  }

  const now = new Date();
  const todayIndex = now.getDay();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const reminder of data.reminders ?? []) {
    if (!reminder.enabled) {
      continue;
    }

    const reminderDays = reminder.days ?? [];
    const isToday =
      reminderDays.length === 0 || reminderDays.includes(todayIndex);

    const reminderMinutes = timeToMinutes(reminder.time);
    const key = `reminder-${reminder.id}-${todayStr}`;

    if (
      isToday &&
      currentMinutes === reminderMinutes &&
      !notifiedKeys.has(key)
    ) {
      // Mark before sending so repeated interval calls cannot duplicate it.
      notifiedKeys.add(key);
      sendNativeNotification(
        `⏰ ${reminder.title}`,
        `Il est ${reminder.time} !`,
      );
    }
  }
}
