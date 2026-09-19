// À ajouter dans la fonction checkAndTriggerReminders :
if (data.reminders) {
  data.reminders
    .filter((r) => r.enabled)
    .forEach((r) => {
      const isToday = r.days.length === 0 || r.days.includes(todayIndex);
      const reminderMin = timeToMinutes(r.time);
      const key = `reminder-${r.id}-${todayStr}`;

      if (isToday && currentMinutes === reminderMin && !notifiedKeys.has(key)) {
        sendNativeNotification(`⏰ ${r.title}`, `Il est ${r.time} !`);
        notifiedKeys.add(key);
      }
    });
}
