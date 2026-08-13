import { Avatar } from '@/components/ui';

export function RestaurantAvatar({
  className,
  logoUrl,
  name,
  size = 'md',
}: {
  className?: string;
  logoUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  return (
    <Avatar
      alt={logoUrl ? `${name} logo` : `${name} initial`}
      className={className}
      fallback={name.charAt(0) || 'R'}
      size={size}
      src={logoUrl}
    />
  );
}
