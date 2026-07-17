import { lazy, Suspense } from 'react';

const Galaxy = lazy(() => import('../components/react-bits/Galaxy/Galaxy.jsx'));

export const GALAXY_PALETTE = Object.freeze({
  space: '#05060d',
  ink: '#f4f7ff',
  cyan: '#75efff',
  blue: '#7ca7ff',
  violet: '#b6a4ff',
  muted: '#9aa6c5',
});

const GALAXY_FOCAL = Object.freeze([0.5, 0.48]);
const GALAXY_ROTATION = Object.freeze([1, 0]);

export const GALAXY_PROPS = Object.freeze({
  focal: GALAXY_FOCAL,
  rotation: GALAXY_ROTATION,
  starSpeed: 0.42,
  density: 1.15,
  hueShift: 240,
  speed: 0.72,
  mouseInteraction: false,
  glowIntensity: 0.48,
  saturation: 1,
  mouseRepulsion: false,
  repulsionStrength: 1.4,
  twinkleIntensity: 0.32,
  rotationSpeed: 0.035,
  autoCenterRepulsion: 0.35,
  transparent: true,
});

export default function GalaxyBackdrop({ disableAnimation = false, webgl = true }) {
  return (
    <div className="galaxy-backdrop" aria-hidden="true" data-static={!webgl || undefined}>
      <div className="galaxy-backdrop__fallback" />
      {webgl && (
        <Suspense fallback={null}>
          <Galaxy {...GALAXY_PROPS} disableAnimation={disableAnimation} />
        </Suspense>
      )}
      <div className="galaxy-backdrop__veil" />
    </div>
  );
}
