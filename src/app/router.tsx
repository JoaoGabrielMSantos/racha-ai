import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from './AppShell'

const DevComponents = lazy(() => import('@/dev/DevComponents'))

export const router = createBrowserRouter([
  {
    path: '/dev/componentes',
    element: (
      <Suspense fallback={null}>
        <DevComponents />
      </Suspense>
    ),
  },
  {
    element: <AppShell />,
    children: [
      // As telas entram nas próximas etapas.
      { path: '*', element: <Navigate to="/dev/componentes" replace /> },
    ],
  },
])
