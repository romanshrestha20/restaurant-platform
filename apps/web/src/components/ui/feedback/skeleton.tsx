import type { CSSProperties, HTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  height?: CSSProperties['height'];
  width?: CSSProperties['width'];
  circle?: boolean;
};

export function Skeleton({ className, height, width, circle, style, ...props }: SkeletonProps) {
  return <div aria-hidden="true" className={classNames('skeleton', circle && 'skeleton--circle', className)} style={{ width, height, ...style }} {...props} />;
}
