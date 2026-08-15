import { processLiveClassReminders } from "../service/liveClassReminder.service.js";

const ONE_MINUTE = 60 * 1000;

let reminderJob = null;
let isRunning = false;
let cycleCount = 0;

async function runReminderJob() {
  if (isRunning) {
    return;
  }

  isRunning = true;
  cycleCount += 1;

  try {
    const result = await processLiveClassReminders();

    // Log whenever reminders are dispatched or every 10 cycles (10 mins) as heartbeat
    if (
      result.reminder24Hours > 0 ||
      result.reminder1Hour > 0 ||
      result.reminder10Minutes > 0 ||
      result.failed > 0
    ) {
      console.log(`[LIVE REMINDER] Dispatched reminders:`, result);
    } else if (cycleCount % 10 === 0) {
      console.log(`[LIVE REMINDER HEARTBEAT] Active - checked ${cycleCount} cycles`);
    }
  } catch (error) {
    console.error("[LIVE REMINDER ERROR] Cycle failed gracefully:", error?.message || error);
  } finally {
    isRunning = false;
  }
}

export function startLiveClassReminderJob() {
  if (reminderJob) {
    console.log("[LIVE REMINDER] Job is already running");
    return;
  }

  console.log("[LIVE REMINDER] Job started (checking every 60s)");

  runReminderJob().catch((err) => {
    console.error("[LIVE REMINDER] Initial check error:", err);
  });

  reminderJob = setInterval(runReminderJob, ONE_MINUTE);
}

export function stopLiveClassReminderJob() {
  if (!reminderJob) {
    return;
  }

  clearInterval(reminderJob);
  reminderJob = null;
  console.log("[LIVE REMINDER] Job stopped (graceful shutdown signal received)");
}
