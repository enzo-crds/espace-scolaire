type Reminder = {
  id: string;
  title: string;
  time: string;       // HH:mm
  days?: number[];    // 0 = Sunday, 6 = Saturday
  enabled: boolean;
};

type ReminderData = {
  reminders?: Reminder[];
};

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
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  new Notification(title, { body });
}

export function checkAndTriggerReminders(data: ReminderData): void {
  const now = new Date();
  const todayIndex = now.getDay();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const reminder of data.reminders ?? []) {
    if (!reminder.enabled) continue;

    const days = reminder.days ?? [];
    const isToday = days.length === 0 || days.includes(todayIndex);
    const reminderMinutes = timeToMinutes(reminder.time);

    if (!isToday || reminderMinutes !== currentMinutes) continue;

    const key = `${reminder.id}-${today}`;

    if (notifiedKeys.has(key)) continue;

    // Mark first because DataContext checks reminders immediately and every minute.
    notifiedKeys.add(key);

    sendNativeNotification(
      `⏰ ${reminder.title}`,
      `Il est ${reminder.time} !`,
    );
  }
}
