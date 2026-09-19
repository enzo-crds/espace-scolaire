import { useEffect, useState } from "react";
import { Bell, Send } from "lucide-react";
import { sendNativeNotification, requestNotificationPermission } from "@/services/notifications";

type NotificationState = "unsupported" | "default" | "granted" | "denied";

export function NotificationToggle() {
  const [permission, setPermission] = useState<NotificationState>("default");

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as NotificationState);
  }, []);

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    const result = await requestNotificationPermission();
    setPermission(result ? "granted" : (Notification.permission as NotificationState));

    if (result) {
      sendNativeNotification(
        "Notifications activées ! 🔔",
        "Vous recevrez désormais les rappels de vos cours et devoirs."
      );
    }
  };

  const handleTestNotification = () => {
    sendNativeNotification(
      "Test de notification ⏰",
      "Si tu vois ce message, les notifications fonctionnent parfaitement !"
    );
  };

  if (permission === "unsupported") {
    return (
      <p className="text-sm text-slate-500">
        Les notifications ne sont pas prises en charge par ce navigateur. (Installe l'application sur l'écran d'accueil si tu es sur iPhone).
      </p>
    );
  }

  if (permission === "granted") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <Bell className="h-4 w-4" /> Notifications actives
        </span>

        <button
          type="button"
          onClick={handleTestNotification}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          <Send className="h-3.5 w-3.5" /> Tester la notification
        </button>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <p className="text-sm text-rose-500">
        Les notifications sont bloquées. Réautorise-les dans les paramètres de ton navigateur ou de ton téléphone.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={enableNotifications}
      className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
    >
      <Bell className="h-4 w-4" /> Activer les notifications
    </button>
  );
}
