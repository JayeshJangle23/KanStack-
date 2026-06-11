# Real-Time Collaborative Kanban Board

A Trello-like task management system with real-time synchronization built with the MERN stack and Socket.io.

## Features

### Core
- **Kanban columns**: Todo, In Progress, Review, Done
- **Drag & drop** task movement with optimistic updates
- **Editable task modal** with title, description, priority, due date, assignee, status
- **Real-time sync** via Socket.io — live task movement, instant updates
- **Filters** by priority, member, due date, and search
- **Online members** presence indicators
- **Typing indicators** when editing task descriptions

### Bonus
- **Activity timeline** — full audit log of board actions
- **Analytics dashboard** — task counts by status/priority, completion rate, overdue tasks
- **Comments** on tasks with real-time activity feed

### Edge Case Handling
- **Version-based conflict detection** on task updates (409 stale version)
- **Auto-refresh** on move failures and reconnect
- **Duplicate update prevention** in Zustand store
- **Invalid position clamping** on server-side move logic
- **Disconnect/reconnect** with automatic board resync

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Zustand, @hello-pangea/dnd |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io |
| Styling | Custom CSS (responsive, dark theme) |

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

## Setup

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

The API runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/boards` | Create board |
| GET | `/api/boards?userId=` | List user's boards |
| GET | `/api/boards/:id` | Get board with tasks & activities |
| POST | `/api/boards/:id/invite` | Invite member |
| GET | `/api/boards/:boardId/activities` | Activity timeline |
| GET | `/api/boards/:boardId/analytics` | Board analytics |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| POST | `/api/tasks/move` | Move/reorder task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:taskId/comments` | Add comment |
| GET | `/api/tasks/:taskId/comments` | Get comments |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_board` | Client → Server | Join a board room |
| `task_created` | Bidirectional | New task broadcast |
| `task_updated` | Bidirectional | Task edit broadcast |
| `task_moved` | Bidirectional | Drag & drop sync |
| `task_deleted` | Bidirectional | Task removal |
| `typing_start/stop` | Bidirectional | Typing indicators |
| `online_members` | Server → Client | Presence updates |
| `sync_required` | Server → Client | Trigger refresh on reconnect |

## Usage

1. Open the app and set your display name
2. Create a board or open an existing one
3. Share your user ID with teammates and invite them via the **Invite** button
4. Open the same board in multiple browser tabs to see real-time sync
5. Drag tasks between columns, edit via click, filter with the toolbar

## Project Structure

```
KANBAN/
├── backend/
│   ├── config/db.js
│   ├── controllers/boardController.js
│   ├── models/ (Board, Task, Activity, Comment)
│   ├── routes/api.js
│   ├── socket/socketHandler.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/ (Board, Column, TaskCard, TaskModal, etc.)
        ├── hooks/useSocket.js
        ├── store/boardStore.js
        └── services/api.js
```
