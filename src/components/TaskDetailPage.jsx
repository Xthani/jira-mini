import { onSnapshot } from 'firebase/firestore'
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { deleteTaskInProject } from '../lib/firebaseProjects.js'
import { taskRef } from '../lib/firestorePaths.js'
import {
  PRIORITY_LABEL,
  STATUS_TITLE,
  formatTaskDate,
  priorityBadgeClass,
} from '../lib/taskConstants.js'
import TaskModal from './TaskModal.jsx'

export default function TaskDetailPage({
  user,
  projectId,
  projectName,
  taskId,
  members,
  onBack,
}) {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editKey, setEditKey] = useState(0)
  const [assigneeUid, setAssigneeUid] = useState(user.uid)

  useEffect(() => {
    const unsub = onSnapshot(
      taskRef(projectId, taskId),
      (snap) => {
        if (!snap.exists()) {
          setTask(null)
          setError('Задача не найдена')
        } else {
          setTask({ id: snap.id, ...snap.data() })
          setError(null)
        }
        setLoading(false)
      },
      (err) => {
        setError(err.message ?? 'Ошибка загрузки')
        setLoading(false)
      },
    )
    return () => unsub()
  }, [projectId, taskId])

  function openEdit() {
    setAssigneeUid(task?.assigneeUid || user.uid)
    setEditKey((k) => k + 1)
    setEditOpen(true)
  }

  async function handleDelete() {
    if (!task) {
      return
    }
    const label = task.displayKey ? `${task.displayKey} — ${task.title}` : task.title
    if (!window.confirm(`Удалить задачу «${label}»?`)) {
      return
    }
    try {
      await deleteTaskInProject(projectId, task.id)
      onBack()
    } catch (err) {
      setError(err.message ?? 'Не удалось удалить')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        Загрузка задачи…
      </div>
    )
  }

  if (error && !task) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
        >
          К доске
        </button>
      </div>
    )
  }

  if (!task) {
    return null
  }

  const statusTitle = STATUS_TITLE[task.status] ?? task.status

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            К доске
          </button>
          <span className="text-xs text-slate-500">{projectName}</span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={openEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              <Pencil className="h-4 w-4" />
              Редактировать
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" />
              Удалить
            </button>
          </div>
        </div>
      </div>

      <article className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {task.displayKey ? (
          <p className="font-mono text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {task.displayKey}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-slate-900 dark:text-white">
          {task.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${priorityBadgeClass(task.priority)}`}
          >
            {PRIORITY_LABEL[task.priority] ?? task.priority}
          </span>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {statusTitle}
          </span>
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          {task.assigneePhotoURL ? (
            <img
              src={task.assigneePhotoURL}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
              {(task.assigneeName || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Исполнитель</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {task.assigneeName || '—'}
            </p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Описание
          </h2>
          {task.description ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5 text-base leading-relaxed whitespace-pre-wrap text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {task.description}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Описание не указано.</p>
          )}
        </section>

        <p className="mt-8 text-xs text-slate-500">
          Создана: {formatTaskDate(task.createdAt)}
          {task.updatedAt ? ` · Обновлена: ${formatTaskDate(task.updatedAt)}` : ''}
        </p>
      </article>

      <TaskModal
        key={editKey}
        open={editOpen}
        mode="edit"
        task={task}
        onClose={() => setEditOpen(false)}
        user={user}
        projectId={projectId}
        members={members}
        assigneeUid={assigneeUid}
        setAssigneeUid={setAssigneeUid}
      />
    </div>
  )
}
