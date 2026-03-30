import { generateContent } from '../config/gemini.js';

export const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'message is required' });

    const systemContext = `You are CognitiveMirror AI, an expert meta-learning coach. You help students optimize performance through:
- Personalized study strategies based on cognitive science
- Burnout prevention and recovery techniques
- Feynman Technique guidance for deep learning
- Memory techniques and spaced repetition
- Time management and focus optimization
Be warm, specific, and evidence-based. Keep responses concise (under 200 words).`;

    const historyText = Array.isArray(history) && history.length > 0
      ? history.slice(-6).map(h => `${h.role === 'user' ? 'Student' : 'Coach'}: ${h.content}`).join('\n')
      : '';

    const prompt = `${systemContext}\n\n${historyText ? 'Recent conversation:\n' + historyText + '\n\n' : ''}Student: ${message.trim()}\nCoach:`;

    const response = await generateContent(prompt);
    res.json({ success: true, response: response.trim() });
  } catch (error) {
    console.error('chatWithAI error:', error);
    res.status(500).json({ success: false, message: 'AI service error: ' + error.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const { cognitiveScore, burnoutScore, mistakeCategories, streak } = req.body;

    const prompt = `Based on this student's data, generate 3 specific, actionable study recommendations.
Cognitive Score: ${cognitiveScore || 'unknown'}/100
Burnout Score: ${burnoutScore || 0}/100
Mistake Patterns: ${JSON.stringify(mistakeCategories) || 'none'}
Current Streak: ${streak || 0} days

Respond ONLY with JSON array, no markdown:
[{"title":"...","description":"2 sentences max","priority":"high|medium|low","icon":"emoji"}]`;

    const raw = await generateContent(prompt);
    const recommendations = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    res.json({ success: true, recommendations });
  } catch (error) {
    console.error('getRecommendations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
