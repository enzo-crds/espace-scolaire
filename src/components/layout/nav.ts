import { Home, BookOpen, NotebookText, BarChart3, Calculator, CalendarDays, Settings, Dumbbell } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Accueil", icon: Home, end: true },
  { to: "/cours", label: "Cours", icon: BookOpen },
  { to: "/fiches", label: "Fiches", icon: NotebookText },
  { to: "/notes", label: "Notes", icon: BarChart3 },
  { to: "/calculateur", label: "Calculateur", icon: Calculator },
  { to: "/emploi-du-temps", label: "Emploi du temps", icon: CalendarDays },
  { to: "/parametres", label: "Paramètres", icon: Settings },
  { to: "/exercices", label: "Exercices", icon: Dumbbell },
];
