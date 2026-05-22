export function parseAppPath(pathname = window.location.pathname) {
  const taskMatch = pathname.match(/^\/projects\/([^/]+)\/tasks\/([^/]+)\/?$/)
  if (taskMatch) {
    return { type: 'task', projectId: taskMatch[1], taskId: taskMatch[2] }
  }
  const boardMatch = pathname.match(/^\/projects\/([^/]+)\/?$/)
  if (boardMatch) {
    return { type: 'board', projectId: boardMatch[1] }
  }
  return { type: 'home' }
}

export function boardPath(projectId) {
  return `/projects/${projectId}`
}

export function taskPath(projectId, taskId) {
  return `/projects/${projectId}/tasks/${taskId}`
}

export function navigateApp(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
