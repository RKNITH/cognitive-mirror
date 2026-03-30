import { motion } from 'framer-motion';

export default function PageHeader({ icon, title, subtitle, action }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start justify-between mb-6 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl border border-blue-100 shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="page-header truncate">{title}</h1>
          {subtitle && <p className="text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}
