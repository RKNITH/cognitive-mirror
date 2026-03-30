import User from '../models/User.js';

export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const updates = {};
    if (name?.trim()) updates.name = name.trim();
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ isVerified: true })
      .sort({ xp: -1 })
      .limit(20)
      .select('name xp streak badges createdAt');
    res.json({ success: true, leaderboard: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('xp streak badges totalStudyTime cognitiveProfile');
    res.json({ success: true, stats: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
