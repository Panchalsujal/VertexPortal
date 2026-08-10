import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { config } from "./src/config/config.js";
import {
  startLiveClassReminderJob,
  stopLiveClassReminderJob,
} from "./src/jobs/liveClassReminder.job.js";

connectDB();
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);

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
