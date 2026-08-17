/**
 * Utility helper to perform chunked bulk database operations in MongoDB / Mongoose.
 * 
 * Benefits:
 * - Avoids exceeding BSON document / command size limits (16MB).
 * - Avoids holding collection-level or document-level locks for excessively long durations.
 * - Supports transactions via Mongoose sessions.
 * - Reduces N roundtrips down to ceil(N / chunkSize) roundtrips.
 */

/**
 * Execute bulkWrite operations in bounded chunks.
 *
 * @param {import("mongoose").Model} Model - The Mongoose Model
 * @param {Array<Object>} operations - Array of Mongoose/MongoDB bulk operations (insertOne, updateOne, etc.)
 * @param {Object} [options]
 * @param {number} [options.chunkSize=500] - Number of operations per batch
 * @param {import("mongoose").ClientSession} [options.session] - Mongoose transaction session
 * @param {boolean} [options.ordered=false] - Whether operations should be executed in order
 * @returns {Promise<Array<any>>} - Array of bulkWrite results for each chunk
 */
export async function executeChunkedBulkWrite(
  Model,
  operations,
  { chunkSize = 500, session, ordered = false } = {}
) {
  if (!operations || operations.length === 0) {
    return [];
  }

  const results = [];
  const safeChunkSize = Math.max(1, chunkSize);

  for (let i = 0; i < operations.length; i += safeChunkSize) {
    const chunk = operations.slice(i, i + safeChunkSize);
    const writeOptions = { ordered };
    if (session) {
      writeOptions.session = session;
    }

    const res = await Model.bulkWrite(chunk, writeOptions);
    results.push(res);
  }

  return results;
}

/**
 * Execute insertMany in bounded chunks.
 *
 * @param {import("mongoose").Model} Model - The Mongoose Model
 * @param {Array<Object>} documents - Array of document objects to insert
 * @param {Object} [options]
 * @param {number} [options.chunkSize=500] - Number of documents per batch
 * @param {import("mongoose").ClientSession} [options.session] - Mongoose transaction session
 * @param {boolean} [options.ordered=false] - Whether insert should be ordered
 * @returns {Promise<Array<any>>} - Array of inserted documents across all chunks
 */
export async function executeChunkedInsertMany(
  Model,
  documents,
  { chunkSize = 500, session, ordered = false } = {}
) {
  if (!documents || documents.length === 0) {
    return [];
  }

  const results = [];
  const safeChunkSize = Math.max(1, chunkSize);

  for (let i = 0; i < documents.length; i += safeChunkSize) {
    const chunk = documents.slice(i, i + safeChunkSize);
    const insertOptions = { ordered };
    if (session) {
      insertOptions.session = session;
    }

    const res = await Model.insertMany(chunk, insertOptions);
    results.push(...res);
  }

  return results;
}
