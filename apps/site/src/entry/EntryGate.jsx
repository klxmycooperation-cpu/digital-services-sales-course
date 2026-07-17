import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const GhostCursor = lazy(() => import('../components/react-bits/GhostCursor/GhostCursor.jsx'));

const ENTRY_TRANSITION_MS = 260;

export default function EntryGate({ effectsEnabled = true, onEnter }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const enterCourse = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    timerRef.current = window.setTimeout(() => onEnter?.(), ENTRY_TRANSITION_MS);
  };

  return (
    <main className="entry-gate" data-leaving={isLeaving || undefined}>
      {effectsEnabled && (
        <Suspense fallback={null}>
          <GhostCursor
            color="#75efff"
            trailLength={42}
            inertia={0.48}
            grainIntensity={0.035}
            bloomStrength={0.16}
            bloomRadius={0.85}
            bloomThreshold={0.02}
            brightness={1.08}
            edgeIntensity={0.08}
            zIndex={2}
          />
        </Suspense>
      )}

      <button
        className="entry-gate__trigger"
        type="button"
        onClick={enterCourse}
        disabled={isLeaving}
      >
        <span className="entry-gate__title">sale that shit</span>
        <span className="entry-gate__hint" aria-hidden="true">click</span>
      </button>
    </main>
  );
}
