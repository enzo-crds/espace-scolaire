je mets où ce code là import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { requestNotificationPermission, sendNativeNotification } from "@/services/notifications";

export function NotificationToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setEnabled(granted);
    if (granted) {
      sendNativeNotification("Notifications activées ! 🔔", "Vous recevrez désormais les rappels de vos cours et devoirs.");
    }
  };

  return (
    <button
      onClick={handleEnable}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
        enabled
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-[var(--accent)] text-white"
      }`}
    >
      <Bell className="h-4 w-4" />
      {enabled ? "Notifications actives" : "Activer les notifications"}
    </button>
  );
}
