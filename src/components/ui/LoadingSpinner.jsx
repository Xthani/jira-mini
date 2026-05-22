import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ label = 'Загрузка…' }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-slate-600 dark:text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  )
}
