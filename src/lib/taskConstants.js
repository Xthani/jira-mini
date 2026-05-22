export const COLUMNS = [
  { id: 'todo', title: 'Бэклог' },
  { id: 'in_progress', title: 'В работе' },
  { id: 'done', title: 'Готово' },
]

export const PRIORITY_LABEL = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

export const STATUS_TITLE = Object.fromEntries(COLUMNS.map((c) => [c.id, c.title]))

export function priorityBadgeClass(priority) {
  if (priority === 'high') {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
  }
  if (priority === 'medium') {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100'
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
}

export function formatTaskDate(timestamp) {
  if (!timestamp || typeof timestamp.seconds !== 'number') {
    return '—'
  }
  return new Date(timestamp.seconds * 1000).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
