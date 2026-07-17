import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { course, modules, steps } from '@sales-course/content';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, '../dist/course-manifest.json');

export function createCourseManifest(canonical) {
  return {
    schemaVersion: 2,
    courseId: canonical.course.id,
    title: canonical.course.title,
    moduleCount: canonical.modules.length,
    stepCount: canonical.steps.length,
    course: canonical.course,
    modules: canonical.modules,
    steps: canonical.steps,
  };
}

export async function writeCourseManifest(destination = output) {
  const manifest = createCourseManifest({ course, modules, steps });
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return destination;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const destination = await writeCourseManifest();
  console.log(`Course manifest: ${destination}`);
}
