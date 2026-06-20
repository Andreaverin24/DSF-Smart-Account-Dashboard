import {
  Activity,
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
  | 'recovery'
  | 'sessions'
  | 'paymaster'
  | 'security'
  | 'technical';

export interface AppRoute {
  id: RouteId;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  component: ComponentType;
}

export const routes: AppRoute[] = [
  {
    id: 'overview',
    label: 'Обзор',
    description: 'EOA, Smart Account и текущая конфигурация',
    icon: Home,
    component: OverviewPage,
  },
  {
    id: 'flow',
    label: 'Как проходит операция',
    description: 'Путь UserOperation через ERC-4337',
    icon: GitBranch,
    component: OperationFlowPage,
  },
  {
    id: 'signers',
    label: 'Подписанты',
    description: 'Social, Device, Arbiter и Recovery роли',
    icon: KeyRound,
    component: SignersPage,
  },
  {
    id: 'matrix',
    label: 'Матрица авторизации',
    description: 'Какие подписи нужны для действий',
    icon: Table2,
    component: AuthorizationMatrixPage,
  },
  {
    id: 'simulator',
    label: 'Симулятор UserOperation',
    description: 'Локальная policy engine модель',
    icon: Activity,
    component: UserOperationSimulatorPage,
  },
  {
    id: 'recovery',
    label: 'Восстановление',
    description: 'Recovery state machine и signer epoch',
    icon: RotateCcw,
    component: RecoveryPage,
  },
  {
    id: 'sessions',
    label: 'Session Keys',
    description: 'Минимальные полномочия и лимиты',
    icon: LockKeyhole,
    component: SessionKeysPage,
  },
  {
    id: 'paymaster',
    label: 'Paymaster и газ',
    description: 'ETH, sponsored gas и оплата USDT',
    icon: Fuel,
    component: PaymasterPage,
  },
  {
    id: 'security',
    label: 'Безопасность',
    description: 'Угрозы и защитные механизмы',
    icon: Shield,
    component: SecurityPage,
  },
  {
    id: 'technical',
    label: 'Техническая модель',
    description: 'Контракт, модули, policies и flow',
    icon: FileCode2,
    component: TechnicalModelPage,
  },
];
