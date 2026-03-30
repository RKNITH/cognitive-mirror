import mongoose from 'mongoose';

const burnoutLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  focusScore: { type: Number, min: 0, max: 100, default: 50 },
  studyDuration: { type: Number, default: 0 },
  breaksTaken: { type: Number, default: 0 },
  productivityRating: { type: Number, min: 1, max: 10, default: 5 },
  emotionalState: { type: String, default: 'neutral' },
  burnoutScore: { type: Number, min: 0, max: 100, default: 0 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  aiInsights: { type: String, default: '' },
  recoveryProtocol: { type: String, default: '' },
  alerts: [{ message: String, type: String, triggeredAt: Date, _id: false }],
}, { timestamps: true });

burnoutLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('BurnoutLog', burnoutLogSchema);
