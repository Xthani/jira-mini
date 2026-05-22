export const CURRENT_PROJECT_STORAGE_KEY = 'jira-mini-current-project-id'

export function saveCurrentProjectId(projectId) {
  localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, projectId)
}

export function clearCurrentProjectId() {
  localStorage.removeItem(CURRENT_PROJECT_STORAGE_KEY)
}

export function getCurrentProjectId() {
  return localStorage.getItem(CURRENT_PROJECT_STORAGE_KEY)
}
