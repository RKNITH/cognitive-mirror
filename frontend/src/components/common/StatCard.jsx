import { motion } from 'framer-motion';

const GRAD = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  amber: 'from-amber-400 to-amber-500',
  rose: 'from-rose-500 to-rose-600',
  teal: 'from-teal-500 to-teal-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-500 to-orange-600',
};

export default function StatCard({ title, value, subtitle, icon, color = 'blue', delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }} className="card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRAD[color] || GRAD.blue} flex items-center justify-center text-white text-xl shrink-0`}>
          {icon}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="font-semibold text-slate-700 text-sm mt-0.5">{title}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
    </motion.div>
  );
}
