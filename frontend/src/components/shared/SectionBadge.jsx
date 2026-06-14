export default function SectionBadge({ children }) {
  return (
    <span
      className="inline-block px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-full border"
      style={{ background: '#E8521A1A', borderColor: '#E8521A44', color: '#E8521A' }}
    >
      {children}
    </span>
  );
}
