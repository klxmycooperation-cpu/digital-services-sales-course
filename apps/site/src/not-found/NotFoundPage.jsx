import { lazy, Suspense } from 'react';

import { shouldReduceEffects, shouldUseAnimatedWebGl } from '../capabilities.mjs';
import GalaxyBackdrop, { GALAXY_PALETTE } from '../galaxy/GalaxyBackdrop.jsx';

const FuzzyText = lazy(() => import('../components/react-bits/FuzzyText/FuzzyText.jsx'));
const BorderGlow = lazy(() => import('../components/react-bits/BorderGlow/BorderGlow.jsx'));

export default function NotFoundPage({ capabilities = {}, homeHref = '/' }) {
  const reduceEffects = shouldReduceEffects(capabilities);

  return (
    <div className="not-found-page">
      <GalaxyBackdrop
        disableAnimation={reduceEffects}
        webgl={shouldUseAnimatedWebGl({ webgl: capabilities.webgl !== false, reduceEffects })}
      />
      <main className="not-found-page__content">
        <h1 className="visually-hidden">404</h1>
        <div className="not-found-page__visual" aria-hidden="true">
          {reduceEffects ? (
            <span className="not-found-page__fallback-code">404</span>
          ) : (
            <Suspense fallback={<span className="not-found-page__fallback-code">404</span>}>
              <FuzzyText
                className="not-found-page__code"
                fontSize="clamp(7rem, 26vw, 22rem)"
                fontWeight={760}
                color={GALAXY_PALETTE.ink}
                enableHover
                baseIntensity={0.12}
                hoverIntensity={0.28}
                fuzzRange={18}
                fps={48}
              >404</FuzzyText>
            </Suspense>
          )}
        </div>
        <p>Этой точки нет на карте курса.</p>
        <Suspense fallback={<a className="not-found-page__plain-link" href={homeHref}>Вернуться в начало</a>}>
          <BorderGlow
            className="not-found-page__action"
            glowColor="190 100 73"
            backgroundColor="#0b1020"
            borderRadius={999}
            glowRadius={24}
            glowIntensity={0.72}
            colors={[GALAXY_PALETTE.cyan, GALAXY_PALETTE.blue, GALAXY_PALETTE.violet]}
            fillOpacity={0.22}
          >
            <a href={homeHref}>Вернуться в начало</a>
          </BorderGlow>
        </Suspense>
      </main>
    </div>
  );
}
