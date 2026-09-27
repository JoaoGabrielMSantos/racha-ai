import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from './AppShell'
import { RequireProfile, RequireSession } from './guards'
import { Splash } from '@/components/Splash'
import { InviteGate } from '@/features/groups/JoinScreen'

const DevComponents = lazy(() => import('@/dev/DevComponents'))
const DevExpenseForm = lazy(() => import('@/dev/DevExpenseForm'))
const LoginScreen = lazy(() => import('@/features/auth/LoginScreen'))
const OnboardingScreen = lazy(() => import('@/features/onboarding/OnboardingScreen'))
const HomeScreen = lazy(() => import('@/features/home/HomeScreen'))
const ProfileScreen = lazy(() => import('@/features/profile/ProfileScreen'))
const CreateGroupScreen = lazy(() => import('@/features/groups/CreateGroupScreen'))
const InviteScreen = lazy(() => import('@/features/groups/InviteScreen'))
const GroupScreen = lazy(() => import('@/features/groups/GroupScreen'))
const JoinScreen = lazy(() => import('@/features/groups/JoinScreen'))
const ExpenseFormScreen = lazy(() => import('@/features/expenses/ExpenseFormScreen'))

const page = (el: ReactNode) => <Suspense fallback={<Splash />}>{el}</Suspense>

export const router = createBrowserRouter([
  { path: '/dev/componentes', element: page(<DevComponents />) },
  { path: '/dev/novo-gasto', element: page(<DevExpenseForm />) },
  {
    element: <AppShell />,
    children: [
      { path: '/login', element: page(<LoginScreen />) },
      // Convite: sem sessão guarda o code e vai pro login; com sessão (e perfil) entra no grupo.
      {
        path: '/c/:code',
        element: <InviteGate />,
        children: [{ element: <RequireProfile />, children: [{ index: true, element: page(<JoinScreen />) }] }],
      },
      {
        element: <RequireSession />,
        children: [
          { path: '/onboarding', element: page(<OnboardingScreen />) },
          {
            element: <RequireProfile />,
            children: [
              { path: '/', element: page(<HomeScreen />) },
              { path: '/perfil', element: page(<ProfileScreen />) },
              { path: '/novo-grupo', element: page(<CreateGroupScreen />) },
              { path: '/g/:id', element: page(<GroupScreen />) },
              { path: '/g/:id/convite', element: page(<InviteScreen />) },
              { path: '/g/:id/novo-gasto', element: page(<ExpenseFormScreen />) },
              { path: '/g/:id/gasto/:expenseId/editar', element: page(<ExpenseFormScreen />) },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
