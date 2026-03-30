import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import api from '../utils/api.js';
import PageHeader from '../components/common/PageHeader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';

const STUDY_TOPICS = ['General Study','Mathematics','Physics','Chemistry','Biology','History','Literature','Computer Science','Economics','Other'];

export default function StudyCommonsPage() {
  const { user } = useSelector(s => s.auth);
  const [rooms, setRooms]               = useState([]);
  const [showCreate, setShowCreate]     = useState(false);
  const [activeRoom, setActiveRoom]     = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages]         = useState([]);
  const [msg, setMsg]                   = useState('');
  const [creating, setCreating]         = useState(false);
  const [loading, setLoading]           = useState(true);
  const [sessionTime, setSessionTime]   = useState(0);
  const [createForm, setCreateForm]     = useState({
    name: '', topic: 'General Study', maxParticipants: 10, sessionDuration: 60,
  });
  const socketRef  = useRef(null);
  const chatRef    = useRef(null);
  const timerRef   = useRef(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  const loadRooms = () => {
    setLoading(true);
    api.get('/study-commons/rooms')
      .then(r => setRooms(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRooms();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const joinRoom = async (room) => {
    try {
      await api.post('/study-commons/rooms/' + room._id + '/join');
      setActiveRoom(room);
      setMessages([{ system: true, text: `You joined "${room.name}". Focus up! 🎯` }]);
      setParticipants([]);
      setSessionTime(0);

      const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.emit('join-room', { roomId: room._id, userId: user?._id, username: user?.name });
      socket.on('room-update', ({ participants: p }) => setParticipants(p || []));
      socket.on('new-message', m => setMessages(prev => [...prev, m]));

      // Session timer
      timerRef.current = setInterval(() => setSessionTime(s => s + 1), 1000);

      toast.success('Joined ' + room.name + '!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join room');
    }
  };

  const leaveRoom = async () => {
    if (!activeRoom) return;
    try {
      await api.post('/study-commons/rooms/' + activeRoom._id + '/leave');
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      if (timerRef.current)  { clearInterval(timerRef.current); timerRef.current = null; }
      const xp = Math.min(Math.floor(sessionTime / 60) * 2, 120);
      toast.success(`Left room — earned ${xp} XP! ⚡`);
      setActiveRoom(null);
      setParticipants([]);
      setMessages([]);
      setSessionTime(0);
      loadRooms();
    } catch { toast.error('Failed to leave room'); }
  };

  const sendMsg = (e) => {
    e.preventDefault();
    if (!msg.trim() || !socketRef.current) return;
    socketRef.current.emit('send-message', {
      roomId: activeRoom._id, message: msg.trim(), username: user?.name,
    });
    setMsg('');
  };

  const createRoom = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return toast.error('Room name required');
    setCreating(true);
    try {
      const { data } = await api.post('/study-commons/rooms', createForm);
      toast.success('Room created!');
      setShowCreate(false);
      setCreateForm({ name: '', topic: 'General Study', maxParticipants: 10, sessionDuration: 60 });
      loadRooms();
      joinRoom(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally { setCreating(false); }
  };

  const fmtTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const xpEarned = Math.min(Math.floor(sessionTime / 60) * 2, 120);

  /* ── Active room view ── */
  if (activeRoom) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-800">{activeRoom.name}</h2>
            <p className="text-muted">{activeRoom.topic} · {participants.length} online</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live timer */}
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center">
              <div className="font-mono font-bold text-green-700 text-lg leading-none">{fmtTime(sessionTime)}</div>
              <div className="text-xs text-green-600">⚡ {xpEarned} XP</div>
            </div>
            <button onClick={leaveRoom} className="btn-danger">🚪 Leave</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Participants */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">👥 Participants ({participants.length})</h3>
            <div className="space-y-2">
              {participants.length === 0 && (
                <p className="text-muted text-xs">Connecting to room…</p>
              )}
              {participants.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl">
                  <div className="w-7 h-7 bg-blue-200 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                    {(p.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{p.username}</p>
                    <p className={`text-xs font-medium capitalize ${
                      p.status === 'focusing' ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      {p.status === 'focusing' ? '🟢 focusing' : p.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs font-bold text-amber-700 mb-1">⚡ XP Earned This Session</p>
              <div className="font-bold text-amber-700 text-lg">{xpEarned} XP</div>
              <p className="text-xs text-amber-600">Max 120 XP per session</p>
              <div className="h-1.5 bg-amber-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: (xpEarned / 120 * 100) + '%' }} />
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2 card flex flex-col" style={{ height: '420px' }}>
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">💬 Room Chat</h3>
            <div ref={chatRef} className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
              {messages.map((m, i) => (
                <div key={i} className={m.system ? 'text-center' : ''}>
                  {m.system ? (
                    <span className="text-xs text-slate-400 italic bg-slate-50 px-3 py-1 rounded-full">{m.text}</span>
                  ) : (
                    <div className={['flex gap-2', m.username === user?.name ? 'flex-row-reverse' : ''].join(' ')}>
                      <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 mt-0.5">
                        {(m.username || '?')[0].toUpperCase()}
                      </div>
                      <div className="max-w-xs">
                        {m.username !== user?.name && (
                          <p className="text-blue-600 font-semibold text-xs mb-0.5">{m.username}</p>
                        )}
                        <div className={['px-3 py-2 rounded-2xl text-sm',
                          m.username === user?.name
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-slate-100 text-slate-800 rounded-tl-sm'].join(' ')}>
                          {m.message}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={sendMsg} className="flex gap-2">
              <input className="input flex-1" placeholder="Type a message… (Enter to send)"
                value={msg} onChange={e => setMsg(e.target.value)} />
              <button type="submit" className="btn-primary px-4" disabled={!msg.trim()}>↑</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── Room list ── */
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader icon="👥" title="Study Commons"
        subtitle="Join real-time focus rooms with body-doubling, chat and XP rewards"
        action={
          <button onClick={() => setShowCreate(s => !s)} className="btn-primary">
            {showCreate ? '✕ Cancel' : '+ Create Room'}
          </button>
        }
      />

      {/* Create form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card border-blue-100 bg-blue-50">
          <h3 className="section-title">Create a Focus Room</h3>
          <form onSubmit={createRoom} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Room Name *</label>
              <input className="input" placeholder="e.g. Morning Deep Work"
                value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Topic</label>
              <select className="input" value={createForm.topic}
                onChange={e => setCreateForm(f => ({ ...f, topic: e.target.value }))}>
                {STUDY_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Max Participants</label>
              <input type="number" min="2" max="50" className="input"
                value={createForm.maxParticipants}
                onChange={e => setCreateForm(f => ({ ...f, maxParticipants: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Session Duration (min)</label>
              <select className="input" value={createForm.sessionDuration}
                onChange={e => setCreateForm(f => ({ ...f, sessionDuration: parseInt(e.target.value) }))}>
                {[25, 30, 45, 60, 90, 120].map(d => (
                  <option key={d} value={d}>{d} min{d === 25 ? ' (Pomodoro)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Creating…' : '🚀 Create & Join Room'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Rooms grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0,1,2].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
              <div className="h-8 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState icon="🏠" title="No active rooms"
          message="Be the first to create a focus room and start earning XP!"
          action={<button onClick={() => setShowCreate(true)} className="btn-primary">Create Room</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room, i) => {
            const isFull = room.participants?.length >= room.maxParticipants;
            return (
              <motion.div key={room._id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="card hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-slate-800 text-sm truncate">{room.name}</h3>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">{room.topic}</p>
                  </div>
                  <span className="badge-green shrink-0 ml-2">🟢 Live</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-1">
                  <span>👤 {room.participants?.length || 0}/{room.maxParticipants}</span>
                  <span>⏱ {room.sessionDuration}min</span>
                </div>
                {/* Occupancy bar */}
                <div className="h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: ((room.participants?.length || 0) / room.maxParticipants * 100) + '%',
                      background: isFull ? '#f43f5e' : '#3b82f6'
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mb-3">Host: <span className="font-semibold">{room.host?.name}</span></p>
                <button
                  onClick={() => joinRoom(room)}
                  className={isFull ? 'btn-secondary w-full text-sm py-2 opacity-60 cursor-not-allowed' : 'btn-primary w-full text-sm py-2'}
                  disabled={isFull}>
                  {isFull ? '🚫 Room Full' : '→ Join Room'}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* XP info */}
      <div className="card bg-amber-50 border-amber-100">
        <h3 className="font-semibold text-amber-800 mb-3">⚡ How XP Works in Focus Rooms</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-amber-700">
          {[
            { v: '2 XP',   l: 'per minute in room',      icon: '⏱' },
            { v: '120 XP', l: 'max per session',          icon: '🏆' },
            { v: 'Streak', l: 'builds on daily activity', icon: '🔥' },
          ].map(({ v, l, icon }) => (
            <div key={l} className="bg-white/60 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="font-bold text-lg">{v}</div>
              <div className="text-xs">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
