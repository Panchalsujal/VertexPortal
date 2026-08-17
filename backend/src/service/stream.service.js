import { StreamClient } from "@stream-io/node-sdk";
import { config } from "../config/config.js";
import { circuitBreakers } from "../utils/circuitBreaker.js";

let streamClientInstance = null;

/**
 * Get or initialize the StreamClient singleton
 */
export function getStreamClient() {
  if (!streamClientInstance) {
    if (!config.STREAM_API_KEY || !config.STREAM_API_SECRET) {
      throw new Error("STREAM_API_KEY and STREAM_API_SECRET must be configured");
    }
    streamClientInstance = new StreamClient(
      config.STREAM_API_KEY,
      config.STREAM_API_SECRET,
      {
        timeout: 10000,
      }
    );
  }
  return streamClientInstance;
}

/**
 * Generate a Stream Video/Chat user token for a given user
 * @param {Object} params
 * @param {string} params.userId - Unique user ID (e.g. MongoDB user._id)
 * @param {number} [params.validityInSeconds=86400] - Token expiration in seconds (default 24h)
 * @param {string} [params.role] - Optional role in Stream
 * @returns {string} Stream JWT token
 */
export function generateStreamUserToken({
  userId,
  validityInSeconds = 24 * 60 * 60,
  role,
}) {
  const client = getStreamClient();
  const options = {
    user_id: String(userId),
    validity_in_seconds: validityInSeconds,
  };
  if (role) {
    options.role = role;
  }
  return client.generateUserToken(options);
}

/**
 * Upsert a user record in GetStream
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.name
 * @param {string} [params.image]
 * @param {string} [params.role]
 * @param {Object} [params.custom]
 */
export async function upsertStreamUser({
  userId,
  name,
  image = "",
  role = "user",
  custom = {},
}) {
  try {
    const client = getStreamClient();
    await circuitBreakers.stream.fire(() =>
      client.upsertUsers([
        {
          id: String(userId),
          name: name || "User",
          image: image || undefined,
          role: role || "user",
          custom,
        },
      ])
    );
  } catch (error) {
    // Log error but don't strictly block caller if offline/soft failure
    console.error("Failed to upsert user to GetStream:", error?.message || error);
  }
}

/**
 * Create or get a Stream Video Call / Livestream room
 * @param {Object} params
 * @param {string} params.callId - Unique call identifier
 * @param {string} [params.callType="default"] - Call type ("default", "livestream", "audio_room")
 * @param {string} params.createdById - User ID of creator / host
 * @param {string} params.title - Title / topic of live class
 * @param {Date|string} [params.startsAt] - Scheduled start time
 * @param {Object} [params.customData] - Custom metadata
 */
export async function createStreamCall({
  callId,
  callType = "default",
  createdById,
  title,
  startsAt,
  customData = {},
}) {
  const client = getStreamClient();
  const call = client.video.call(callType, String(callId));

  const callData = {
    created_by_id: String(createdById),
    custom: {
      title: title || "Live Class",
      ...customData,
    },
  };

  if (startsAt) {
    callData.starts_at = new Date(startsAt).toISOString();
  }

  const response = await circuitBreakers.stream.fire(() =>
    call.getOrCreate({
      data: callData,
    })
  );

  return {
    call,
    callData: response,
    callId: String(callId),
    callType,
    apiKey: config.STREAM_API_KEY,
  };
}

/**
 * Fetch Stream Call metadata
 * @param {Object} params
 * @param {string} params.callId
 * @param {string} [params.callType="default"]
 */
export async function getStreamCall({ callId, callType = "default" }) {
  const client = getStreamClient();
  const call = client.video.call(callType, String(callId));
  return await circuitBreakers.stream.fire(() => call.get());
}
