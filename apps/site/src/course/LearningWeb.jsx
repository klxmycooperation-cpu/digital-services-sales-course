import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  buildLearningWebModel,
  calculateLearningWebScrollOffsets,
  classifySequenceEdgeState,
  classifyStepState,
  moduleAccessibleLabel,
  stepAccessibleLabel,
} from './course-state.mjs';

const MIN_ZOOM = 0.82;
const DEFAULT_ZOOM = 1;
const MAX_ZOOM = 1.36;
const ZOOM_STEP = 0.12;

function nodeFrame(node) {
  if (node.type === 'center') return { width: 220, height: 86 };
  if (node.type === 'module') return { width: 166, height: 76 };
  return { width: 116, height: 64 };
}

function statusLabel(state, isRecommended) {
  if (state === 'completed') return '✓ Готово';
  if (state === 'current') return 'Сейчас';
  if (state === 'next') return 'Дальше';
  if (isRecommended) return 'Рекомендовано';
  return '';
}

function scrollLearningWebViewport(viewport, options) {
  if (!viewport) return;
  const { left, top } = calculateLearningWebScrollOffsets({
    contentWidth: viewport.scrollWidth,
    contentHeight: viewport.scrollHeight,
    viewportWidth: viewport.clientWidth,
    viewportHeight: viewport.clientHeight,
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop,
    ...options,
  });

  if (typeof viewport.scrollTo === 'function') {
    viewport.scrollTo({ left, top, behavior: 'auto' });
    return;
  }
  viewport.scrollLeft = left;
  viewport.scrollTop = top;
}

