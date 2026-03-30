import express from 'express';
import { createRoom, getPublicRooms, getRoomById, joinRoom, leaveRoom } from '../controllers/studyCommonsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.post('/rooms', createRoom);
router.get('/rooms', getPublicRooms);
router.get('/rooms/:id', getRoomById);
router.post('/rooms/:id/join', joinRoom);
router.post('/rooms/:id/leave', leaveRoom);
export default router;
