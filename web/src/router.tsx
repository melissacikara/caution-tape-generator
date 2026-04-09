import { createBrowserRouter } from 'react-router'

import { AppLayout } from './layout/AppLayout'
import { AboutPage } from './pages/AboutPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ScenarioPage } from './pages/ScenarioPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/s/:slug', element: <ScenarioPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
