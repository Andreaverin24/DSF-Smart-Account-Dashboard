import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { routes, type RouteId } from './routes';

export function App() {
  const [activeRoute, setActiveRoute] = useState<RouteId>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = useMemo(() => routes.find((route) => route.id === activeRoute) ?? routes[0]!, [activeRoute]);
  const ActivePage = active.component;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <AppShell
      routes={routes}
      activeRoute={activeRoute}
      onRouteChange={setActiveRoute}
      theme={theme}
      onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
    >
      <ActivePage />
    </AppShell>
  );
}
