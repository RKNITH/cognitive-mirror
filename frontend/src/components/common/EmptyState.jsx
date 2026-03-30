export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="font-display font-semibold text-slate-700 mb-1">{title}</h3>
      {message && <p className="text-muted max-w-xs mb-4">{message}</p>}
      {action}
    </div>
  );
}
