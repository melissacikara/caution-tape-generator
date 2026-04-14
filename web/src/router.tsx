import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'

import { AppLayout } from './layout/AppLayout'

const AboutPage = lazy(async () => {
  const m = await import('./pages/AboutPage')
  return { default: m.AboutPage }
})
const AuthCallbackPage = lazy(async () => {
  const m = await import('./pages/AuthCallbackPage')
  return { default: m.AuthCallbackPage }
})
const HomePage = lazy(async () => {
  const m = await import('./pages/HomePage')
  return { default: m.HomePage }
})
const NotFoundPage = lazy(async () => {
  const m = await import('./pages/NotFoundPage')
  return { default: m.NotFoundPage }
})
const LibraryPage = lazy(async () => {
  const m = await import('./pages/LibraryPage')
  return { default: m.LibraryPage }
})
const ScenarioPage = lazy(async () => {
  const m = await import('./pages/ScenarioPage')
  return { default: m.ScenarioPage }
})

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Navigate to="/about" replace /> },
      { path: '/create', element: <HomePage /> },
      { path: '/library', element: <LibraryPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/s/:slug', element: <ScenarioPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
