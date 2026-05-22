import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { onSnapshot } from 'firebase/firestore'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ErrorBanner from './ui/ErrorBanner.jsx'
import LoadingSpinner from './ui/LoadingSpinner.jsx'
import {
  deleteTaskInProject,
  updateTaskStatus,
} from '../lib/firebaseProjects.js'
import { tasksCollection } from '../lib/firestorePaths.js'
import {
  COLUMNS,
  PRIORITY_LABEL,
  priorityBadgeClass,
} from '../lib/taskConstants.js'
import TaskModal from './TaskModal.jsx'

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 }

function taskCreatedSeconds(task) {
  const c = task.createdAt
  if (c && typeof c.seconds === 'number') {
    return c.seconds
  }
  return 0
}

function sortTasksInColumn(tasks, sortBy) {
  const list = [...tasks]
  if (sortBy === 'priority') {
    list.sort(
      (a, b) =>
        (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0),
    )
    return list
  }
  list.sort((a, b) => taskCreatedSeconds(b) - taskCreatedSeconds(a))
  return list
}

function stopCardAction(e) {
  e.stopPropagation()
}

function TaskCard({ task, index, onOpen, onEdit, onDelete }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => {
            if (!snapshot.isDragging) {
              onOpen(task)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen(task)
            }
          }}
          role="button"
          tabIndex={0}
          className={`mb-3 cursor-grab rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition active:cursor-grabbing dark:border-slate-700 dark:bg-slate-900 ${
            snapshot.isDragging
              ? 'rotate-1 ring-2 ring-indigo-400'
              : 'hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700'
          }`}
        >
          {task.displayKey ? (
            <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              {task.displayKey}
            </p>
          ) : null}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {task.title}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityBadgeClass(task.priority)}`}
            >
              {PRIORITY_LABEL[task.priority] ?? task.priority}
            </span>
          </div>
          {task.description ? (
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {task.description}
            </p>
          ) : null}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
            <div className="flex min-w-0 items-center gap-2">
              {task.assigneePhotoURL ? (
                <img
                  src={task.assigneePhotoURL}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  {(task.assigneeName || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                {task.assigneeName || 'Исполнитель'}
              </span>
            </div>
            <div className="flex shrink-0 gap-0.5">
              <button
                type="button"
                onMouseDown={stopCardAction}
                onClick={(e) => {
                  stopCardAction(e)
                  onOpen(task)
                }}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                aria-label="Открыть"
                title="Открыть"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button
                type="button"
                onMouseDown={stopCardAction}
                onClick={(e) => {
                  stopCardAction(e)
                  onEdit(task)
                }}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                aria-label="Редактировать"
                title="Редактировать"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onMouseDown={stopCardAction}
                onClick={(e) => {
                  stopCardAction(e)
                  onDelete(task)
                }}
                className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                aria-label="Удалить"
                title="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

export default function KanbanBoard({ user, projectId, members, onOpenTask }) {
  const [rawTasks, setRawTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('priority')
  const [taskModal, setTaskModal] = useState({ open: false, mode: 'create', task: null })
  const [taskModalKey, setTaskModalKey] = useState(0)
  const [assigneeUid, setAssigneeUid] = useState(user.uid)

  useEffect(() => {
    const unsub = onSnapshot(
      tasksCollection(projectId),
      (snap) => {
        const next = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        setRawTasks(next)
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err.message ?? 'Ошибка загрузки задач')
        setLoading(false)
      },
    )
    return () => unsub()
  }, [projectId])

  const columnsWithTasks = useMemo(() => {
    const grouped = { todo: [], in_progress: [], done: [] }
    for (const task of rawTasks) {
      const status = task.status
      if (status === 'todo' || status === 'in_progress' || status === 'done') {
        grouped[status].push(task)
      } else {
        grouped.todo.push({ ...task, status: 'todo' })
      }
    }
    for (const col of COLUMNS) {
      grouped[col.id] = sortTasksInColumn(grouped[col.id], sortBy)
    }
    return grouped
  }, [rawTasks, sortBy])

  function openCreateModal() {
    setAssigneeUid(
      members.some((m) => m.uid === user.uid) ? user.uid : (members[0]?.uid ?? ''),
    )
    setTaskModalKey((k) => k + 1)
    setTaskModal({ open: true, mode: 'create', task: null })
  }

  function openEditModal(task) {
    setAssigneeUid(task.assigneeUid || user.uid)
    setTaskModalKey((k) => k + 1)
    setTaskModal({ open: true, mode: 'edit', task })
  }

  function closeTaskModal() {
    setTaskModal({ open: false, mode: 'create', task: null })
  }

  async function handleDelete(task) {
    const label = task.displayKey ? `${task.displayKey} — ${task.title}` : task.title
    if (!window.confirm(`Удалить задачу «${label}»?`)) {
      return
    }
    try {
      await deleteTaskInProject(projectId, task.id)
    } catch (err) {
      setError(err.message ?? 'Не удалось удалить задачу')
    }
  }

  async function handleDragEnd(result) {
    const { destination, source, draggableId } = result
    if (!destination) {
      return
    }
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }
    if (destination.droppableId === source.droppableId) {
      return
    }
    const newStatus = destination.droppableId
    try {
      await updateTaskStatus(projectId, draggableId, newStatus)
    } catch (err) {
      setError(err.message ?? 'Не удалось обновить статус')
    }
  }

  if (loading) {
    return <LoadingSpinner label="Загрузка задач…" />
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            disabled={members.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Создать задачу
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="whitespace-nowrap">Сортировка в колонках</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="priority">По приоритету</option>
              <option value="createdAt">По дате создания</option>
            </select>
          </label>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex min-h-[200px] flex-col rounded-2xl border border-slate-200 bg-slate-100/80 p-3 dark:border-slate-800 dark:bg-slate-900/60 ${
                    snapshot.isDraggingOver
                      ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950'
                      : ''
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {col.title}
                    </h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                      {columnsWithTasks[col.id].length}
                    </span>
                  </div>
                  <div className="flex-1">
                    {columnsWithTasks[col.id].length === 0 ? (
                      <p className="px-1 py-6 text-center text-xs text-slate-500 dark:text-slate-500">
                        Перетащите сюда карточку или создайте задачу
                      </p>
                    ) : null}
                    {columnsWithTasks[col.id].map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onOpen={onOpenTask}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <TaskModal
        key={taskModalKey}
        open={taskModal.open}
        mode={taskModal.mode}
        task={taskModal.task}
        onClose={closeTaskModal}
        user={user}
        projectId={projectId}
        members={members}
        assigneeUid={assigneeUid}
        setAssigneeUid={setAssigneeUid}
      />
    </div>
  )
}
