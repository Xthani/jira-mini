import { useEffect, useState } from 'react'
import { COLUMNS } from '../lib/taskConstants.js'
import { createTaskInProject, updateTaskInProject } from '../lib/firebaseProjects.js'
import { memberLabel } from '../lib/members.js'
import { inputClass } from '../lib/styles.js'

export default function TaskModal({
  open,
  onClose,
  mode,
  task,
  user,
  projectId,
  members,
  assigneeUid,
  setAssigneeUid,
}) {
  const isEdit = mode === 'edit'
  const [title, setTitle] = useState(() => (isEdit && task?.title) || '')
  const [description, setDescription] = useState(() => (isEdit && task?.description) || '')
  const [priority, setPriority] = useState(() => task?.priority || 'medium')
  const [status, setStatus] = useState(() => task?.status || 'todo')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Укажите заголовок')
      return
    }
    const m = members.find((x) => x.uid === assigneeUid)
    if (!m) {
      setError('Выбери исполнителя из команды')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (isEdit && task) {
        await updateTaskInProject(projectId, task.id, {
          title: trimmed,
          description: description.trim(),
          priority,
          status,
          assigneeUid: m.uid,
          assigneeName: memberLabel(m),
          assigneePhotoURL: m.photoURL || '',
        })
      } else {
        await createTaskInProject(projectId, user, {
          title: trimmed,
          description: description.trim(),
          priority,
          assigneeUid: m.uid,
          assigneeName: memberLabel(m),
          assigneePhotoURL: m.photoURL || '',
        })
      }
      onClose()
    } catch (err) {
      setError(err.message ?? 'Не удалось сохранить задачу')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return null
  }

  const titleId = isEdit ? 'edit-task-title' : 'create-task-title'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-semibold text-slate-900 dark:text-white"
        >
          {isEdit ? 'Редактировать задачу' : 'Новая задача'}
        </h2>
        {isEdit && task?.displayKey ? (
          <p className="mt-1 font-mono text-sm text-indigo-600 dark:text-indigo-400">
            {task.displayKey}
          </p>
        ) : null}
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Исполнитель
            </label>
            <select
              className={inputClass}
              value={assigneeUid}
              onChange={(e) => setAssigneeUid(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {memberLabel(m)}
                  {m.uid === user.uid ? ' (ты)' : ''}
                </option>
              ))}
            </select>
          </div>
          {isEdit ? (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Колонка
              </label>
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Заголовок
            </label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Описание
            </label>
            <textarea
              className={`${inputClass} min-h-[96px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Приоритет
            </label>
            <select
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving || members.length === 0}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
