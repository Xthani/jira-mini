import { collection, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

export function projectRef(projectId) {
  return doc(db, 'projects', projectId.trim())
}

export function projectsCollection() {
  return collection(db, 'projects')
}

export function membersCollection(projectId) {
  return collection(db, 'projects', projectId.trim(), 'members')
}

export function memberRef(projectId, uid) {
  return doc(db, 'projects', projectId.trim(), 'members', uid)
}

export function tasksCollection(projectId) {
  return collection(db, 'projects', projectId.trim(), 'tasks')
}

export function taskRef(projectId, taskId) {
  return doc(db, 'projects', projectId.trim(), 'tasks', taskId)
}
