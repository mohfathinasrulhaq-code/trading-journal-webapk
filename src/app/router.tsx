import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import AccountsPage from '@/features/accounts/AccountsPage'
import { AuthGuard } from '@/features/auth/AuthGuard'
import CallbackPage from '@/features/auth/CallbackPage'
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage'
import { GuestGuard } from '@/features/auth/GuestGuard'
import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import CashPage from '@/features/cash/CashPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import SettingsPage from '@/features/settings/SettingsPage'
import TradesPage from '@/features/trades/TradesPage'
import ProfilePage from '@/features/profile/ProfilePage'
import NotFoundPage from './NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <GuestGuard />,
    children: [
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/auth/register', element: <RegisterPage /> },
      { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: '/auth/callback',
    element: <CallbackPage />,
  },
  {
    path: '/auth/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/trades', element: <TradesPage /> },
          { path: '/cash', element: <CashPage /> },
          { path: '/accounts', element: <AccountsPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
