export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const fmtRelative = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
};

export const scoreColor = (s) => {
  if (s >= 80) return '#22c55e';
  if (s >= 60) return '#3b82f6';
  if (s >= 40) return '#f59e0b';
  return '#f43f5e';
};

export const riskBadge = (r) => {
  const m = { low: 'badge-green', medium: 'badge-amber', high: 'badge-rose', critical: 'badge-rose' };
  return m[r] || 'badge-slate';
};

export const categoryLabel = (c) => {
  const m = { knowledge_gap: 'Knowledge Gap', processing_error: 'Processing Error', cognitive_slip: 'Cognitive Slip' };
  return m[c] || c;
};

export const categoryBadge = (c) => {
  const m = { knowledge_gap: 'badge-rose', processing_error: 'badge-amber', cognitive_slip: 'badge-blue' };
  return m[c] || 'badge-slate';
};
