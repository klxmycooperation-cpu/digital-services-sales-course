import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { course, modules, stepById, steps } from '@sales-course/content';

import CourseSidebar from './CourseSidebar.jsx';
import DiagnosticWheel from './DiagnosticWheel.jsx';
import LearningWeb from './LearningWeb.jsx';
import LearningWorkspace from './LearningWorkspace.jsx';
import {
  completeStepInOrder,
  describeCourseDestination,
  diagnosticRecommendation,
  focusCourseDestination,
  formatCourseHash,
  getCourseDestinationFocusKey,
  parseCourseHash,
  pointerEffectsAllowed,
  readCompletedStepIds,
  recommendNextStepId,
  resolveCourseHistoryAction,
  selectModuleStepId,
  shouldActivateSplashCursor,
  writeCompletedStepIds,
} from './course-state.mjs';
import './course.css';

const STEP_IDS = new Set(steps.map(step => step.id));
const SPLASH_BACKGROUND = Object.freeze({ r: 0.02, g: 0.025, b: 0.055 });
const SplashCursor = lazy(() => import('../components/react-bits/SplashCursor/SplashCursor.jsx'));

function releaseWebGlContext(canvas) {
  if (!canvas) return false;
  for (const contextName of ['webgl2', 'webgl', 'experimental-webgl']) {
    try {
      const context = canvas.getContext(contextName);
      const extension = context?.getExtension?.('WEBGL_lose_context');
      if (extension) {
        extension.loseContext();
        return true;
      }
    } catch {
      // Context release is best-effort; the exact effect still removes listeners and RAF.
    }
  }
  return false;
}

function SplashCursorBoundary({ children }) {
  const boundaryRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const boundary = boundaryRef.current;
    if (!boundary) return undefined;

    const captureCanvas = () => {
      canvasRef.current ??= boundary.querySelector('canvas');
    };
    captureCanvas();
    const observer = new MutationObserver(captureCanvas);
    observer.observe(boundary, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      releaseWebGlContext(canvasRef.current);
    };
  }, []);

  return <div ref={boundaryRef} className="course-splash-boundary">{children}</div>;
}

function browserPreferences() {
  if (typeof window === 'undefined') return { reducedMotion: true, saveData: true };
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: Boolean(navigator.connection?.saveData),
  };
}

function initialProgress() {
  if (typeof window === 'undefined') return [];
  return readCompletedStepIds(window.localStorage, steps);
}

function initialDestination(completedStepIds) {
  const fallbackStepId = recommendNextStepId(steps, completedStepIds) ?? steps.at(-1).id;
  if (typeof window === 'undefined') return { view: 'web', activeStepId: fallbackStepId };
  const destination = parseCourseHash(window.location.hash, STEP_IDS);
  return {
    view: destination.view,
    activeStepId: destination.activeStepId ?? fallbackStepId,
  };
}

