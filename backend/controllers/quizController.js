import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import { generateContent } from '../config/gemini.js';

export const generateQuiz = async (req, res) => {
  try {
    const { subject, topic, difficulty, numQuestions } = req.body;
    if (!subject?.trim()) return res.status(400).json({ success: false, message: 'subject is required' });

    const count = Math.min(parseInt(numQuestions) || 5, 15);
    const diff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';

    const prompt = `Generate exactly ${count} multiple choice questions for a student.
Subject: ${subject} | Topic: ${topic || subject} | Difficulty: ${diff}

Rules:
- Each question must have exactly 4 options labeled A, B, C, D
- correctAnswer must be exactly "A", "B", "C", or "D"
- Questions must be clear and educational
- Vary question types (conceptual, application, analysis)

Respond ONLY with a valid JSON array, no markdown, no extra text:
[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":"A","difficulty":"${diff}"}]`;

    let questions = [];
    try {
      const raw = await generateContent(prompt);
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      questions = JSON.parse(cleaned);
      if (!Array.isArray(questions)) throw new Error('Not an array');
    } catch (e) {
      console.error('Gemini quiz parse error:', e.message);
      return res.status(502).json({ success: false, message: 'AI failed to generate quiz. Please try again.' });
    }

    const quiz = await Quiz.create({
      user: req.user._id,
      subject: subject.trim(),
      topic: topic?.trim() || subject.trim(),
      difficulty: diff,
      questions,
      totalQuestions: questions.length,
    });

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    console.error('generateQuiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    if (!answers || !Array.isArray(answers))
      return res.status(400).json({ success: false, message: 'answers array is required' });

    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (quiz.submitted) return res.status(400).json({ success: false, message: 'Quiz already submitted' });

    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] !== undefined) {
        q.userAnswer = answers[i];
        q.isCorrect = answers[i] === q.correctAnswer;
        if (q.isCorrect) correct++;
        q.timeSpent = req.body.timePerQuestion?.[i] || 0;
      }
    });

    const accuracy = Math.round((correct / quiz.totalQuestions) * 100);
    const xpEarned = Math.round(accuracy / 2);

    quiz.score = correct;
    quiz.accuracy = accuracy;
    quiz.timeTaken = parseInt(timeTaken) || 0;
    quiz.xpEarned = xpEarned;
    quiz.submitted = true;
    await quiz.save();

    await User.findByIdAndUpdate(quiz.user, { $inc: { xp: xpEarned } });

    res.json({ success: true, data: quiz, xpEarned, message: `Quiz submitted! Earned ${xpEarned} XP.` });
  } catch (error) {
    console.error('submitQuiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuizHistory = async (req, res) => {
  try {
    const data = await Quiz.find({ user: req.user._id, submitted: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-questions');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    res.json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
