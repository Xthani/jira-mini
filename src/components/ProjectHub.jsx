import { getDocs, query, where } from 'firebase/firestore'
import { Copy, FolderKanban, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createProject,
  joinProject,
  normalizeProjectSlug,
} from '../lib/firebaseProjects.js'
import { openProjectBoard } from '../lib/projectActions.js'
import { projectsCollection } from '../lib/firestorePaths.js'

export default function ProjectHub({ user, onOpenProject, joinError, onClearJoinError }) {
  const [myProjects, setMyProjects] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(null)

  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const [createErr, setCreateErr] = useState(null)
  const [lastInvite, setLastInvite] = useState(null)

  const [joinId, setJoinId] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinBusy, setJoinBusy] = useState(false)
  const [joinErr, setJoinErr] = useState(null)

  const loadProjects = useCallback(async () => {
    try {
      const q = query(
        projectsCollection(),
        where('memberIds', 'array-contains', user.uid),
      )
      const snap = await getDocs(q)
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      rows.sort((a, b) => String(a.name).localeCompare(String(b.name)))
      setMyProjects(rows)
      setListError(null)
    } catch (e) {
      setListError(e.message ?? 'Не удалось загрузить проекты')
    } finally {
      setLoadingList(false)
    }
  }, [user.uid])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState только после await внутри loadProjects
    void loadProjects()
  }, [loadProjects])

  function inviteUrl(projectId, code) {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const params = new URLSearchParams({ join: projectId, code })
    return `${origin}/?${params.toString()}`
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreateErr(null)
    const name = createName.trim()
    const slug = normalizeProjectSlug(createSlug)
    if (name.length < 2) {
      setCreateErr('Название проекта — минимум 2 символа')
      return
    }
    if (slug.length < 2 || slug.length > 12) {
      setCreateErr('Префикс задач: 2–12 латинских букв или цифр (например JIRA)')
      return
    }
    setCreateBusy(true)
    try {
      const { projectId, inviteCode } = await createProject(user, { name, slug })
      setLastInvite({ projectId, inviteCode, name })
      setCreateName('')
      setCreateSlug('')
      await loadProjects()
    } catch (err) {
      setCreateErr(err.message ?? 'Не удалось создать проект')
    } finally {
      setCreateBusy(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    setJoinErr(null)
    setJoinBusy(true)
    try {
      await joinProject(user, joinId, joinCode)
      const pid = joinId.trim()
      setJoinId('')
      setJoinCode('')
      await loadProjects()
      openProjectBoard(pid)
      onOpenProject(pid)
    } catch (err) {
      setJoinErr(err.message ?? 'Не удалось вступить')
    } finally {
      setJoinBusy(false)
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Проекты
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Создай проект для команды или вступи по ссылке / коду от владельца. Задачи и
          доска видны только участникам проекта.
        </p>
      </div>

      {joinError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <p>{joinError}</p>
          <button
            type="button"
            className="mt-2 text-xs font-medium underline"
            onClick={onClearJoinError}
          >
            Понятно
          </button>
        </div>
      ) : null}

      {lastInvite ? (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 text-sm dark:border-indigo-900 dark:bg-indigo-950/40">
          <p className="font-medium text-indigo-950 dark:text-indigo-100">
            Проект «{lastInvite.name}» создан. Отправь другу ссылку:
          </p>
          <p className="mt-2 break-all font-mono text-xs text-indigo-900 dark:text-indigo-200">
            {inviteUrl(lastInvite.projectId, lastInvite.inviteCode)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                copyText(inviteUrl(lastInvite.projectId, lastInvite.inviteCode))
              }
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Copy className="h-3.5 w-3.5" />
              Копировать ссылку
            </button>
            <button
              type="button"
              onClick={() => copyText(lastInvite.inviteCode)}
              className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-900 dark:border-indigo-700 dark:text-indigo-100"
            >
              Только код
            </button>
            <button
              type="button"
              onClick={() => {
                openProjectBoard(lastInvite.projectId)
                onOpenProject(lastInvite.projectId)
              }}
              className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-900 dark:border-indigo-700 dark:text-indigo-100"
            >
              Открыть доску
            </button>
          </div>
          <p className="mt-2 text-xs text-indigo-800/90 dark:text-indigo-300/90">
            ID проекта (для ручного ввода):{' '}
            <span className="font-mono">{lastInvite.projectId}</span>
          </p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <FolderKanban className="h-4 w-4" />
          Новый проект
        </h2>
        <form className="mt-4 space-y-3" onSubmit={handleCreate}>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Название
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Например: Наш бэклог"
              maxLength={80}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Префикс номеров задач (латиница/цифры, 2–12 символов)
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm uppercase dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              value={createSlug}
              onChange={(e) => setCreateSlug(normalizeProjectSlug(e.target.value))}
              placeholder="JIRA"
              maxLength={12}
            />
          </div>
          {createErr ? (
            <p className="text-sm text-red-600 dark:text-red-400">{createErr}</p>
          ) : null}
          <button
            type="submit"
            disabled={createBusy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {createBusy ? 'Создание…' : 'Создать проект'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <UserPlus className="h-4 w-4" />
          Вступить по ID и коду
        </h2>
        <form className="mt-4 space-y-3" onSubmit={handleJoin}>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              ID проекта
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Из ссылки или от владельца"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Код приглашения
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="8 символов"
            />
          </div>
          {joinErr ? (
            <p className="text-sm text-red-600 dark:text-red-400">{joinErr}</p>
          ) : null}
          <button
            type="submit"
            disabled={joinBusy}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {joinBusy ? 'Вступаю…' : 'Вступить'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Мои проекты
        </h2>
        {loadingList ? (
          <p className="mt-3 text-sm text-slate-500">Загрузка…</p>
        ) : listError ? (
          <p className="mt-3 text-sm text-red-600">{listError}</p>
        ) : myProjects.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Пока нет проектов — создай первый.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {myProjects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    openProjectBoard(p.id)
                    onOpenProject(p.id)
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-slate-800/80"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {p.name}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{p.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
