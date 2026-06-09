import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const defaultSettings = {
  masterEnabled: false,
  pendingTasks: { enabled: false, frequency: 'daily' },
  workingHours: {
    enabled: false,
    start: '09:00',
    end: '17:00',
    days: [1, 2, 3, 4, 5],
    sendStartSummary: true,
  },
  missedDeadlines: { enabled: false, frequency: 'daily' },
};

export default function EmailSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [email, setEmail] = useState('');
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [preview, setPreview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsData, previewData, logsData] = await Promise.all([
        api.getEmailSettings(),
        api.getEmailPreview(),
        api.getEmailLogs(),
      ]);
      setSettings({ ...defaultSettings, ...settingsData.settings });
      setEmail(settingsData.email);
      setEmailConfigured(settingsData.emailConfigured);
      setPreview(previewData);
      setLogs(logsData);
    } catch (err) {
      setError(err.error || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const data = await api.updateEmailSettings(settings);
      setSettings(data.settings);
      setMessage('Settings saved successfully');
      const previewData = await api.getEmailPreview();
      setPreview(previewData);
    } catch (err) {
      setError(err.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setMessage('');
    setError('');
    try {
      const data = await api.sendTestEmail();
      setMessage(data.message);
      const logsData = await api.getEmailLogs();
      setLogs(logsData);
    } catch (err) {
      setError(err.error || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  const handleRunNow = async () => {
    try {
      const data = await api.runEmailMonitor();
      setMessage(data.message);
      const logsData = await api.getEmailLogs();
      setLogs(logsData);
    } catch (err) {
      setError(err.error || 'Monitor run failed');
    }
  };

  const toggleDay = (day) => {
    setSettings((prev) => {
      const days = prev.workingHours.days.includes(day)
        ? prev.workingHours.days.filter((d) => d !== day)
        : [...prev.workingHours.days, day].sort();
      return {
        ...prev,
        workingHours: { ...prev.workingHours, days },
      };
    });
  };

  const updateMonitor = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading"><span className="spinner" /> Loading email settings...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="email-settings-page">
        <div className="page-header animate-fade-up">
          <div>
            <h1>Email Monitor</h1>
            <p>Configure email alerts for {email}</p>
          </div>
        </div>

        {!emailConfigured && (
          <div className="alert-banner warning animate-fade-up">
            SMTP is not configured on the server. Emails will be logged to the backend console.
            Add SMTP settings to <code>backend/.env</code> for real delivery.
          </div>
        )}

        {message && <div className="alert-banner success animate-fade-up">{message}</div>}
        {error && <div className="alert-banner error animate-fade-up">{error}</div>}

        <div className="email-settings-grid">
          <div className="settings-main">
            <div className="settings-card animate-fade-up">
              <div className="settings-card-header">
                <div>
                  <h2>Master Switch</h2>
                  <p>Enable or disable all email notifications</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.masterEnabled}
                    onChange={(e) => setSettings((p) => ({ ...p, masterEnabled: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className={`settings-card animate-fade-up delay-1 ${!settings.masterEnabled ? 'disabled' : ''}`}>
              <div className="monitor-header">
                <span className="monitor-icon">📋</span>
                <div className="monitor-title">
                  <h3>Pending Tasks</h3>
                  <p>Get digest emails for tasks assigned to you that aren't done</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.pendingTasks.enabled}
                    disabled={!settings.masterEnabled}
                    onChange={(e) => updateMonitor('pendingTasks', 'enabled', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              {settings.pendingTasks.enabled && settings.masterEnabled && (
                <div className="monitor-options">
                  <label className="form-label">Frequency</label>
                  <select
                    className="form-select"
                    value={settings.pendingTasks.frequency}
                    onChange={(e) => updateMonitor('pendingTasks', 'frequency', e.target.value)}
                  >
                    <option value="daily">Daily (at start of working hours)</option>
                    <option value="weekly">Weekly (Monday morning)</option>
                  </select>
                  {preview && (
                    <div className="monitor-preview-badge">
                      {preview.pendingCount} pending task{preview.pendingCount !== 1 ? 's' : ''} right now
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={`settings-card animate-fade-up delay-2 ${!settings.masterEnabled ? 'disabled' : ''}`}>
              <div className="monitor-header">
                <span className="monitor-icon">🕐</span>
                <div className="monitor-title">
                  <h3>Working Hours</h3>
                  <p>Set when you work — alerts only send during these hours</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.workingHours.enabled}
                    disabled={!settings.masterEnabled}
                    onChange={(e) => updateMonitor('workingHours', 'enabled', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              {settings.workingHours.enabled && settings.masterEnabled && (
                <div className="monitor-options">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Start Time</label>
                      <input
                        className="form-input"
                        type="time"
                        value={settings.workingHours.start}
                        onChange={(e) => updateMonitor('workingHours', 'start', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Time</label>
                      <input
                        className="form-input"
                        type="time"
                        value={settings.workingHours.end}
                        onChange={(e) => updateMonitor('workingHours', 'end', e.target.value)}
                      />
                    </div>
                  </div>
                  <label className="form-label">Working Days</label>
                  <div className="day-picker">
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        className={`day-chip ${settings.workingHours.days.includes(d.value) ? 'active' : ''}`}
                        onClick={() => toggleDay(d.value)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={settings.workingHours.sendStartSummary}
                      onChange={(e) => updateMonitor('workingHours', 'sendStartSummary', e.target.checked)}
                    />
                    Send morning task summary at start of working hours
                  </label>
                </div>
              )}
            </div>

            <div className={`settings-card animate-fade-up delay-3 ${!settings.masterEnabled ? 'disabled' : ''}`}>
              <div className="monitor-header">
                <span className="monitor-icon">⚠️</span>
                <div className="monitor-title">
                  <h3>Missed Deadlines</h3>
                  <p>Get alerted when tasks pass their due date</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.missedDeadlines.enabled}
                    disabled={!settings.masterEnabled}
                    onChange={(e) => updateMonitor('missedDeadlines', 'enabled', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              {settings.missedDeadlines.enabled && settings.masterEnabled && (
                <div className="monitor-options">
                  <label className="form-label">Alert Frequency</label>
                  <select
                    className="form-select"
                    value={settings.missedDeadlines.frequency}
                    onChange={(e) => updateMonitor('missedDeadlines', 'frequency', e.target.value)}
                  >
                    <option value="daily">Daily digest</option>
                    <option value="immediate">Immediate (as soon as deadline passes)</option>
                  </select>
                  {preview && (
                    <div className="monitor-preview-badge overdue">
                      {preview.missedCount} overdue task{preview.missedCount !== 1 ? 's' : ''} right now
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="settings-actions animate-fade-up delay-4">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button className="btn btn-secondary" onClick={handleTestEmail} disabled={testing}>
                {testing ? 'Sending...' : 'Send Test Email'}
              </button>
              {settings.masterEnabled && (
                <button className="btn btn-secondary" onClick={handleRunNow}>
                  Run Monitor Now
                </button>
              )}
            </div>
          </div>

          <div className="settings-sidebar animate-fade-up delay-2">
            <div className="settings-card">
              <h3>Live Preview</h3>
              {preview ? (
                <>
                  <div className="preview-stat">
                    <span className="preview-num">{preview.pendingCount}</span>
                    <span>Pending Tasks</span>
                  </div>
                  <div className="preview-stat overdue">
                    <span className="preview-num">{preview.missedCount}</span>
                    <span>Missed Deadlines</span>
                  </div>
                  {preview.missedTasks?.length > 0 && (
                    <div className="preview-list">
                      <h4>Overdue</h4>
                      {preview.missedTasks.map((t) => (
                        <div key={t._id} className="preview-task">
                          <span>{t.title}</span>
                          <span className="preview-due">{t.dueDate?.slice(0, 10)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {preview.pendingTasks?.length > 0 && (
                    <div className="preview-list">
                      <h4>Pending</h4>
                      {preview.pendingTasks.slice(0, 5).map((t) => (
                        <div key={t._id} className="preview-task">
                          <span>{t.title}</span>
                          <span className="preview-status">{t.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No tasks to monitor</p>
              )}
            </div>

            <div className="settings-card">
              <h3>Recent Emails</h3>
              {logs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No emails sent yet</p>
              ) : (
                <div className="email-logs">
                  {logs.map((log) => (
                    <div key={log._id} className="email-log-item">
                      <span className="log-type">{log.alertType.replace(/_/g, ' ')}</span>
                      <span className="log-time">
                        {new Date(log.sentAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
