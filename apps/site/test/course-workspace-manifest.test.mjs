import assert from 'node:assert/strict';
import test from 'node:test';

import { course, modules, steps } from '@sales-course/content';

test('site manifest serializes the complete canonical v2 contract without legacy lessons', async () => {
  const { createCourseManifest } = await import('../scripts/write-course-manifest.mjs');
  const manifest = createCourseManifest({ course, modules, steps });

  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.courseId, course.id);
  assert.equal(manifest.moduleCount, 7);
  assert.equal(manifest.stepCount, 28);
  assert.deepEqual(manifest.course, course);
  assert.deepEqual(manifest.modules, modules);
  assert.deepEqual(manifest.steps, steps);
  assert.equal('lessons' in manifest, false);
  assert.equal('lessonCount' in manifest, false);
  assert.equal(manifest.steps[0].action.output, steps[0].action.output);
  assert.equal(manifest.steps[0].sources[0].url, steps[0].sources[0].url);
});
