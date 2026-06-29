import Image from 'next/image';

/** Source asset is 554×354; layout size keeps ~2× headroom for sharp display on retina. */
const SOURCE_W = 554;
const SOURCE_H = 354;
const DEFAULT_WIDTH = 320;

interface LogoProps {
  /** Pass when the logo sits in a height-constrained area (e.g. a topbar); width is derived from the aspect ratio. */
  height?: number;
  /** Pass when the logo sits in a width-constrained area; defaults to 320. Ignored if `height` is set. */
  width?: number;
  className?: string;
}

export default function Logo({ height, width, className }: LogoProps) {
  if (height) {
    const derivedWidth = Math.round((height * SOURCE_W) / SOURCE_H);
    return (
      <Image
        src="/images/goapprove-logo-icon.png"
        alt="GoApprove logo"
        width={derivedWidth}
        height={height}
        priority
        className={className}
        style={{ height, width: 'auto' }}
      />
    );
  }

  const resolvedWidth = width ?? DEFAULT_WIDTH;
  const resolvedHeight = Math.round((resolvedWidth * SOURCE_H) / SOURCE_W);

  return (
    <Image
      src="/images/goapprove-logo-icon.png"
      alt="GoApprove logo"
      width={resolvedWidth}
      height={resolvedHeight}
      priority
      className={className}
      sizes={`(max-width: 600px) min(85vw, ${resolvedWidth}px), ${resolvedWidth}px`}
      style={{ width: '100%', maxWidth: resolvedWidth, height: 'auto' }}
    />
  );
}
