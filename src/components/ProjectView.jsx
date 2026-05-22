import { onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { useAppRoute } from '../hooks/useAppRoute.js'
import { boardPath, navigateApp, taskPath } from '../lib/appRoutes.js'
import { addMemberByUid, fetchProjectIfMember } from '../lib/firebaseProjects.js'
import { mergeMembersList } from '../lib/members.js'
import {
  membersCollection,
  memberRef,
} from '../lib/firestorePaths.js'
import { clearCurrentProjectId } from '../lib/projectStorage.js'
import KanbanBoard from './KanbanBoard.jsx'
import TaskDetailPage from './TaskDetailPage.jsx'

export default function ProjectView({ user, projectId, onLeaveProject }) {
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [addingUid, setAddingUid] = useState('')
  const [addBusy, setAddBusy] = useState(false)
  const [addErr, setAddErr] = useState(null)
  const { route, syncRoute } = useAppRoute()

  const viewingTaskId =
    route.type === 'task' && route.projectId === projectId ? route.taskId : null

  function openTask(task) {
    navigateApp(taskPath(projectId, task.id))
    syncRoute()
  }

  function backToBoard() {
    navigateApp(boardPath(projectId))
    syncRoute()
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadError(null)
      const p = await fetchProjectIfMember(projectId, user.uid)
      if (cancelled) {
        return
      }
      if (!p) {
        setLoadError('Нет доступа к проекту или он удалён.')
        clearCurrentProjectId()
        return
      }
      setProject(p)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId, user.uid])

  useEffect(() => {
    if (!project) {
      return undefined
    }
    const unsub = onSnapshot(membersCollection(projectId), (snap) => {
      setMembers(
        snap.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
        })),
      )
    })
    return () => unsub()
  }, [project, projectId])

  useEffect(() => {
    if (!project) {
      return undefined
    }
    const ref = memberRef(projectId, user.uid)
    setDoc(
      ref,
      {
        displayName: user.displayName || user.email || 'Участник',
        photoURL: user.photoURL || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch(() => {})
  }, [project, projectId, user.uid, user.displayName, user.email, user.photoURL])

  const membersForBoard = useMemo(
    () => mergeMembersList(members, project?.memberIds ?? []),
    [members, project],
  )

  const isOwner = project?.ownerUid === user.uid

  async function handleAddUid(e) {
    e.preventDefault()
    setAddErr(null)
    setAddBusy(true)
    try {
      await addMemberByUid(user, projectId, addingUid)
      setAddingUid('')
    } catch (err) {
      setAddErr(err.message ?? 'Не удалось добавить')
    } finally {
      setAddBusy(false)
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-center text-sm text-red-600">{loadError}</p>
        <button
          type="button"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
          onClick={onLeaveProject}
        >
          К проектам
        </button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
        Загрузка проекта…
      </div>
    )
  }

  if (viewingTaskId) {
    return (
      <TaskDetailPage
        user={user}
        projectId={projectId}
        projectName={project.name}
        taskId={viewingTaskId}
        members={membersForBoard}
        onBack={backToBoard}
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {project.name}
          </p>
          <p className="font-mono text-xs text-slate-500">{project.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isOwner ? (
            <form className="flex items-center gap-1" onSubmit={handleAddUid}>
              <input
                className="w-44 rounded border border-slate-200 px-2 py-1 font-mono text-xs dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                placeholder="UID участника"
                value={addingUid}
                onChange={(e) => setAddingUid(e.target.value)}
              />
              <button
                type="submit"
                disabled={addBusy}
                className="rounded bg-slate-800 px-2 py-1 text-xs text-white disabled:opacity-50"
              >
                Добавить
              </button>
            </form>
          ) : null}
          {addErr ? <span className="text-xs text-red-500">{addErr}</span> : null}
          <button
            type="button"
            onClick={onLeaveProject}
            className="text-xs font-medium text-slate-600 underline dark:text-slate-400"
          >
            Сменить проект
          </button>
        </div>
      </div>
      <KanbanBoard
        user={user}
        projectId={projectId}
        members={membersForBoard}
        onOpenTask={openTask}
      />
    </div>
  )
}
