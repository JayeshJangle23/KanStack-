const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: SMTP_PORT === '465',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function buildTaskListHtml(tasks, title) {
  if (!tasks.length) {
    return `<p style="color:#6b7280;">No tasks in this category.</p>`;
  }

  const rows = tasks
    .map(
      (t) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${t.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${t.status}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${t.priority}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
    </tr>`
    )
    .join('');

  return `
    <h3 style="color:#111827;margin:16px 0 8px;">${title} (${tasks.length})</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 12px;text-align:left;">Task</th>
          <th style="padding:8px 12px;text-align:left;">Status</th>
          <th style="padding:8px 12px;text-align:left;">Priority</th>
          <th style="padding:8px 12px;text-align:left;">Due</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function wrapEmail(content, userName) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;color:#fff;">
      <h1 style="margin:0;font-size:20px;">⬡ KanbanFlow Monitor</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">Hello ${userName},</p>
    </div>
    <div style="padding:24px;">${content}</div>
    <div style="padding:16px 24px;background:#f3f4f6;text-align:center;">
      <a href="${clientUrl}/boards" style="color:#6366f1;text-decoration:none;font-weight:600;">Open KanbanFlow →</a>
      <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">Manage alerts in Email Monitor settings</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'KanbanFlow <noreply@kanbanflow.com>';

  if (!transport) {
    console.log('\n📧 [Email Monitor - SMTP not configured, logging instead]');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log('   (Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env to send real emails)\n');
    return { success: true, simulated: true };
  }

  await transport.sendMail({ from, to, subject, html });
  return { success: true, simulated: false };
}

async function sendPendingTasksEmail(user, tasks) {
  const html = wrapEmail(
    buildTaskListHtml(tasks, 'Your Pending Tasks') +
      `<p style="color:#6b7280;font-size:13px;margin-top:16px;">These tasks are assigned to you and not yet completed.</p>`,
    user.name
  );
  return sendEmail({
    to: user.email,
    subject: `[KanbanFlow] ${tasks.length} pending task${tasks.length !== 1 ? 's' : ''} need your attention`,
    html,
  });
}

async function sendMissedDeadlinesEmail(user, tasks) {
  const html = wrapEmail(
    buildTaskListHtml(tasks, 'Missed Deadlines') +
      `<p style="color:#ef4444;font-size:13px;margin-top:16px;">⚠️ These tasks are past their due date and not marked Done.</p>`,
    user.name
  );
  return sendEmail({
    to: user.email,
    subject: `[KanbanFlow] ⚠️ ${tasks.length} overdue task${tasks.length !== 1 ? 's' : ''}`,
    html,
  });
}

async function sendWorkingHoursSummaryEmail(user, tasks) {
  const html = wrapEmail(
    `<p style="color:#374151;">Your working day is starting. Here's what's on your plate:</p>` +
      buildTaskListHtml(tasks, "Today's Tasks") +
      `<p style="color:#6b7280;font-size:13px;margin-top:16px;">Working hours: ${user.emailSettings.workingHours.start} – ${user.emailSettings.workingHours.end}</p>`,
    user.name
  );
  return sendEmail({
    to: user.email,
    subject: `[KanbanFlow] Good morning! ${tasks.length} task${tasks.length !== 1 ? 's' : ''} for today`,
    html,
  });
}

async function sendTestEmail(user) {
  const html = wrapEmail(
    `<p style="color:#374151;">This is a test email from KanbanFlow Email Monitor.</p>
     <p style="color:#6b7280;font-size:14px;">Your notification settings are working correctly.</p>
     <ul style="color:#374151;font-size:14px;line-height:1.8;">
       <li>Pending Tasks monitor</li>
       <li>Working Hours monitor</li>
       <li>Missed Deadlines monitor</li>
     </ul>`,
    user.name
  );
  return sendEmail({
    to: user.email,
    subject: '[KanbanFlow] Test Email — Monitor Active',
    html,
  });
}

module.exports = {
  isEmailConfigured,
  sendPendingTasksEmail,
  sendMissedDeadlinesEmail,
  sendWorkingHoursSummaryEmail,
  sendTestEmail,
};
