import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { config } from "./src/config/config.js";
import {
  startLiveClassReminderJob,
  stopLiveClassReminderJob,
} from "./src/jobs/liveClassReminder.job.js";

connectDB();

const PORT = config.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  startLiveClassReminderJob();
});

process.on("SIGTERM", () => {
  stopLiveClassReminderJob();

  process.exit(0);
});

process.on("SIGINT", () => {
  stopLiveClassReminderJob();

  process.exit(0);
});
