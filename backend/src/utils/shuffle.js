import { createHash } from "node:crypto";

function getSeedNumber(seed) {
  const hash = createHash("sha256")
    .update(String(seed))
    .digest();

  return hash.readUInt32BE(0);
}

function createSeededRandom(seed) {
  let state = getSeedNumber(seed) || 1;

  return function random() {
    state = (state * 1664525 + 1013904223) >>> 0;

    return state / 4294967296;
  };
}

export function shuffleWithSeed(items, seed) {
  const shuffledItems = [...items];
  const random = createSeededRandom(seed);

  for (
    let index = shuffledItems.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      random() * (index + 1),
    );

    [
      shuffledItems[index],
      shuffledItems[randomIndex],
    ] = [
      shuffledItems[randomIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
}