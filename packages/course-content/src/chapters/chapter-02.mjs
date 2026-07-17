import { steps } from '../course.mjs';

export const chapter02 = Object.freeze(steps.filter((step) => step.moduleId === 'offer'));
