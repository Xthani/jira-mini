import { signInWithPopup, signOut } from 'firebase/auth'
import { LogIn, LogOut } from 'lucide-react'
import { useState } from 'react'
import { auth, googleProvider } from '../firebase.js'

export default function Auth({ user, onSignedOut }) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      setError(e.message ?? 'Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    setError(null)
    try {
      await signOut(auth)
      onSignedOut?.()
    } catch (e) {
      setError(e.message ?? 'Не удалось выйти')
    }
  }

  if (user) {
    return (
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-600"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
              {(user.displayName || user.email || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {user.displayName || 'Пользователь'}
            </p>
            {user.email ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            ) : null}
            <p className="mt-1 max-w-[220px] truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">
              UID: {user.uid}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Выйти
        </button>
      </header>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Мини-Жира
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Канбан для команды разработки. Войдите, чтобы открыть доску.
        </p>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogIn className="h-5 w-5" aria-hidden />
          {loading ? 'Вход…' : 'Войти через Google'}
        </button>
        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
