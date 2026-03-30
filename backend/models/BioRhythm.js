import mongoose from 'mongoose';

const bioRhythmSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  sleep: {
    duration: Number,
    quality: { type: Number, min: 1, max: 10 },
    bedTime: String,
    wakeTime: String,
  },
  activity: {
    activityType: { type: String },
    duration: { type: Number },
    intensity: { type: String, enum: ['low', 'medium', 'high'] },
  },
  meals: [{
    time: { type: String },
    mealType: { type: String },
    quality: { type: Number, min: 1, max: 10 },
  }],
  mood: { type: Number, min: 1, max: 10 },
  stressLevel: { type: Number, min: 1, max: 10 },
  cognitiveScore: { type: Number, min: 0, max: 100 },
  aiInsights: { type: String },
}, { timestamps: true });

bioRhythmSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('BioRhythm', bioRhythmSchema);