export default function LearningWeb({
  course,
  modules,
  steps,
  activeModuleId,
  activeStepId,
  completedStepIds,
  nextStepId,
  recommendedStepId,
  onSelectModule,
  onSelectStep,
  onSelectCenter,
}) {
  const model = useMemo(() => buildLearningWebModel(course, modules, steps), [course, modules, steps]);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const viewportRef = useRef(null);
  const previousZoomRef = useRef(null);
  const centerOnNextLayoutRef = useRef(true);
  const nodeById = useMemo(() => new Map(model.nodes.map(node => [node.id, node])), [model]);
  const moduleById = useMemo(() => new Map(modules.map(module => [module.id, module])), [modules]);
  const completed = useMemo(() => new Set(completedStepIds), [completedStepIds]);

  useLayoutEffect(() => {
    const previousZoom = previousZoomRef.current ?? zoom;
    scrollLearningWebViewport(viewportRef.current, {
      previousZoom,
      nextZoom: zoom,
      center: centerOnNextLayoutRef.current,
    });
    previousZoomRef.current = zoom;
    centerOnNextLayoutRef.current = false;
  }, [zoom]);

  const changeZoom = delta => {
    centerOnNextLayoutRef.current = false;
    setZoom(current => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2)))));
  };

  const handleResetZoom = () => {
    centerOnNextLayoutRef.current = true;
    if (zoom !== DEFAULT_ZOOM) {
      setZoom(DEFAULT_ZOOM);
      return;
    }
    scrollLearningWebViewport(viewportRef.current, {
      previousZoom: zoom,
      nextZoom: zoom,
      center: true,
    });
    centerOnNextLayoutRef.current = false;
  };

  return (
    <section className="course-web" aria-labelledby="course-web-title" data-galaxy-zone="true">
      <div className="course-web__header">
        <div>
          <span className="course-kicker">Карта курса</span>
          <h1 id="course-web-title" tabIndex={-1}>Весь путь — на одном поле</h1>
          <p>Толстая линия ведёт по порядку. Тонкие связи показывают, где один навык усиливает другой.</p>
        </div>
        <div className="course-web__controls" aria-label="Масштаб паутины" data-course-control>
          <button type="button" aria-label="Уменьшить паутину" onClick={() => changeZoom(-ZOOM_STEP)} disabled={zoom <= MIN_ZOOM}>−</button>
          <output aria-live="polite">{Math.round(zoom * 100)}%</output>
          <button type="button" aria-label="Увеличить паутину" onClick={() => changeZoom(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM}>+</button>
          <button type="button" aria-label="Сбросить масштаб" onClick={handleResetZoom}>Сброс</button>
        </div>
      </div>

      <div className="course-web__legend" aria-label="Состояния шагов">
        <span><i className="course-web__legend-dot course-web__legend-dot--completed" />Готово</span>
        <span><i className="course-web__legend-dot course-web__legend-dot--current" />Открыто</span>
        <span><i className="course-web__legend-dot course-web__legend-dot--next" />Следующий шаг</span>
      </div>

      <div ref={viewportRef} className="course-web__viewport" tabIndex={0} aria-label="Прокручиваемая большая паутина курса">
        <svg
          className="course-web__svg"
          viewBox="0 0 1600 1000"
          width={Math.round(model.size.width * zoom)}
          height={Math.round(model.size.height * zoom)}
          role="group"
          aria-labelledby="course-web-svg-title course-web-svg-description"
        >
          <title id="course-web-svg-title">Паутина курса «{course.title}»</title>
          <desc id="course-web-svg-description">Центр курса, семь модулей и двадцать восемь последовательных учебных шагов.</desc>
          <defs>
            <marker id="course-web-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 Z" />
            </marker>
          </defs>

          <g className="course-web__edges" aria-hidden="true">
            {model.edges.map(connection => {
              const from = nodeById.get(connection.fromId);
              const to = nodeById.get(connection.toId);
              const edgeState = classifySequenceEdgeState(connection, {
                activeStepId,
                completedStepIds,
                nextStepId,
              });
              const edgeStateClass = edgeState ? ` course-web__edge-state--${edgeState}` : '';
              return (
                <line
                  key={connection.id}
                  className={`course-web__edge course-web__edge--${connection.type}${edgeStateClass}`}
                  data-edge-state={edgeState ?? undefined}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  markerEnd={connection.type === 'sequence' ? 'url(#course-web-arrow)' : undefined}
                />
              );
            })}
          </g>

          <g className="course-web__nodes">
            {model.nodes.map(node => {
              const frame = nodeFrame(node);
              const left = node.x - frame.width / 2;
              const top = node.y - frame.height / 2;

              if (node.type === 'center') {
                return (
                  <foreignObject key={node.id} x={left} y={top} width={frame.width} height={frame.height}>
                    <button type="button" className="course-web__node course-web__node--center" aria-label={node.accessibleLabel} data-course-control onClick={onSelectCenter}>
                      <span>Система продаж</span>
                      <strong>7 модулей · 28 шагов</strong>
                    </button>
                  </foreignObject>
                );
              }

              if (node.type === 'module') {
                const module = moduleById.get(node.refId);
                const done = module.stepIds.filter(stepId => completed.has(stepId)).length;
                const selected = node.refId === activeModuleId;
                return (
                  <foreignObject key={node.id} x={left} y={top} width={frame.width} height={frame.height}>
                    <button
                      type="button"
                      data-course-control
                      className={`course-web__node course-web__node--module${selected ? ' course-web__node--module-active' : ''}`}
                      aria-label={moduleAccessibleLabel({
                        accessibleLabel: node.accessibleLabel,
                        completedCount: done,
                        totalCount: module.stepIds.length,
                        selected,
                      })}
                      aria-pressed={selected}
                      onClick={() => onSelectModule(node.refId)}
                    >
                      <span>М{module.index} · {done}/4</span>
                      <strong>{node.label}</strong>
                    </button>
                  </foreignObject>
                );
              }

              const state = classifyStepState(node.refId, { activeStepId, completedStepIds, nextStepId });
              const isRecommended = node.refId === recommendedStepId;
              const step = steps.find(entry => entry.id === node.refId);
              const module = moduleById.get(step.moduleId);
              return (
                <foreignObject key={node.id} x={left} y={top} width={frame.width} height={frame.height}>
                  <button
                    type="button"
                    data-course-control
                    className={`course-web__node course-web__node--step course-web__node--${state}${isRecommended ? ' course-web__node--recommended' : ''}`}
                    aria-label={stepAccessibleLabel({
                      accessibleLabel: node.accessibleLabel,
                      state,
                      recommended: isRecommended,
                    })}
                    aria-current={state === 'current' ? 'step' : undefined}
                    data-step-state={state}
                    data-recommended={isRecommended ? 'true' : undefined}
                    onClick={() => onSelectStep(node.refId)}
                  >
                    <span>{module.index}.{step.index}</span>
                    <strong>{node.label}</strong>
                    <small>{statusLabel(state, isRecommended)}</small>
                  </button>
                </foreignObject>
              );
            })}
          </g>
        </svg>
      </div>
    </section>
  );
}
