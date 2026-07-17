const HOME_PATHS = new Set(['/', '/index.html']);

export const STATIC_HOSTING_CONTRACT = Object.freeze({
  custom404Document: '404.html',
  directDocumentUnderDeploymentBase: true,
  arbitraryNestedErrorDocumentUrls: false,
});

export function normalizePathname(pathname = '/') {
  const value = typeof pathname === 'string' && pathname.length > 0 ? pathname : '/';
  const withoutQuery = value.split(/[?#]/, 1)[0] || '/';
  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
}

export function normalizeBasePath(basePath = '/') {
  const normalized = normalizePathname(basePath);
  return normalized === '/' || normalized.endsWith('/') ? normalized : `${normalized}/`;
}

export function getDeploymentBase(moduleUrl) {
  if (typeof moduleUrl !== 'string' || moduleUrl.length === 0) return '/';

  try {
    return normalizeBasePath(new URL('../', moduleUrl).pathname);
  } catch {
    return '/';
  }
}

export function getHomeHref(basePath = '/') {
  return normalizeBasePath(basePath);
}

export function resolveAppRoute(pathname = '/', basePath = '/') {
  const normalizedPath = normalizePathname(pathname);
  const normalizedBase = normalizeBasePath(basePath);
  let logicalPath;

  if (normalizedBase === '/') {
    logicalPath = normalizedPath;
  } else {
    const baseWithoutTrailingSlash = normalizedBase.slice(0, -1);
    if (normalizedPath === baseWithoutTrailingSlash) logicalPath = '/';
    else if (normalizedPath.startsWith(normalizedBase)) logicalPath = `/${normalizedPath.slice(normalizedBase.length)}`;
    else return 'not-found';
  }

  return HOME_PATHS.has(logicalPath) ? 'home' : 'not-found';
}
