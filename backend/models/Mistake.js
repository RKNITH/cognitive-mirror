import mongoose from 'mongoose';

const mistakeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  topic: { type: String, default: '' },
  question: { type: String, required: true },
  userAnswer: { type: String, default: '' },
  correctAnswer: { type: String, default: '' },
  category: { type: String, enum: ['knowledge_gap', 'processing_error', 'cognitive_slip'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  recurrence: { type: Number, default: 1 },
  aiAnalysis: { type: String, default: '' },
  improvementStrategy: { type: String, default: '' },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
}, { timestamps: true });

mistakeSchema.index({ user: 1, resolved: 1, createdAt: -1 });

export default mongoose.model('Mistake', mistakeSchema);
