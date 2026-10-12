import { ALPHABET_KEYS } from './phonicsData';

export function selectWeightedTargetLetter(stats) {
  const letters = stats?.letters || {};
  const weights = {};
  let totalWeight = 0;

  ALPHABET_KEYS.forEach((ltr) => {
    const data = letters[ltr];
    let weight = 10; // Default baseline weight

    if (!data || data.total === 0) {
      weight = 15; // Unpracticed sounds get higher priority
    } else {
      const accuracy = data.correct / data.total;
      if (accuracy < 0.5) {
        weight = 30; // High frequency for low accuracy
      } else if (accuracy < 0.75) {
        weight = 20; // Medium frequency
      } else if (accuracy < 1.0) {
        weight = 10;
      } else {
        weight = Math.max(3, 10 - data.correct); // Mastered sounds appear less often
      }
    }

    weights[ltr] = weight;
    totalWeight += weight;
  });

  let randomVal = Math.random() * totalWeight;
  for (const ltr of ALPHABET_KEYS) {
    randomVal -= weights[ltr];
    if (randomVal <= 0) {
      return ltr;
    }
  }

  return ALPHABET_KEYS[Math.floor(Math.random() * ALPHABET_KEYS.length)];
}

export function getFocusLetters(stats, count = 3) {
  const letters = stats?.letters || {};
  const letterStatsArray = ALPHABET_KEYS.map((ltr) => {
    const data = letters[ltr] || { correct: 0, total: 0 };
    const accuracy = data.total > 0 ? data.correct / data.total : 0;
    return {
      letter: ltr,
      correct: data.correct,
      total: data.total,
      accuracy,
    };
  });

  // Sort by low accuracy, then by least practiced
  const needsPractice = letterStatsArray
    .filter((item) => item.total > 0 && item.accuracy < 0.8)
    .sort((a, b) => a.accuracy - b.accuracy || a.total - b.total);

  if (needsPractice.length >= count) {
    return needsPractice.slice(0, count);
  }

  const unpracticed = letterStatsArray
    .filter((item) => item.total === 0)
    .sort(() => 0.5 - Math.random());

  return [...needsPractice, ...unpracticed].slice(0, count);
}
