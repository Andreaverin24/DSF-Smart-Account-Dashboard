import {
  Activity,
  CircleDotDashed,
  FileCode2,
  Fuel,
  GitBranch,
  Home,
  KeyRound,
  LockKeyhole,
  RotateCcw,
  Shield,
  Table2,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { AccountLifecyclePage } from '../pages/AccountLifecyclePage';
import { AuthorizationMatrixPage } from '../pages/AuthorizationMatrixPage';
import { OperationFlowPage } from '../pages/OperationFlowPage';
import { OverviewPage } from '../pages/OverviewPage';
import { PaymasterPage } from '../pages/PaymasterPage';
import { RecoveryPage } from '../pages/RecoveryPage';
import { SecurityPage } from '../pages/SecurityPage';
import { SessionKeysPage } from '../pages/SessionKeysPage';
import { SignersPage } from '../pages/SignersPage';
import { TechnicalModelPage } from '../pages/TechnicalModelPage';
import { UserOperationSimulatorPage } from '../pages/UserOperationSimulatorPage';

export type RouteId =
  | 'overview'
  | 'flow'
  | 'signers'
  | 'matrix'
  | 'simulator'
  | 'lifecycle'
  | 'recovery'
  | 'sessions'
  | 'paymaster'
  | 'security'
  | 'technical';

export interface AppRoute {
  id: RouteId;
  label: string;
  description: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  component: ComponentType;
}

export const routes: AppRoute[] = [
  {
    id: 'overview',
    label: 'Обзор',
    description: 'EOA, Smart Account и текущая конфигурация',
    path: '/',
    icon: Home,
    component: OverviewPage,
  },
  {
    id: 'flow',
    label: 'Как проходит операция',
    description: 'Путь UserOperation через ERC-4337',
    path: '/operation-flow',
    icon: GitBranch,
    component: OperationFlowPage,
  },
  {
    id: 'signers',
    label: 'Подписанты',
    description: 'Social, Device, Arbiter и Recovery роли',
    path: '/signers',
    icon: KeyRound,
    component: SignersPage,
  },
  {
    id: 'matrix',
    label: 'Матрица авторизации',
    description: 'Какие подписи нужны для действий',
    path: '/authorization-matrix',
    icon: Table2,
    component: AuthorizationMatrixPage,
  },
  {
    id: 'simulator',
    label: 'Симулятор UserOperation',
    description: 'Локальная policy engine модель',
    path: '/user-operation-simulator',
    icon: Activity,
    component: UserOperationSimulatorPage,
  },
  {
    id: 'lifecycle',
    label: 'Жизненный цикл аккаунта',
    description: 'Регистрация, замена подписантов, freeze и signerEpoch',
    path: '/account-lifecycle',
    icon: CircleDotDashed,
    component: AccountLifecyclePage,
  },
  {
    id: 'recovery',
    label: 'Восстановление',
    description: 'Recovery state machine и signer epoch',
    path: '/recovery',
    icon: RotateCcw,
    component: RecoveryPage,
  },
  {
    id: 'sessions',
    label: 'Session Keys',
    description: 'Минимальные полномочия и лимиты',
    path: '/session-keys',
    icon: LockKeyhole,
    component: SessionKeysPage,
  },
  {
    id: 'paymaster',
    label: 'Paymaster и газ',
    description: 'ETH, sponsored gas и оплата USDT',
    path: '/paymaster',
    icon: Fuel,
    component: PaymasterPage,
  },
  {
    id: 'security',
    label: 'Безопасность',
    description: 'Угрозы и защитные механизмы',
    path: '/security',
    icon: Shield,
    component: SecurityPage,
  },
  {
    id: 'technical',
    label: 'Техническая модель',
    description: 'Контракт, модули, policies и flow',
    path: '/technical-model',
    icon: FileCode2,
    component: TechnicalModelPage,
  },
];

export function routeFromPath(pathname: string): RouteId {
  return routes.find((route) => route.path === pathname)?.id ?? 'overview';
}

export function pathForRoute(routeId: RouteId): string {
  return routes.find((route) => route.id === routeId)?.path ?? '/';
}
