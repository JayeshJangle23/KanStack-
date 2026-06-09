const cron = require('node-cron');
const { runEmailMonitor } = require('../services/monitorService');

function startEmailMonitorJob() {
  const schedule = process.env.EMAIL_MONITOR_CRON || '*/15 * * * *';

  cron.schedule(schedule, () => {
    runEmailMonitor();
  });

  console.log(`📬 Email monitor scheduled: ${schedule}`);
}

module.exports = startEmailMonitorJob;
