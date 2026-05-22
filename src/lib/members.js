export function memberLabel(member) {
  return member.displayName || member.uid?.slice(0, 8) || 'Участник'
}

/** Список участников для селектов: документы members + uid из project.memberIds */
export function mergeMembersList(memberDocs, memberIds = []) {
  const byUid = new Map(memberDocs.map((m) => [m.uid, { ...m }]))
  for (const uid of memberIds) {
    if (!byUid.has(uid)) {
      byUid.set(uid, {
        uid,
        displayName: `Участник ${uid.slice(0, 6)}…`,
        photoURL: '',
      })
    }
  }
  return memberIds.map((uid) => byUid.get(uid)).filter(Boolean)
}
