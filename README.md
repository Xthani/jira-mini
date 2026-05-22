# Мини-Жира

Канбан-доска для небольших команд разработчиков: проекты, задачи с номерами (`JIRA-1`), Google-вход, Firestore в реальном времени.

## Возможности

- Вход через **Google** (Firebase Auth)
- **Проекты** с командой: только участники видят доску
- Приглашение по **ссылке** или **ID + код**
- Канбан: Бэклог → В работе → Готово (drag-and-drop)
- Задачи: создание, **просмотр** (отдельная страница), редактирование, удаление
- Номер задачи: `ПРЕФИКС-N` (префикс задаётся при создании проекта)
- Назначение исполнителя на любого участника проекта

## Стек

- React 19 + Vite 8
- Tailwind CSS 4
- Firebase (Auth, Firestore)
- `@hello-pangea/dnd`, `lucide-react`

## Быстрый старт

### 1. Зависимости

```bash
npm install
```

### 2. Переменные окружения

Скопируй шаблон и подставь данные из **Firebase Console → Project settings → Your apps → Web**:

```bash
cp .env.example .env.local
```

### 3. Firebase (один раз)

1. **Authentication** → Google → включить.
2. **Firestore** → создать БД.
3. **Firestore → Rules** → вставить содержимое файла [`firestore.rules`](./firestore.rules) → **Publish**.
4. **Google Cloud** (проект Firebase) → **Credentials** → Browser key: для локальной разработки добавь в HTTP referrers `http://localhost:5173/*` или временно **None** для API restrictions.

Подробнее про правила: [`FIRESTORE_RULES.md`](./FIRESTORE_RULES.md).

### 4. Запуск

```bash
npm run dev
```

Открой `http://localhost:5173`.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер |
| `npm run build` | Production-сборка в `dist/` |
| `npm run preview` | Просмотр сборки локально |
| `npm run lint` | ESLint |

## Маршруты приложения

| URL | Экран |
|-----|--------|
| `/` | Список проектов (после входа) |
| `/projects/{projectId}` | Канбан-доска |
| `/projects/{projectId}/tasks/{taskId}` | Просмотр задачи |
| `/?join={id}&code={code}` | Вступление в проект по ссылке |

## Структура проекта

```
src/
  components/     UI: Auth, ProjectHub, ProjectView, KanbanBoard, TaskDetailPage, TaskModal
  components/ui/  Переиспользуемые блоки (ошибки, загрузка)
  hooks/          useAppRoute — синхронизация URL
  lib/            Firebase API, маршруты, константы задач
  firebase.js     Инициализация Firebase
firestore.rules   Правила безопасности Firestore (копировать в консоль)
```

## Деплой

### Сборка

```bash
npm run build
```

Папка `dist/` — статика для хостинга.

### Vercel (бесплатный хостинг)

1. Репозиторий подключи к [Vercel](https://vercel.com) (Import Git Repository).
2. **Framework Preset:** Vite. **Build Command:** `npm run build`. **Output Directory:** `dist`.
3. В **Settings → Environment Variables** добавь все переменные из [`.env.example`](./.env.example) (см. ниже «Переменные на проде»).
4. Deploy. Файл [`vercel.json`](./vercel.json) уже настроен: все маршруты (`/projects/...`) отдают `index.html`.

После первого деплоя в **Firebase Console → Authentication → Settings → Authorized domains** добавь домен вида `твой-проект.vercel.app` (и custom domain, если будет).

### Firebase Hosting (альтернатива)

1. Установи CLI: `npm install -g firebase-tools`
2. `firebase login`
3. В корне уже есть `firebase.json` — привяжи проект: `firebase use jira-mini-d349d` (свой ID).
4. `firebase deploy --only hosting`

В **Firebase Console → Hosting** добавь домен. В **Authentication → Authorized domains** — тот же домен.

### Переменные на проде (Vercel и любой хостинг)

Vite подставляет `VITE_*` **только во время `npm run build`**. Локально — из `.env.local` (в git не попадает). На Vercel — из панели **Environment Variables**.

| Переменная | Откуда взять (Firebase Console → Project settings → Your apps → Web) |
|------------|----------------------------------------------------------------------|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

В Vercel для каждой переменной включи окружения **Production** (и **Preview**, если нужны превью-деплои). Имена должны совпадать **точно**, с префиксом `VITE_`.

После добавления переменных сделай **Redeploy** (пересборка), иначе в бандле останутся пустые ключи.

**Важно:** для веб-клиента Firebase ключи в JS всё равно видны в браузере — это нормально. Защита через **Firestore Rules** и ограничения API key в Google Cloud (HTTP referrers на домен Vercel).

### Чеклист перед продакшеном

- [ ] Опубликованы актуальные `firestore.rules`
- [ ] В Google Cloud ограничен API key (referrers продакшен-домена)
- [ ] В Firebase добавлены authorized domains
- [ ] Проверен вход Google и создание/редактирование задач на проде
- [ ] SPA: все пути отдают `index.html` (в `firebase.json` настроено)

## Ограничения (осознанно)

- Нет ролей «только чтение» — все участники проекта равны по CRUD задач (кроме добавления участников: только владелец).
- Нет email-уведомлений и комментариев к задачам.
- Роутинг на `history.pushState` без React Router (достаточно для SPA).

## Лицензия

Private / учебный прототип.
