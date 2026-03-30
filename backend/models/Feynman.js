import mongoose from 'mongoose';

const feynmanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  subject: { type: String, default: 'General' },
  transcription: { type: String, required: true },
  gapAnalysis: {
    gaps: [{ concept: String, severity: { type: String, enum: ['high', 'medium', 'low'] }, explanation: String }],
    score: { type: Number, min: 0, max: 100, default: 0 },
    overallAssessment: String,
    strengths: [String],
    recommendations: [String],
  },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
}, { timestamps: true });

feynmanSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Feynman', feynmanSchema);
