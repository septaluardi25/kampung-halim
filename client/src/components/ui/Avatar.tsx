import { useState } from 'react';
import { getDeterministicAvatarColor, getInitials } from '../../lib/avatar';

interface AvatarProps {
  src?: string | null;
  name: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-28 w-28 text-2xl',
};

export function Avatar({
  src,
  name,
  initials,
  size = 'md',
  className = '',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const displayInitials = initials?.trim() || getInitials(name);
  const colorClass = getDeterministicAvatarColor(name);
  const sizeClass = SIZE_CLASSES[size];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={`Foto ${name}`}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover border-2 border-[#8ECDF2] shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`Avatar inisial ${name}`}
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-bold tracking-wide shrink-0 select-none ${className}`}
    >
      {displayInitials}
    </div>
  );
}

