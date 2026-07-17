# Передача проекта

## Что является источником истины

Учебный материал хранится только в `packages/course-content/src/`:

- `course.mjs` — 7 модулей и 28 шагов;
- `sources.mjs` — источники;
- `schema.mjs` — структурные проверки;
- `coverage-matrix.json` — покрытие тем.

Сайт и презентация не должны содержать отдельные копии курса. Их manifest-файлы обязаны совпадать с каноническим контентом.

## Сайт

Точка входа: `apps/site/src/main.jsx`.

Основные области:

- `entry/EntryGate.jsx` — первый экран `sale that shit`;
- `course/LearningWeb.jsx` — большая паутина;
- `course/LearningWorkspace.jsx` — один учебный шаг;
- `course/CourseSidebar.jsx` — постоянная навигация;
- `components/react-bits/` — исходные визуальные компоненты;
- `404.jsx` и `not-found/` — отдельная 404-страница.

Команда разработки:

```bash
npm ci
npm run dev:site
```

## Презентация

Финальный генератор: `apps/deck/src/build-deck.mjs`.

Он создаёт 32 слайда: четыре вводных и по одному слайду на каждый из 28 шагов. Для сборки нужен `@oai/artifact-tool` из среды Codex. Итоговый PPTX доступен в последнем GitHub Release.

В обычной Node.js-среде `npm test` проверяет контент и чистые функции генератора. Полная runtime-проверка презентации запускается внутри Codex:

```bash
npm run test:runtime -w @sales-course/deck
npm run build:deck
```

## Контрольные точки

Перед передачей изменений:

1. `npm test`
2. `npm run build:site`
3. проверить `apps/site/dist/course-manifest.json`: schemaVersion 2, 7 модулей, 28 шагов;
4. после пересборки презентации выполнить `npm run verify:artifacts`;
5. проверить desktop, mobile и 404 в браузере.

## Известное замечание

Vite предупреждает о lazy Three.js chunk около 517 KB. Это не ломает загрузку: Galaxy и LaserFlow имеют lazy-gates и fallback для reduced-motion/WebGL.

## Не публиковалось

В репозитории намеренно отсутствуют локальные пути к пользовательским вложениям, npm-кеши, `node_modules`, временные рендеры, старые версии и внутренние рабочие файлы.
