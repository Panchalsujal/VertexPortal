import { processLiveClassReminders } from "../service/liveClassReminder.service.js";

const ONE_MINUTE = 60 * 1000;

let reminderJob = null;
let isRunning = false;

async function runReminderJob() {
  /*
   * Previous cycle complete hone se pehle
   * next cycle start nahi hoga.
   */
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    const result = await processLiveClassReminders();

    /*
     * Development me useful.
     * Production me logger use karenge.
     */
    if (
      result.reminder24Hours > 0 ||
      result.reminder1Hour > 0 ||
      result.reminder10Minutes > 0 ||
      result.failed > 0
    ) {
      console.log("Live class reminder job:", result);
    }
  } catch (error) {
    console.error("Live class reminder job failed:", error);
  } finally {
    isRunning = false;
  }
}

export function startLiveClassReminderJob() {
  if (reminderJob) {
    console.log("Live class reminder job is already running");
    return;
  }

  console.log("Live class reminder job started (running every 60s)");

  /*
   * Server start hote hi first check.
   */
  runReminderJob().catch((err) => {
    console.error("Initial reminder job error:", err);
  });

  reminderJob = setInterval(runReminderJob, ONE_MINUTE);
}

export function stopLiveClassReminderJob() {
  if (!reminderJob) {
    return;
  }

  clearInterval(reminderJob);

  reminderJob = null;

  console.log("Live class reminder job stopped");
}
