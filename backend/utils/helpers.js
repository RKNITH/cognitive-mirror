import crypto from 'crypto';

export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const calculateBurnoutScore = ({ studyDuration = 0, breaksTaken = 0, focusScore = 100, productivityRating = 10 }) => {
  let score = 0;
  if (studyDuration > 480) score += 30;
  else if (studyDuration > 360) score += 20;
  else if (studyDuration > 240) score += 10;
  if (breaksTaken < 1) score += 25;
  else if (breaksTaken < 2) score += 15;
  if (focusScore < 30) score += 25;
  else if (focusScore < 50) score += 15;
  if (productivityRating < 3) score += 20;
  else if (productivityRating < 5) score += 10;
  return Math.min(score, 100);
};

export const getRiskLevel = (score) => {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
};

export const calculateCognitiveScore = ({ sleep, mood, stressLevel, activity }) => {
  let score = 0;
  if (sleep) {
    const durScore = Math.min((sleep.duration / 8) * 40, 40);
    const qualScore = ((sleep.quality || 5) / 10) * 20;
    score += durScore + qualScore;
  } else { score += 30; }
  if (mood) score += (mood / 10) * 20;
  else score += 10;
  if (stressLevel) score -= (stressLevel / 10) * 15;
  if (activity && activity.intensity === 'high') score += 10;
  else if (activity && activity.intensity === 'medium') score += 6;
  else if (activity) score += 3;
  return Math.round(Math.min(100, Math.max(0, score)));
};
