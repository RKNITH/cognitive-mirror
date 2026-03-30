import Mistake from '../models/Mistake.js';
import User from '../models/User.js';
import { generateContent } from '../config/gemini.js';

export const logMistake = async (req, res) => {
  try {
    const { subject, topic, question, userAnswer, correctAnswer, category } = req.body;
    if (!subject?.trim()) return res.status(400).json({ success: false, message: 'subject is required' });
    if (!question?.trim()) return res.status(400).json({ success: false, message: 'question is required' });
    if (!category) return res.status(400).json({ success: false, message: 'category is required' });

    const validCategories = ['knowledge_gap', 'processing_error', 'cognitive_slip'];
    if (!validCategories.includes(category))
      return res.status(400).json({ success: false, message: 'category must be knowledge_gap, processing_error, or cognitive_slip' });

    let aiAnalysis = 'Review the topic fundamentals and practice similar problems.';
    let improvementStrategy = 'Practice spaced repetition for this concept.';
    let severity = 'medium';

    try {
      const prompt = `Analyze this student mistake and provide targeted improvement advice.
Category: ${category.replace(/_/g, ' ')}
Subject: ${subject}, Topic: ${topic || 'General'}
Question: "${question}"
Student Answer: "${userAnswer || 'No answer'}"
Correct Answer: "${correctAnswer || 'Not provided'}"

Respond ONLY with JSON, no markdown:
{"analysis": "brief 1-sentence analysis", "strategy": "specific 2-sentence improvement strategy", "severity": "low|medium|high"}`;

      const raw = await generateContent(prompt);
      const parsed = JSON.parse(raw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim());
      aiAnalysis = parsed.analysis || aiAnalysis;
      improvementStrategy = parsed.strategy || improvementStrategy;
      severity = parsed.severity || 'medium';
    } catch (e) { console.error('Gemini error:', e.message); }

    const existing = await Mistake.findOne({ user: req.user._id, question: question.trim(), resolved: false });
    if (existing) {
      existing.recurrence += 1;
      existing.aiAnalysis = aiAnalysis;
      existing.improvementStrategy = improvementStrategy;
      await existing.save();
      return res.json({ success: true, data: existing, isRecurring: true, message: 'Recurring mistake noted' });
    }

    const mistake = await Mistake.create({
      user: req.user._id,
      subject: subject.trim(),
      topic: topic?.trim() || '',
      question: question.trim(),
      userAnswer: userAnswer?.trim() || '',
      correctAnswer: correctAnswer?.trim() || '',
      category,
      severity,
      aiAnalysis,
      improvementStrategy,
    });

    res.status(201).json({ success: true, data: mistake });
  } catch (error) {
    console.error('logMistake error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMistakeProfile = async (req, res) => {
  try {
    const mistakes = await Mistake.find({ user: req.user._id }).sort({ createdAt: -1 });

    const profile = {
      total: mistakes.length,
      unresolved: mistakes.filter(m => !m.resolved).length,
      byCategory: {
        knowledge_gap: mistakes.filter(m => m.category === 'knowledge_gap').length,
        processing_error: mistakes.filter(m => m.category === 'processing_error').length,
        cognitive_slip: mistakes.filter(m => m.category === 'cognitive_slip').length,
      },
      bySeverity: {
        high: mistakes.filter(m => m.severity === 'high').length,
        medium: mistakes.filter(m => m.severity === 'medium').length,
        low: mistakes.filter(m => m.severity === 'low').length,
      },
      bySubject: {},
      recurring: mistakes.filter(m => m.recurrence > 1).length,
      recentMistakes: mistakes.slice(0, 15),
    };

    mistakes.forEach(m => {
      profile.bySubject[m.subject] = (profile.bySubject[m.subject] || 0) + 1;
    });

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMistakes = async (req, res) => {
  try {
    const { resolved, category, subject, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (category) filter.category = category;
    if (subject) filter.subject = subject;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [mistakes, total] = await Promise.all([
      Mistake.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Mistake.countDocuments(filter),
    ]);

    res.json({ success: true, data: mistakes, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveMistake = async (req, res) => {
  try {
    const mistake = await Mistake.findOne({ _id: req.params.id, user: req.user._id });
    if (!mistake) return res.status(404).json({ success: false, message: 'Mistake not found' });
    if (mistake.resolved) return res.status(400).json({ success: false, message: 'Mistake already resolved' });

    mistake.resolved = true;
    mistake.resolvedAt = new Date();
    await mistake.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: 5 } });

    res.json({ success: true, data: mistake, message: 'Mistake resolved! +5 XP' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
