import { PRIORITY_COLORS, formatDate, isOverdue } from '../utils/constants';

export default function TaskCard({ task, onClick }) {
  const overdue = task.dueDate && isOverdue(task.dueDate, task.status);

  return (
    <div className={`task-card ${overdue ? 'task-overdue' : ''}`} onClick={() => onClick(task)}>
      <div className="task-card-top">
        <div className="task-card-title">{task.title}</div>
        <span
          className="badge badge-priority"
          style={{ background: PRIORITY_COLORS[task.priority] }}
        >
          {task.priority}
        </span>
      </div>
      <div className="task-card-meta">
        {task.dueDate && (
          <span className={`task-due-badge ${overdue ? 'overdue' : ''}`}>
            <span className="due-icon">📅</span>
            {formatDate(task.dueDate)}
            {overdue && <span className="overdue-label">Overdue</span>}
          </span>
        )}
        {task.assignedTo && <span className="task-assignee">{task.assignedTo}</span>}
      </div>
    </div>
  );
}
