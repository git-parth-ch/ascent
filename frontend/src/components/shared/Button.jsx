export default function Button({ children, variant = 'primary', onClick, className = '', as: Tag = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 cursor-pointer';

  if (variant === 'primary') {
    return (
      <Tag
        onClick={onClick}
        className={`${base} text-white rounded-full px-7 py-3 text-sm hover:-translate-y-px ${className}`}
        style={{ backgroundColor: '#E8521A', boxShadow: '0 4px 20px rgba(232,82,26,0.32)' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C94115'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E8521A'}
        {...props}
      >
        {children}
      </Tag>
    );
  }

  const variants = {
    secondary: 'bg-transparent border border-ascent-dark text-ascent-dark rounded-full px-7 py-3 text-sm hover:bg-ascent-dark hover:text-white',
    ghost:     'bg-none text-ascent-orange font-semibold text-sm hover:opacity-80',
  };

  return (
    <Tag onClick={onClick} className={`${base} ${variants[variant] || ''} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
