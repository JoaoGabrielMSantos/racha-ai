import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from './AppShell'
import { RequireProfile, RequireSession } from './guards'
import { Splash } from '@/components/Splash'

const DevComponents = lazy(() => import('@/dev/DevComponents'))
const LoginScreen = lazy(() => import('@/features/auth/LoginScreen'))
const OnboardingScreen = lazy(() => import('@/features/onboarding/OnboardingScreen'))
const HomeScreen = lazy(() => import('@/features/home/HomeScreen'))
const ProfileScreen = lazy(() => import('@/features/profile/ProfileScreen'))

const page = (el: ReactNode) => <Suspense fallback={<Splash />}>{el}</Suspense>

export const router = createBrowserRouter([
  { path: '/dev/componentes', element: page(<DevComponents />) },
  {
    element: <AppShell />,
    children: [
      { path: '/login', element: page(<LoginScreen />) },
      {
        element: <RequireSession />,
        children: [
          { path: '/onboarding', element: page(<OnboardingScreen />) },
          {
            element: <RequireProfile />,
            children: [
              { path: '/', element: page(<HomeScreen />) },
              { path: '/perfil', element: page(<ProfileScreen />) },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
