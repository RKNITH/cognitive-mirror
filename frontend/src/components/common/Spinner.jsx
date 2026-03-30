export default function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' }[size];
  return (
    <div className={`${s} rounded-full border-slate-200 border-t-blue-600 animate-spin`} />
  );
}
