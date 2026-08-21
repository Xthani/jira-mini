# Jira Mini

A real-time collaborative Kanban workspace for small product and engineering teams. Jira Mini combines project membership, invitation flows, task lifecycle management, and route-driven task views in a focused React application.

## Product capabilities

- Google authentication through Firebase Auth
- Private team workspaces backed by Firestore
- Project invitations by link or project ID and access code
- Backlog, in-progress, and completed columns with drag and drop
- Structured task identifiers such as `WEB-42`
- Task creation, assignment, editing, detail views, and deletion
- Real-time synchronization across active team members
- Firestore security rules and production deployment configuration

## Engineering highlights

- React 19 application built with Vite 8
- Firebase Auth and Firestore data model
- Route synchronization without a heavy routing dependency
- Reusable loading and error states
- Responsive interface built with Tailwind CSS 4
- CI checks for linting and production builds

## Stack

React 19, JavaScript, Vite, Tailwind CSS, Firebase Auth, Firestore, `@hello-pangea/dnd`, ESLint

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Add the Firebase web application values from Firebase Console to `.env.local`, enable Google authentication, and publish the included [`firestore.rules`](./firestore.rules).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run static analysis |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the build locally |

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Project hub |
| `/projects/{projectId}` | Kanban board |
| `/projects/{projectId}/tasks/{taskId}` | Task details |
| `/?join={id}&code={code}` | Project invitation |

## Security and deployment

Client-side Firebase configuration is intentionally provided through environment variables. Access control is enforced by Firestore rules, project membership checks, authorized authentication domains, and API key referrer restrictions.

The repository includes SPA routing configuration for both Vercel and Firebase Hosting.

## Current scope

All project members can manage tasks. Read-only roles, comments, and notification delivery are natural next steps rather than hidden mock functionality.
