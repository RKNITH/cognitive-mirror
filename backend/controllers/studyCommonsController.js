import FocusRoom from '../models/FocusRoom.js';
import User from '../models/User.js';

export const createRoom = async (req, res) => {
  try {
    const { name, description, topic, maxParticipants, isPublic, sessionDuration } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Room name is required' });

    const room = await FocusRoom.create({
      name: name.trim(),
      description: description?.trim() || '',
      topic: topic?.trim() || 'General Study',
      host: req.user._id,
      maxParticipants: parseInt(maxParticipants) || 10,
      isPublic: isPublic !== false,
      sessionDuration: parseInt(sessionDuration) || 60,
      participants: [{ user: req.user._id }],
    });

    await room.populate('host', 'name xp streak');
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicRooms = async (req, res) => {
  try {
    const rooms = await FocusRoom.find({ isPublic: true, isActive: true })
      .populate('host', 'name xp streak')
      .populate('participants.user', 'name xp')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const room = await FocusRoom.findById(req.params.id)
      .populate('host', 'name xp streak')
      .populate('participants.user', 'name xp streak');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const room = await FocusRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (!room.isActive) return res.status(400).json({ success: false, message: 'This room has ended' });
    if (room.participants.length >= room.maxParticipants)
      return res.status(400).json({ success: false, message: 'Room is full' });

    const already = room.participants.find(p => p.user.toString() === req.user._id.toString());
    if (!already) {
      room.participants.push({ user: req.user._id });
      await room.save();
    }
    await room.populate('host', 'name xp');
    await room.populate('participants.user', 'name xp');
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const leaveRoom = async (req, res) => {
  try {
    const room = await FocusRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const pIndex = room.participants.findIndex(p => p.user.toString() === req.user._id.toString());
    if (pIndex !== -1) {
      const joined = room.participants[pIndex].joinedAt;
      const sessionMins = Math.floor((Date.now() - new Date(joined).getTime()) / 60000);
      const xpEarned = Math.min(sessionMins * 2, 120);
      room.participants[pIndex].xpEarned = xpEarned;
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { xp: xpEarned, totalStudyTime: sessionMins },
      });
      room.participants.splice(pIndex, 1);
    }

    if (room.host.toString() === req.user._id.toString()) {
      room.isActive = false;
      room.endedAt = new Date();
    }

    await room.save();
    res.json({ success: true, message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
