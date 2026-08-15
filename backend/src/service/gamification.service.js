import User from "../models/user.model.js";

const DEFAULT_BADGES = [
  {
    id: "welcome_scholar",
    title: "Welcome Scholar",
    description: "Joined VertexPortal and began the learning journey.",
    icon: "sparkles",
  },
  {
    id: "streak_3",
    title: "On Fire (3-Day Streak)",
    description: "Maintained a 3-day continuous daily learning streak.",
    icon: "flame",
  },
  {
    id: "streak_7",
    title: "Unstoppable (7-Day Streak)",
    description: "Maintained a 7-day continuous daily learning streak.",
    icon: "zap",
  },
  {
    id: "quiz_ace",
    title: "Quiz Ace",
    description: "Successfully completed and passed course quizzes.",
    icon: "award",
  },
];

/**
 * Updates a student's daily learning streak and checks for badge awards.
 */
export async function recordStudentActivity(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const streak = user.learningStreak || {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: now,
    };

    const lastActive = streak.lastActiveDate
      ? new Date(streak.lastActiveDate)
      : new Date(0);
    const lastActiveDay = new Date(
      lastActive.getFullYear(),
      lastActive.getMonth(),
      lastActive.getDate()
    );

    const diffInDays = Math.round(
      (today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 1) {
      // Continuous streak next day
      streak.currentStreak += 1;
      if (streak.currentStreak > (streak.longestStreak || 1)) {
        streak.longestStreak = streak.currentStreak;
      }
      streak.lastActiveDate = now;
    } else if (diffInDays > 1) {
      // Streak broken, reset to 1
      streak.currentStreak = 1;
      streak.lastActiveDate = now;
    } else {
      // Same day activity, simply refresh timestamp
      streak.lastActiveDate = now;
    }

    user.learningStreak = streak;

    // Check & award badges
    const userBadgeIds = new Set((user.badges || []).map((b) => b.id));

    // Welcome badge
    if (!userBadgeIds.has("welcome_scholar")) {
      user.badges.push({
        ...DEFAULT_BADGES[0],
        earnedAt: now,
      });
      userBadgeIds.add("welcome_scholar");
    }

    // 3-Day streak badge
    if (streak.currentStreak >= 3 && !userBadgeIds.has("streak_3")) {
      user.badges.push({
        ...DEFAULT_BADGES[1],
        earnedAt: now,
      });
      userBadgeIds.add("streak_3");
    }

    // 7-Day streak badge
    if (streak.currentStreak >= 7 && !userBadgeIds.has("streak_7")) {
      user.badges.push({
        ...DEFAULT_BADGES[2],
        earnedAt: now,
      });
      userBadgeIds.add("streak_7");
    }

    await user.save();
    return {
      streak: user.learningStreak,
      badges: user.badges,
    };
  } catch (err) {
    console.error("Gamification record error:", err);
    return null;
  }
}
