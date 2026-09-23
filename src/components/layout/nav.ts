import { Home, BookOpen, BarChart3, Calculator, CalendarClock, Settings, CheckSquare } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Accueil", end: true, icon: Home },
  { to: "/cours", label: "Cours", icon: BookOpen },
  { to: "/devoirs", label: "Devoirs / Évals", icon: CheckSquare },
  { to: "/notes", label: "Notes", icon: BarChart3 },
  { to: "/calculateur", label: "Calculateur", icon: Calculator },
  { to: "/emploi-du-temps", label: "Emploi du temps", icon: CalendarClock },
  { to: "/parametres", label: "Paramètres", icon: Settings },
];
