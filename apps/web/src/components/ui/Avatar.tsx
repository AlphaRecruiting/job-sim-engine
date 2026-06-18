type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-[13px]',
  md: 'w-10 h-10 text-[15px]',
  lg: 'w-12 h-12 text-[17px]',
  xl: 'w-16 h-16 text-[22px]',
};

const PALETTES = [
  'bg-blue-100 text-blue-700',
  'bg-success-subtle text-success-dark',
  'bg-warning-subtle text-warning-dark',
  'bg-danger-subtle text-danger-dark',
  'bg-ink-100 text-ink-700',
];

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function palette(name: string) {
  return PALETTES[name.charCodeAt(0) % PALETTES.length];
}

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  square?: boolean;
  src?: string;
}

export function Avatar({ name, size = 'md', square, src }: AvatarProps) {
  const shape = square ? 'rounded-lg' : 'rounded-full';
  if (src) {
    return <img src={src} alt={name} className={`${sizeClasses[size]} ${shape} object-cover flex-none`} />;
  }
  return (
    <div className={`${sizeClasses[size]} ${shape} ${palette(name)} flex items-center justify-center font-bold font-display flex-none`}>
      {initials(name)}
    </div>
  );
}
