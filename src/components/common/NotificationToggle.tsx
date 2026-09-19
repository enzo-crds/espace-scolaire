import { useEffect, useState } from "react";
import { sendNativeNotification } from "@/services/notifications";

type NotificationState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export function NotificationToggle() {
  const [permission, setPermission] = useState<NotificationState>("default");

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission);
  }, []);

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      sendNativeNotification(
        "Notifications activées ! 🔔",
        "Vous recevrez désormais les rappels de vos cours et devoirs."
      );
    }
  };

  if (permission === "unsupported") {
    return (
      <p className="text-sm text-slate-500">
        Les notifications ne sont pas prises en charge sur ce navigateur. (Pensez à ajouter l'application sur l'écran d'accueil de votre téléphone si vous êtes sur iOS).
      </p>
    );
  }

  if (permission === "granted") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          ✓ Notifications activées
        </span>
        <span className="text-xs text-slate-400">
          Gérable dans les paramètres du navigateur / système.
        </span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <p className="text-sm text-rose-500">
        Les notifications sont bloquées. Réautorisez-les dans les paramètres de votre navigateur ou de votre téléphone.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={enableNotifications}
      className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
    >
      Activer les notifications
    </button>
  );
}
