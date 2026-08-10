import {
  asyncHandler,
} from "../utils/asyncHandler.js";

import {
  indexLectureForAi,
} from "../service/lectureRag.service.js";

/*
 * Manual index/re-index.
 *
 * Instructor/Admin use kar sakta hai.
 */
export const indexLectureForAiController =
  asyncHandler(
    async (req, res) => {
      const {
        lectureId,
      } = req.params;

      const result =
        await indexLectureForAi({
          userId:
            req.user.id,

          userRole:
            req.user.role,

          lectureId,
        });

      return res
        .status(200)
        .json({
          success: true,

          message:
            result.message,

          result,
        });
    },
  );