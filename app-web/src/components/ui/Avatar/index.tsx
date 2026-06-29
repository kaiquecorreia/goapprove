import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

interface AvatarProps {
  name: string;
  colorIndex?: number;
  size?: 'sm' | 'md';
  className?: string;
}

const PALETTE = ['primary', 'info', 'success', 'warning', 'secondary'] as const;

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % PALETTE.length;
  }
  return hash;
}

export function Avatar({ name, colorIndex, size = 'md', className }: AvatarProps) {
  const tone = PALETTE[(colorIndex ?? getColorIndex(name)) % PALETTE.length];

  return (
    <span className={cx(styles.avatar, styles[size], styles[tone], className)} title={name}>
      {getInitials(name)}
    </span>
  );
}
