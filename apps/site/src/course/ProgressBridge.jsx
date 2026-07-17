import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { observeNearViewport, shouldMountLaserFlow } from './course-state.mjs';

const LaserFlow = lazy(() => import('../components/react-bits/LaserFlow/LaserFlow.jsx'));

export default function ProgressBridge({ currentStep, nextStep, effectsAllowed }) {
  const bridgeRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const canUseLaser = Boolean(effectsAllowed && nextStep);
  const mountLaser = shouldMountLaserFlow({
    effectsAllowed,
    hasNextStep: Boolean(nextStep),
    isNearViewport,
  });

  useEffect(() => {
    if (!canUseLaser) {
      setIsNearViewport(false);
      return undefined;
    }
    return observeNearViewport(bridgeRef.current, setIsNearViewport);
  }, [canUseLaser, nextStep?.id]);

  return (
    <div
      ref={bridgeRef}
      className="course-progress-bridge"
      data-static={!mountLaser ? '' : undefined}
    >
      <div className="course-progress-bridge__route">
        <div className="course-progress-bridge__stop">
          <span>Сейчас</span>
          <strong>{currentStep.title}</strong>
        </div>

        <span className="course-progress-bridge__arrow" aria-hidden="true">→</span>

        <div className="course-progress-bridge__stop">
          <span>{nextStep ? 'Следующий шаг' : 'Статус'}</span>
          <strong>{nextStep ? nextStep.title : 'Маршрут завершён'}</strong>
        </div>
      </div>

      {mountLaser && (
        <div className="course-progress-bridge__laser" aria-hidden="true">
          <Suspense fallback={null}>
            <LaserFlow
              key={`${currentStep.id}:${nextStep.id}`}
              color="#75efff"
              horizontalBeamOffset={0}
              verticalBeamOffset={-0.06}
              horizontalSizing={0.72}
              verticalSizing={1.25}
              flowSpeed={0.28}
              fogIntensity={0.25}
              wispIntensity={2.8}
              mouseTiltStrength={0.004}
              dpr={1}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
