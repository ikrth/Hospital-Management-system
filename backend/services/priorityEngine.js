const LEVELS = ['low', 'medium', 'high', 'critical'];

const calculatePriorityScore = (symptoms, aiScore, patientAge) => {
  let priorityLevel = 'low';
  if (aiScore >= 8) priorityLevel = 'critical';
  else if (aiScore >= 6) priorityLevel = 'high';
  else if (aiScore >= 4) priorityLevel = 'medium';

  let boosted = false;
  if (patientAge > 70 || patientAge < 5) {
    const index = LEVELS.indexOf(priorityLevel);
    if (index < LEVELS.length - 1) {
      priorityLevel = LEVELS[index + 1];
      boosted = true;
    }
  }

  const adjustedScore = boosted ? Math.min(10, aiScore + 1) : aiScore;

  return { priorityLevel, adjustedScore, boosted };
};

module.exports = { calculatePriorityScore };
