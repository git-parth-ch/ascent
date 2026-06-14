export default function Button({ children, variant = 'primary', onClick, className = '', as: Tag = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 cursor-pointer';

  const variants = {
    primary:   'bg-ascent-orange text-white rounded-full px-7 py-3 text-sm shadow-cta hover:bg-[#C94115] hover:-translate-y-px',
    secondary: 'bg-transparent border border-ascent-dark text-ascent-dark rounded-full px-7 py-3 text-sm hover:bg-ascent-dark hover:text-white',
    ghost:     'bg-none text-ascent-orange font-semibold text-sm hover:opacity-80',
  };

  return (
    <Tag onClick={onClick} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
