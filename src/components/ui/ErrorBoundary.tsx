import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircleIcon } from './icons'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-app p-4 text-center text-fg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
            <AlertCircleIcon className="h-8 w-8" />
          </div>
          <h1 className="text-lg font-bold">Terjadi Kesalahan Sistem</h1>
          <p className="mt-2 text-xs text-muted max-w-md">
            Aplikasi mengalami kendala saat memproses tampilan ini. Data transaksi Anda yang tersimpan di server tetap aman.
          </p>
          {this.state.error?.message && (
            <pre className="mt-3 max-w-lg rounded-lg border border-line bg-surface p-3 text-left text-[11px] font-mono text-red-500 overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-6 flex gap-3">
            <Button onClick={this.handleReload} className="px-5">
              Muat Ulang Halaman
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/'
              }}
            >
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
