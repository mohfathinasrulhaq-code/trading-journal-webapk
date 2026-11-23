import { RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { AppProviders } from './providers'
import { router } from './router'

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  )
}