export default function CourseApp({ effectsEnabled = true }) {
  const [completedStepIds, setCompletedStepIds] = useState(initialProgress);
  const initial = useMemo(() => initialDestination(completedStepIds), []);
  const [view, setView] = useState(initial.view);
  const [activeStepId, setActiveStepId] = useState(initial.activeStepId);
  const [activeModuleId, setActiveModuleId] = useState(stepById[initial.activeStepId].moduleId);
  const [diagnosticId, setDiagnosticId] = useState(course.diagnostics[0].id);
  const [splashActive, setSplashActive] = useState(false);
  const [preferences, setPreferences] = useState(browserPreferences);
  const splashActivationTimerRef = useRef(null);
  const lastFocusKeyRef = useRef(null);

  const effectsAllowed = pointerEffectsAllowed({ effectsEnabled, ...preferences });
  const requiredStepId = recommendNextStepId(steps, completedStepIds);
  const activeStep = stepById[activeStepId];
  const activeModule = modules.find(module => module.id === activeStep.moduleId);
  const diagnostic = diagnosticRecommendation(course, stepById, diagnosticId);
  const destinationAnnouncement = describeCourseDestination({
    view,
    activeStep,
    completedCount: completedStepIds.length,
    totalCount: steps.length,
  });

  const scheduleSplash = useCallback(shouldActivate => {
    if (splashActivationTimerRef.current) clearTimeout(splashActivationTimerRef.current);
    splashActivationTimerRef.current = null;
    if (!shouldActivate) {
      setSplashActive(false);
      return;
    }
    splashActivationTimerRef.current = setTimeout(() => {
      setSplashActive(true);
      splashActivationTimerRef.current = null;
    }, 80);
  }, []);

  const setDestination = useCallback((nextView, stepId, { replace = false } = {}) => {
    const safeStepId = STEP_IDS.has(stepId) ? stepId : recommendNextStepId(steps, completedStepIds) ?? steps.at(-1).id;
    if (nextView === 'lesson') scheduleSplash(false);
    setView(nextView);
    setActiveStepId(safeStepId);
    setActiveModuleId(stepById[safeStepId].moduleId);
    if (typeof window !== 'undefined') {
      const nextHash = formatCourseHash(nextView, safeStepId);
      const action = resolveCourseHistoryAction({ currentHash: window.location.hash, nextHash, replace });
      if (action) window.history[`${action}State`](null, '', nextHash);
    }
  }, [completedStepIds, scheduleSplash]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    writeCompletedStepIds(window.localStorage, completedStepIds, steps);
    return undefined;
  }, [completedStepIds]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    const updatePreferences = () => setPreferences({
      reducedMotion: motion.matches,
      saveData: Boolean(connection?.saveData),
    });
    motion.addEventListener?.('change', updatePreferences);
    connection?.addEventListener?.('change', updatePreferences);
    return () => {
      motion.removeEventListener?.('change', updatePreferences);
      connection?.removeEventListener?.('change', updatePreferences);
    };
  }, []);

  useEffect(() => {
    if (!effectsAllowed) scheduleSplash(false);
  }, [effectsAllowed, scheduleSplash]);

  useEffect(() => {
    const focusKey = getCourseDestinationFocusKey(view, activeStepId, completedStepIds.length);
    if (lastFocusKeyRef.current === focusKey) return;
    lastFocusKeyRef.current = focusKey;
    focusCourseDestination({ view, activeStepId });
  }, [view, activeStepId, completedStepIds.length]);

  useEffect(() => () => {
    if (splashActivationTimerRef.current) clearTimeout(splashActivationTimerRef.current);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncFromHistory = () => {
      const destination = parseCourseHash(window.location.hash, STEP_IDS);
      const stepId = destination.activeStepId ?? recommendNextStepId(steps, completedStepIds) ?? steps.at(-1).id;
      if (destination.view === 'lesson') scheduleSplash(false);
      setView(destination.view);
      setActiveStepId(stepId);
      setActiveModuleId(stepById[stepId].moduleId);
    };
    window.addEventListener('popstate', syncFromHistory);
    window.addEventListener('hashchange', syncFromHistory);
    return () => {
      window.removeEventListener('popstate', syncFromHistory);
      window.removeEventListener('hashchange', syncFromHistory);
    };
  }, [completedStepIds, scheduleSplash]);

  const handlePointerOver = useCallback(event => {
    const target = event.target;
    const insideGalaxy = Boolean(target?.closest?.('[data-galaxy-zone="true"]'));
    const insideQuietZone = Boolean(target?.closest?.('[data-learning-panel], [data-course-control]'));
    scheduleSplash(shouldActivateSplashCursor({
      effectsAllowed,
      insideGalaxyZone: insideGalaxy,
      insideQuietZone,
    }));
  }, [effectsAllowed, scheduleSplash]);

  const handleSelectModule = moduleId => {
    const stepId = selectModuleStepId(moduleId, modules, steps, completedStepIds);
    if (!stepId) return;
    setDestination('web', stepId);
  };

  const handlePrimaryAction = () => {
    if (activeStepId !== requiredStepId) {
      const stepId = requiredStepId ?? steps.at(-1).id;
      setDestination('lesson', stepId);
      return;
    }
    const updated = completeStepInOrder(steps, completedStepIds, activeStepId);
    const nextStepId = recommendNextStepId(steps, updated);
    setCompletedStepIds(updated);
    if (nextStepId) setDestination('lesson', nextStepId);
  };

  const handleDiagnosticSelection = id => {
    setDiagnosticId(id);
    setView('web');
  };

  return (
    <div
      className="course-app"
      data-course-app
      data-galaxy-zone="true"
      onPointerOver={handlePointerOver}
      onPointerLeave={() => scheduleSplash(false)}
    >
      {splashActive && effectsAllowed && (
        <SplashCursorBoundary>
          <Suspense fallback={null}>
            <SplashCursor
              RAINBOW_MODE={false}
              COLOR="#75efff"
              BACK_COLOR={SPLASH_BACKGROUND}
              SPLAT_FORCE={3200}
              SPLAT_RADIUS={0.12}
              DYE_RESOLUTION={720}
            />
          </Suspense>
        </SplashCursorBoundary>
      )}

      <a className="course-skip-link" href="#course-main">К учебному материалу</a>
      <div
        className="visually-hidden course-destination-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {destinationAnnouncement}
      </div>

      <CourseSidebar
        modules={modules}
        activeModuleId={activeModuleId}
        completedStepIds={completedStepIds}
        onSelectModule={handleSelectModule}
      />

      <main id="course-main" className="course-main">
        <header className="course-topbar" data-course-control>
          <div>
            <span>Система продаж цифровых услуг</span>
            <strong>{completedStepIds.length} / {steps.length} шагов</strong>
          </div>
          <button type="button" aria-pressed={view === 'web'} onClick={() => setDestination('web', activeStepId)}>Паутина</button>
          <button type="button" aria-pressed={view === 'lesson'} onClick={() => setDestination('lesson', activeStepId)}>Текущий шаг</button>
        </header>

        {view === 'web' ? (
          <div className="course-map-view">
            <LearningWeb
              course={course}
              modules={modules}
              steps={steps}
              activeModuleId={activeModuleId}
              activeStepId={activeStepId}
              completedStepIds={completedStepIds}
              nextStepId={requiredStepId}
              recommendedStepId={diagnostic?.step.id ?? null}
              onSelectCenter={() => handleSelectModule(course.moduleIds[0])}
              onSelectModule={handleSelectModule}
              onSelectStep={stepId => setDestination('lesson', stepId)}
            />
            <DiagnosticWheel
              course={course}
              stepById={stepById}
              diagnosticId={diagnosticId}
              onSelectDiagnostic={handleDiagnosticSelection}
              onOpenStep={stepId => setDestination('lesson', stepId)}
            />
          </div>
        ) : (
          <LearningWorkspace
            module={activeModule}
            step={activeStep}
            nextStep={activeStep.nextStepId ? stepById[activeStep.nextStepId] : null}
            requiredStepId={requiredStepId}
            completedStepIds={completedStepIds}
            effectsAllowed={effectsAllowed}
            finalStepId={steps.at(-1).id}
            onBack={() => setDestination('web', activeStepId)}
            onPrimaryAction={handlePrimaryAction}
            onEnterMaterial={() => scheduleSplash(false)}
          />
        )}
      </main>
    </div>
  );
}
