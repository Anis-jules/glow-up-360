import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import DashboardPage from './features/dashboard/DashboardPage';

// Les rubriques se chargent à la demande : l'accueil s'affiche plus vite.
const SportPage = lazy(() => import('./features/sport/SportPage'));
const NutritionPage = lazy(() => import('./features/nutrition/NutritionPage'));
const FacePage = lazy(() => import('./features/face/FacePage'));
const MindPage = lazy(() => import('./features/mind/MindPage'));
const HabitsPage = lazy(() => import('./features/habits/HabitsPage'));
const StatsPage = lazy(() => import('./features/stats/StatsPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));
const RemindersPage = lazy(() => import('./features/reminders/RemindersPage'));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
      <div className="size-8 animate-spin rounded-full border-[3px] border-ink/10 border-t-accent" />
    </div>
  );
}

const page = (el: React.ReactNode) => <Suspense fallback={<PageFallback />}>{el}</Suspense>;

// HashRouter : fonctionne sur n'importe quel hébergement statique, sans réglage serveur.
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="sport" element={page(<SportPage />)} />
          <Route path="nutrition" element={page(<NutritionPage />)} />
          <Route path="visage" element={page(<FacePage />)} />
          <Route path="esprit" element={page(<MindPage />)} />
          <Route path="habitudes" element={page(<HabitsPage />)} />
          <Route path="statistiques" element={page(<StatsPage />)} />
          <Route path="parametres" element={page(<SettingsPage />)} />
          <Route path="rappels" element={page(<RemindersPage />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
