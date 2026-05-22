import {
  addDoc,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import {
  memberRef,
  projectRef,
  projectsCollection,
  taskRef,
  tasksCollection,
} from './firestorePaths.js'

const TASK_STATUSES = ['todo', 'in_progress', 'done']

export function generateInviteCode() {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function normalizeProjectSlug(input) {
  return String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

export async function createProject(user, { name, slug }) {
  const inviteCode = generateInviteCode()
  const projectDocRef = await addDoc(projectsCollection(), {
    name: name.trim(),
    slug,
    ownerUid: user.uid,
    memberIds: [user.uid],
    inviteCode,
    taskCounter: 0,
    createdAt: serverTimestamp(),
  })
  const pid = projectDocRef.id
  await setDoc(memberRef(pid, user.uid), {
    displayName: user.displayName || user.email || 'Участник',
    photoURL: user.photoURL || '',
    updatedAt: serverTimestamp(),
  })
  return { projectId: pid, inviteCode }
}

export async function joinProject(user, projectId, inviteCode) {
  const pid = projectId.trim()
  const code = inviteCode.trim()
  if (!pid || !code) {
    throw new Error('Укажи ID проекта и код приглашения')
  }
  const ref = projectRef(pid)
  const memberDocRef = memberRef(pid, user.uid)
  try {
    await updateDoc(ref, {
      memberIds: arrayUnion(user.uid),
      inviteCode: code,
    })
  } catch (e) {
    if (e?.code === 'not-found') {
      throw new Error('Проект с таким ID не найден', { cause: e })
    }
    if (e?.code !== 'permission-denied') {
      throw e
    }
  }
  try {
    await setDoc(
      memberDocRef,
      {
        displayName: user.displayName || user.email || 'Участник',
        photoURL: user.photoURL || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (e) {
    if (e?.code === 'permission-denied') {
      throw new Error('Неверный код приглашения или нет доступа к проекту.', {
        cause: e,
      })
    }
    throw e
  }
}

export async function addMemberByUid(ownerUser, projectId, otherUid) {
  const uid = otherUid.trim()
  if (!uid) {
    throw new Error('Укажи UID участника')
  }
  if (uid === ownerUser.uid) {
    throw new Error('Это твой собственный UID')
  }
  await updateDoc(projectRef(projectId), {
    memberIds: arrayUnion(uid),
  })
}

export async function createTaskInProject(
  projectId,
  creatorUser,
  { title, description, priority, assigneeUid, assigneeName, assigneePhotoURL },
) {
  const pid = projectId.trim()
  const projectDocRef = projectRef(pid)

  await runTransaction(db, async (transaction) => {
    const pSnap = await transaction.get(projectDocRef)
    if (!pSnap.exists()) {
      throw new Error('Проект не найден')
    }
    const p = pSnap.data()
    const memberIds = p.memberIds || []
    if (!memberIds.includes(creatorUser.uid)) {
      throw new Error('Нет доступа к проекту')
    }
    if (!memberIds.includes(assigneeUid)) {
      throw new Error('Исполнитель не в команде проекта')
    }
    const nextNum = (p.taskCounter ?? 0) + 1
    const slug = p.slug || 'TASK'
    const displayKey = `${slug}-${nextNum}`
    const newTaskRef = doc(tasksCollection(pid))
    transaction.set(newTaskRef, {
      title: title.trim(),
      description: (description || '').trim(),
      priority,
      status: 'todo',
      assigneeUid,
      assigneeName,
      assigneePhotoURL: assigneePhotoURL || '',
      createdByUid: creatorUser.uid,
      displayKey,
      taskNumber: nextNum,
      createdAt: serverTimestamp(),
    })
    transaction.update(projectDocRef, { taskCounter: nextNum })
  })
}

export async function updateTaskInProject(
  projectId,
  taskId,
  { title, description, priority, status, assigneeUid, assigneeName, assigneePhotoURL },
) {
  const trimmed = title.trim()
  if (!trimmed) {
    throw new Error('Укажите заголовок')
  }
  if (!TASK_STATUSES.includes(status)) {
    throw new Error('Некорректный статус')
  }
  await updateDoc(taskRef(projectId, taskId), {
    title: trimmed,
    description: (description || '').trim(),
    priority,
    status,
    assigneeUid,
    assigneeName,
    assigneePhotoURL: assigneePhotoURL || '',
    updatedAt: serverTimestamp(),
  })
}

export async function updateTaskStatus(projectId, taskId, status) {
  if (!TASK_STATUSES.includes(status)) {
    throw new Error('Некорректный статус')
  }
  await updateDoc(taskRef(projectId, taskId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTaskInProject(projectId, taskId) {
  await deleteDoc(taskRef(projectId, taskId))
}

export async function fetchProjectIfMember(projectId, userUid) {
  const ref = projectRef(projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    return null
  }
  const data = snap.data()
  if (!(data.memberIds || []).includes(userUid)) {
    return null
  }
  return { id: snap.id, ...data }
}
