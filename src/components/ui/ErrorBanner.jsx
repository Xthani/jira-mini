import { AlertCircle } from 'lucide-react'

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) {
    return null
  }
  return (
    <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1">{message}</span>
      {onDismiss ? (
        <button type="button" className="text-xs underline" onClick={onDismiss}>
          Закрыть
        </button>
      ) : null}
    </div>
  )
}
