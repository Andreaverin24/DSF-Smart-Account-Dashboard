import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { pathForRoute, routeFromPath, routes, type RouteId } from './routes';

export function App() {
  const [activeRoute, setActiveRoute] = useState<RouteId>(() => routeFromPath(window.location.pathname));
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = useMemo(() => routes.find((route) => route.id === activeRoute) ?? routes[0]!, [activeRoute]);
  const ActivePage = active.component;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    function handlePopState() {
      setActiveRoute(routeFromPath(window.location.pathname));
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function handleRouteChange(route: RouteId) {
    const nextPath = pathForRoute(route);
    setActiveRoute(route);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
  }

  return (
    <AppShell
      routes={routes}
      activeRoute={activeRoute}
      onRouteChange={handleRouteChange}
      theme={theme}
      onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
    >
      <ActivePage />
    </AppShell>
  );
}
