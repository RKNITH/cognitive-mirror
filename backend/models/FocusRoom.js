import mongoose from 'mongoose';

const focusRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  topic: { type: String, default: 'General Study' },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maxParticipants: { type: Number, default: 10, min: 2, max: 50 },
  isPublic: { type: Boolean, default: true },
  sessionDuration: { type: Number, default: 60 },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    xpEarned: { type: Number, default: 0 },
    _id: false,
  }],
  isActive: { type: Boolean, default: true },
  endedAt: { type: Date },
}, { timestamps: true });

focusRoomSchema.index({ isActive: 1, isPublic: 1 });

export default mongoose.model('FocusRoom', focusRoomSchema);
