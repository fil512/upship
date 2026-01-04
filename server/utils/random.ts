/**
 * Random Utilities
 * Shared random/shuffle functions used across the application
 *
 * Note: Math.random() is intentionally used for game card shuffling.
 * Cryptographic randomness is not required for this use case.
 */

/* eslint-disable sonarjs/pseudo-random */

/**
 * Fisher-Yates shuffle algorithm
 * Returns a new shuffled array without modifying the original
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Pick a random element from an array
 */
export function pickRandom<T>(array: T[]): T | undefined {
  if (!array || array.length === 0) {
    return undefined;
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a unique ID with timestamp
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// CommonJS compatibility
module.exports = {
  shuffleArray,
  pickRandom,
  generateId
};
