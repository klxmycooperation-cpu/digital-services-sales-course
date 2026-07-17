import { useState } from 'react';

import { getDeploymentBase, getHomeHref, resolveAppRoute } from './app-route.mjs';
import { detectCapabilities, shouldReduceEffects, shouldUseAnimatedWebGl } from './capabilities.mjs';
import CourseApp from './course/CourseApp.jsx';
import EntryGate from './entry/EntryGate.jsx';
import GalaxyBackdrop from './galaxy/GalaxyBackdrop.jsx';
import NotFoundPage from './not-found/NotFoundPage.jsx';

const DEPLOYMENT_BASE = getDeploymentBase(import.meta.url);
const HOME_HREF = getHomeHref(DEPLOYMENT_BASE);

export default function App() {
  const [capabilities] = useState(() => detectCapabilities());
  const [entered, setEntered] = useState(false);
  const route = resolveAppRoute(window.location.pathname, DEPLOYMENT_BASE);

  if (route === 'not-found') return <NotFoundPage capabilities={capabilities} homeHref={HOME_HREF} />;

  const reduceEffects = shouldReduceEffects(capabilities);

  return (
    <div className="galaxy-app">
      <GalaxyBackdrop
        disableAnimation={reduceEffects}
        webgl={shouldUseAnimatedWebGl({ webgl: capabilities.webgl, reduceEffects })}
      />
      {entered ? (
        <CourseApp effectsEnabled={!reduceEffects} />
      ) : (
        <EntryGate effectsEnabled={!reduceEffects} onEnter={() => setEntered(true)} />
      )}
    </div>
  );
}
