import Feynman from '../models/Feynman.js';
import User from '../models/User.js';
import { generateContent } from '../config/gemini.js';

export const analyzeExplanation = async (req, res) => {
  try {
    const { topic, subject, transcription } = req.body;
    if (!topic?.trim()) return res.status(400).json({ success: false, message: 'topic is required' });
    if (!transcription?.trim()) return res.status(400).json({ success: false, message: 'transcription is required' });

    const entry = await Feynman.create({
      user: req.user._id,
      topic: topic.trim(),
      subject: subject?.trim() || 'General',
      transcription: transcription.trim(),
      status: 'processing',
    });

    let gapAnalysis = {
      gaps: [{ concept: 'Core fundamentals', severity: 'medium', explanation: 'Review the basic principles of this topic.' }],
      score: 65,
      overallAssessment: 'The explanation shows foundational understanding with room to deepen knowledge.',
      strengths: ['Basic understanding present'],
      recommendations: ['Review core concepts', 'Practice teaching to others'],
    };

    try {
      const prompt = `You are an expert educational evaluator using the Feynman Technique. Analyze this student's explanation strictly and identify conceptual gaps.

TOPIC: "${topic}"
SUBJECT: "${subject || 'General'}"
STUDENT EXPLANATION:
"${transcription}"

Instructions:
- Score 0-100 based on accuracy, clarity, depth, and completeness
- Identify specific conceptual gaps with severity (high/medium/low)
- Note genuine strengths
- Give actionable recommendations

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "gaps": [{"concept": "...", "severity": "high|medium|low", "explanation": "..."}],
  "score": 0-100,
  "overallAssessment": "2-3 sentence assessment",
  "strengths": ["strength1", "strength2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}`;

      const raw = await generateContent(prompt);
      const cleaned = raw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      gapAnalysis = JSON.parse(cleaned);
    } catch (e) { console.error('Gemini/parse error:', e.message); }

    entry.gapAnalysis = gapAnalysis;
    entry.status = 'completed';
    await entry.save();

    const xpGained = Math.round((gapAnalysis.score || 0) / 5);
    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: xpGained } });

    res.json({ success: true, data: entry, xpGained });
  } catch (error) {
    console.error('analyzeExplanation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeynmanHistory = async (req, res) => {
  try {
    const data = await Feynman.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-transcription');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeynmanById = async (req, res) => {
  try {
    const entry = await Feynman.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
