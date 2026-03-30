import BioRhythm from '../models/BioRhythm.js';
import { generateContent } from '../config/gemini.js';
import { calculateCognitiveScore } from '../utils/helpers.js';

// Normalise incoming data so it matches the Mongoose schema.
// The frontend sends activity.type and meal.type, but 'type' is a reserved
// Mongoose keyword at the schema root level, so the schema stores them as
// activityType / mealType instead. We remap here so both old and new
// clients work correctly.
function normaliseActivity(activity = {}) {
  const { type, activityType, duration, intensity } = activity;
  return { activityType: activityType || type, duration, intensity };
}
function normaliseMeals(meals = []) {
  return meals.map(m => {
    const { type, mealType, time, quality } = m;
    return { mealType: mealType || type, time, quality };
  });
}

export const logBioData = async (req, res) => {
  try {
    const { sleep, mood, stressLevel } = req.body;
    const activity = normaliseActivity(req.body.activity);
    const meals    = normaliseMeals(req.body.meals);

    const cognitiveScore = calculateCognitiveScore({ sleep, mood, stressLevel, activity });

    let aiInsights = 'Maintain consistent sleep and hydration for peak cognitive performance.';
    try {
      const prompt = `You are a cognitive performance coach. Given this student lifestyle data, write 2-3 actionable sentences for optimizing study performance today.
Sleep: ${JSON.stringify(sleep)}
Activity: ${JSON.stringify(activity)}
Mood: ${mood}/10, Stress: ${stressLevel}/10
Calculated Cognitive Score: ${cognitiveScore}/100
Be specific and motivating.`;
      aiInsights = await generateContent(prompt);
    } catch (e) { console.error('Gemini error:', e.message); }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await BioRhythm.findOne({ user: req.user._id, date: { $gte: today } });
    let record;
    if (existing) {
      existing.sleep = sleep;
      existing.activity = activity;
      existing.meals = meals;
      existing.mood = mood;
      existing.stressLevel = stressLevel;
      existing.cognitiveScore = cognitiveScore;
      existing.aiInsights = aiInsights;
      record = await existing.save();
    } else {
      record = await BioRhythm.create({
        user: req.user._id,
        date: new Date(),
        sleep, activity, meals, mood, stressLevel, cognitiveScore, aiInsights,
      });
    }

    res.json({ success: true, data: record, message: 'Bio data logged successfully' });
  } catch (error) {
    console.error('logBioData error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBioHistory = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const data = await BioRhythm.find({ user: req.user._id, createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(60);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCognitiveForecast = async (req, res) => {
  try {
    const recent = await BioRhythm.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(7);

    if (!recent.length) {
      return res.json({ success: true, forecast: { score: 70, trend: 'stable', message: 'Log lifestyle data to get personalized cognitive forecasts.' } });
    }

    const scores = recent.map(r => r.cognitiveScore || 70);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const trend = scores.length > 1
      ? (scores[0] > scores[scores.length - 1] ? 'improving' : scores[0] < scores[scores.length - 1] ? 'declining' : 'stable')
      : 'stable';

    res.json({
      success: true,
      forecast: {
        score: avgScore,
        trend,
        message: recent[0].aiInsights || 'Keep logging data for better insights.',
        data: recent.map(r => ({ date: r.date, score: r.cognitiveScore })),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
