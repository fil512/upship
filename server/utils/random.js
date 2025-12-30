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
 *
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Pick a random element from an array
 *
 * @param {Array} array - Array to pick from
 * @returns {*} Random element or undefined if array is empty
 */
function pickRandom(array) {
  if (!array || array.length === 0) {
    return undefined;
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a unique ID with timestamp
 *
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

module.exports = {
  shuffleArray,
  pickRandom,
  generateId
};
