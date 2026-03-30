import Quiz from '../models/Quiz.js';
import BioRhythm from '../models/BioRhythm.js';
import BurnoutLog from '../models/BurnoutLog.js';
import Mistake from '../models/Mistake.js';
import Feynman from '../models/Feynman.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [quizCount, bioLogs, burnoutLogs, unresolvedMistakes, feynmanEntries] = await Promise.all([
      Quiz.countDocuments({ user: userId, submitted: true }),
      BioRhythm.find({ user: userId }).sort({ createdAt: -1 }).limit(7),
      BurnoutLog.find({ user: userId }).sort({ createdAt: -1 }).limit(7),
      Mistake.countDocuments({ user: userId, resolved: false }),
      Feynman.find({ user: userId, status: 'completed' }).sort({ createdAt: -1 }).limit(5),
    ]);

    const avgCognitive = bioLogs.length
      ? Math.round(bioLogs.reduce((a, b) => a + (b.cognitiveScore || 70), 0) / bioLogs.length)
      : 0;

    const avgBurnout = burnoutLogs.length
      ? Math.round(burnoutLogs.reduce((a, b) => a + (b.burnoutScore || 0), 0) / burnoutLogs.length)
      : 0;

    const feynmanAvg = feynmanEntries.length
      ? Math.round(feynmanEntries.reduce((a, b) => a + (b.gapAnalysis?.score || 0), 0) / feynmanEntries.length)
      : 0;

    res.json({
      success: true,
      stats: {
        totalQuizzes: quizCount,
        avgCognitiveScore: avgCognitive,
        avgBurnoutScore: avgBurnout,
        unresolvedMistakes,
        feynmanAvgScore: feynmanAvg,
        xp: req.user.xp,
        streak: req.user.streak,
        cognitiveTimeline: bioLogs.slice().reverse().map(b => ({ date: b.createdAt, score: b.cognitiveScore || 70 })),
        burnoutTimeline: burnoutLogs.slice().reverse().map(b => ({ date: b.createdAt, score: b.burnoutScore || 0 })),
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
