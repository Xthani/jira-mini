import { boardPath, navigateApp } from './appRoutes.js'
import {
  clearCurrentProjectId,
  saveCurrentProjectId,
} from './projectStorage.js'

export function openProjectBoard(projectId) {
  saveCurrentProjectId(projectId)
  navigateApp(boardPath(projectId))
}

export function leaveProject() {
  clearCurrentProjectId()
  navigateApp('/')
}
