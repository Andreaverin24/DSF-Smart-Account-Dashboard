import { Menu, Moon, Sun, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { demoNotice } from '../../domain/mockData';
import type { AppRoute, RouteId } from '../../app/routes';
import { Button } from '../ui/Button';

interface AppShellProps {
  routes: AppRoute[];
  activeRoute: RouteId;
  onRouteChange: (route: RouteId) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function AppShell({
  routes,
  activeRoute,
  onRouteChange,
  theme,
  onToggleTheme,
  mobileOpen,
  onMobileOpenChange,
  children,
}: AppShellProps) {
  const active = routes.find((route) => route.id === activeRoute) ?? routes[0]!;

  function navigate(route: RouteId) {
    onRouteChange(route);
    onMobileOpenChange(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const nav = (
    <nav aria-label="Основная навигация" className="flex flex-col gap-1">
      {routes.map((route) => {
        const Icon = route.icon;
        const selected = route.id === activeRoute;
        return (
          <button
            key={route.id}
            type="button"
            onClick={() => navigate(route.id)}
            className={`dsf-nav-button flex min-h-12 items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
              selected ? 'dsf-nav-button-active' : 'dsf-nav-button-idle'
            }`}
            aria-current={selected ? 'page' : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block font-semibold">{route.label}</span>
              <span className={`block truncate text-xs ${selected ? 'text-slate-900' : 'dsf-nav-description'}`}>
                {route.description}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="app-root min-h-screen transition-colors" data-theme={theme}>
      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-r border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-surface-900/95 lg:block">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">DSF Wallet</p>
            <h1 className="mt-2 text-2xl font-semibold">Smart Account</h1>
            <p className="mt-2 text-sm text-muted">Интерактивная модель ERC-4337 и Account Abstraction.</p>
          </div>
          {nav}
        </aside>

        <div>
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-surface-100/85 backdrop-blur dark:border-white/10 dark:bg-surface-950/85">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="dsf-icon-button rounded-md p-2 lg:hidden"
                  aria-label="Открыть меню"
                  onClick={() => onMobileOpenChange(true)}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm text-muted">{active.description}</p>
                  <h2 className="truncate text-lg font-semibold">{active.label}</h2>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
                icon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              >
                <span className="hidden sm:inline">{theme === 'dark' ? 'Светлая' : 'Тёмная'}</span>
              </Button>
            </div>
            <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-700 dark:border-white/10 dark:text-slate-300 sm:px-6 lg:px-8">
              {demoNotice}
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Мобильная навигация">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Закрыть меню"
            onClick={() => onMobileOpenChange(false)}
          />
          <aside className="relative h-full w-[min(88vw,320px)] overflow-y-auto border-r border-white/10 bg-surface-900 p-4 shadow-panel">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">DSF Wallet</p>
                <h1 className="mt-2 text-xl font-semibold">Smart Account</h1>
              </div>
              <button
                type="button"
                className="dsf-icon-button rounded-md p-2"
                aria-label="Закрыть меню"
                onClick={() => onMobileOpenChange(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </div>
  );
}
