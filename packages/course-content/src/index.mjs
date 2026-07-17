import coverageMatrixData from './coverage-matrix.json' with { type: 'json' };
import { course, modules, steps } from './course.mjs';
import { deepFreeze } from './factory.mjs';
import { validateCourse } from './schema.mjs';
import { videoEvidence } from './sources.mjs';

export { course, modules, steps, validateCourse, videoEvidence };

export const moduleById = deepFreeze(Object.fromEntries(
  modules.map((module) => [module.id, module]),
));

export const stepById = deepFreeze(Object.fromEntries(
  steps.map((step) => [step.id, step]),
));

export const coverageMatrix = deepFreeze(coverageMatrixData);
export const validation = deepFreeze(validateCourse({ course, modules, steps }));

export default course;
