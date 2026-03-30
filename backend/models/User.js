import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  totalStudyTime: { type: Number, default: 0 },
  badges: [{ type: String }],
  cognitiveProfile: {
    burnoutRisk: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    avgCognitiveScore: { type: Number, default: 0 },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  return obj;
};

export default mongoose.model('User', userSchema);
