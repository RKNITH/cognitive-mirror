import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: String,
  userAnswer: { type: String, default: null },
  isCorrect: { type: Boolean, default: null },
  timeSpent: { type: Number, default: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
}, { _id: false });

const quizSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  topic: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  questions: [questionSchema],
  score: { type: Number, default: null },
  totalQuestions: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 },
  accuracy: { type: Number, default: null },
  xpEarned: { type: Number, default: 0 },
  submitted: { type: Boolean, default: false },
}, { timestamps: true });

quizSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Quiz', quizSchema);
