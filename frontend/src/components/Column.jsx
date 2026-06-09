import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { STATUS_COLORS, PRIORITIES } from '../utils/constants';
import TaskCard from './TaskCard';

export default function Column({ status, tasks, onAddTask, onTaskClick }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');

  const resetForm = () => {
    setNewTitle('');
    setPriority('Medium');
    setDueDate('');
    setIsAdding(false);
  };

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAddTask(status, {
        title: newTitle.trim(),
        priority,
        dueDate: dueDate || null,
      });
      resetForm();
    }
  };

  return (
    <div className="column">
      <div className="column-header">
        <div className="column-title">
          <span className="status-dot" style={{ background: STATUS_COLORS[status] }} />
          {status}
          <span className="column-count">{tasks.length}</span>
        </div>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            className={`column-body ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={dragSnapshot.isDragging ? 'task-card dragging' : ''}
                  >
                    <TaskCard task={task} onClick={onTaskClick} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {isAdding ? (
              <div className="add-task-form">
                <input
                  className="form-input"
                  autoFocus
                  placeholder="Task title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') resetForm();
                  }}
                />
                <div className="add-task-fields">
                  <div className="add-task-field">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="add-task-field">
                    <label className="form-label">Due Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="add-task-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleAdd}>
                    Add
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={resetForm}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="add-task-btn" onClick={() => setIsAdding(true)}>
                + Add task
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
