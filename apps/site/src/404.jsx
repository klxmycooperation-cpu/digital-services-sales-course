import { createRoot } from 'react-dom/client';

import { getDeploymentBase, getHomeHref } from './app-route.mjs';
import { detectCapabilities } from './capabilities.mjs';
import NotFoundPage from './not-found/NotFoundPage.jsx';
import './styles.css';

const homeHref = getHomeHref(getDeploymentBase(import.meta.url));

createRoot(document.getElementById('root')).render(
  <NotFoundPage capabilities={detectCapabilities()} homeHref={homeHref} />
);
