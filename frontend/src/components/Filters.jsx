import { useBoardStore } from '../store/boardStore';
import { PRIORITIES } from '../utils/constants';

export default function Filters() {
  const { board, filters, setFilter, resetFilters } = useBoardStore();

  return (
    <div className="filters-bar">
      <div className="filter-group">
        <span className="filter-label">Search</span>
        <input
          className="filter-input"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <span className="filter-label">Priority</span>
        <select
          className="filter-select"
          value={filters.priority}
          onChange={(e) => setFilter('priority', e.target.value)}
        >
          <option value="">All</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">Member</span>
        <select
          className="filter-select"
          value={filters.member}
          onChange={(e) => setFilter('member', e.target.value)}
        >
          <option value="">All</option>
          {(board?.members || []).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">Due Date</span>
        <input
          className="filter-select"
          type="date"
          value={filters.dueDate}
          onChange={(e) => setFilter('dueDate', e.target.value)}
        />
      </div>

      {(filters.priority || filters.member || filters.dueDate || filters.search) && (
        <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
          Clear filters
        </button>
      )}
    </div>
  );
}
