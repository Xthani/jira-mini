import { onAuthStateChanged } from 'firebase/auth'
import { useCallback, useEffect, useState } from 'react'
import Auth from './components/Auth.jsx'
import ProjectHub from './components/ProjectHub.jsx'
import ProjectView from './components/ProjectView.jsx'
import { auth } from './firebase.js'
import { boardPath, navigateApp, parseAppPath } from './lib/appRoutes.js'
import { joinProject } from './lib/firebaseProjects.js'
import { leaveProject, openProjectBoard } from './lib/projectActions.js'
import {
  clearCurrentProjectId,
  getCurrentProjectId,
  saveCurrentProjectId,
} from './lib/projectStorage.js'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [currentProjectId, setCurrentProjectId] = useState(null)
  const [joinError, setJoinError] = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, setUser)
  }, [])

  useEffect(() => {
    if (!user) {
      return undefined
    }
    let cancelled = false
    async function init() {
      const params = new URLSearchParams(window.location.search)
      const joinPid = params.get('join')
      const code = params.get('code')
      if (joinPid && code) {
        try {
          await joinProject(user, joinPid, code)
          if (cancelled) {
            return
          }
          const pid = joinPid.trim()
          saveCurrentProjectId(pid)
          setCurrentProjectId(pid)
          window.history.replaceState({}, '', boardPath(pid))
        } catch (e) {
          if (!cancelled) {
            setJoinError(e.message ?? 'Не удалось вступить по ссылке')
          }
        }
        return
      }
      const pathRoute = parseAppPath()
      if (
        (pathRoute.type === 'board' || pathRoute.type === 'task') &&
        !cancelled
      ) {
        saveCurrentProjectId(pathRoute.projectId)
        setCurrentProjectId(pathRoute.projectId)
        return
      }
      const saved = getCurrentProjectId()
      if (saved && !cancelled) {
        setCurrentProjectId(saved)
        if (window.location.pathname === '/') {
          navigateApp(boardPath(saved))
        }
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [user])

  const handleLeaveProject = useCallback(() => {
    leaveProject()
    setCurrentProjectId(null)
  }, [])

  const handleOpenProject = useCallback((id) => {
    openProjectBoard(id)
    setCurrentProjectId(id)
  }, [])

  const handleSignedOut = useCallback(() => {
    clearCurrentProjectId()
    setCurrentProjectId(null)
    setJoinError(null)
    navigateApp('/')
  }, [])

  if (user === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-400">
        Загрузка…
      </div>
    )
  }

  if (!user) {
    return <Auth user={null} />
  }

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 dark:bg-slate-950">
      <Auth user={user} onSignedOut={handleSignedOut} />
      {!currentProjectId ? (
        <ProjectHub
          key={user.uid}
          user={user}
          onOpenProject={handleOpenProject}
          joinError={joinError}
          onClearJoinError={() => setJoinError(null)}
        />
      ) : (
        <ProjectView
          user={user}
          projectId={currentProjectId}
          onLeaveProject={handleLeaveProject}
        />
      )}
    </div>
  )
}
