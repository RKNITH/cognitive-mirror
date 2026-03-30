import BurnoutLog from '../models/BurnoutLog.js';
import User from '../models/User.js';
import { generateContent } from '../config/gemini.js';
import { calculateBurnoutScore, getRiskLevel } from '../utils/helpers.js';

export const logFocusSession = async (req, res) => {
  try {
    const { focusScore, studyDuration, breaksTaken, productivityRating, emotionalState } = req.body;

    const burnoutScore = calculateBurnoutScore({
      studyDuration: parseInt(studyDuration) || 0,
      breaksTaken: parseInt(breaksTaken) || 0,
      focusScore: parseInt(focusScore) || 50,
      productivityRating: parseInt(productivityRating) || 5,
    });
    const riskLevel = getRiskLevel(burnoutScore);

    let aiInsights = 'Maintain balanced study sessions with regular short breaks.';
    let recoveryProtocol = 'Take a 15-minute break, hydrate, and do light stretching.';

    try {
      const prompt = `Student burnout assessment. Provide brief, actionable insights.
Focus Score: ${focusScore}/100 | Study Time: ${studyDuration} min | Breaks: ${breaksTaken}
Productivity: ${productivityRating}/10 | Emotional State: ${emotionalState || 'not specified'}
Burnout Score: ${burnoutScore}/100 | Risk Level: ${riskLevel}

Respond ONLY with JSON, no markdown:
{"insights": "2 sentence insight about current state", "recovery": "specific 3-step recovery protocol"}`;

      const raw = await generateContent(prompt);
      const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
      aiInsights = parsed.insights || aiInsights;
      recoveryProtocol = parsed.recovery || recoveryProtocol;
    } catch (e) { console.error('Gemini error:', e.message); }

    const alerts = [];
    if (riskLevel === 'critical') {
      alerts.push({ message: '🚨 Critical burnout risk! Stop studying and rest immediately.', type: 'critical', triggeredAt: new Date() });
    } else if (riskLevel === 'high') {
      alerts.push({ message: '⚠️ High burnout risk. Take a long break now.', type: 'warning', triggeredAt: new Date() });
    }

    const log = await BurnoutLog.create({
      user: req.user._id,
      date: new Date(),
      focusScore: parseInt(focusScore) || 50,
      studyDuration: parseInt(studyDuration) || 0,
      breaksTaken: parseInt(breaksTaken) || 0,
      productivityRating: parseInt(productivityRating) || 5,
      emotionalState: emotionalState || 'neutral',
      burnoutScore,
      riskLevel,
      aiInsights,
      recoveryProtocol,
      alerts,
    });

    await User.findByIdAndUpdate(req.user._id, {
      'cognitiveProfile.burnoutRisk': riskLevel,
      $inc: { totalStudyTime: parseInt(studyDuration) || 0 },
    });

    res.status(201).json({ success: true, data: log, message: 'Focus session logged' });
  } catch (error) {
    console.error('logFocusSession error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBurnoutHistory = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const data = await BurnoutLog.find({ user: req.user._id, createdAt: { $gte: since } })
      .sort({ createdAt: -1 });

    const avgBurnout = data.length
      ? Math.round(data.reduce((acc, d) => acc + d.burnoutScore, 0) / data.length)
      : 0;

    res.json({
      success: true,
      data,
      summary: {
        avgBurnout,
        currentRisk: data[0]?.riskLevel || 'low',
        totalSessions: data.length,
        totalStudyTime: data.reduce((a, d) => a + (d.studyDuration || 0), 0),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
