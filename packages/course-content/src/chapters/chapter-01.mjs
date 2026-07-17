import { steps } from '../course.mjs';

export const chapter01 = Object.freeze(steps.filter((step) => step.moduleId === 'system'));
