export function detectCapabilities({ windowObject, documentObject, navigatorObject } = {}) {
  const activeWindow = windowObject ?? (typeof window === 'undefined' ? null : window);
  const activeDocument = documentObject ?? (typeof document === 'undefined' ? null : document);
  const activeNavigator = navigatorObject ?? (typeof navigator === 'undefined' ? null : navigator);

  const reducedMotion = Boolean(activeWindow?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const saveData = Boolean(activeNavigator?.connection?.saveData);
  let webgl = false;

  try {
    const canvas = activeDocument?.createElement?.('canvas');
    webgl = Boolean(canvas?.getContext?.('webgl2') || canvas?.getContext?.('webgl'));
  } catch {
    webgl = false;
  }

  return Object.freeze({ reducedMotion, saveData, webgl });
}

export function shouldReduceEffects({ reducedMotion = false, saveData = false, webgl = true } = {}) {
  return Boolean(reducedMotion || saveData || !webgl);
}

export function shouldUseAnimatedWebGl({ webgl = true, reduceEffects = false } = {}) {
  return Boolean(webgl && !reduceEffects);
}
