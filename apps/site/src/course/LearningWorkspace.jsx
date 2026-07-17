import { lazy, Suspense } from 'react';

import BorderGlow from '../components/react-bits/BorderGlow/BorderGlow.jsx';
import SpotlightCard from '../components/react-bits/SpotlightCard/SpotlightCard.jsx';
import ProgressBridge from './ProgressBridge.jsx';

const DecryptedText = lazy(() => import('../components/react-bits/DecryptedText/DecryptedText.jsx'));
const TrueFocus = lazy(() => import('../components/react-bits/TrueFocus/TrueFocus.jsx'));

const GLOW_COLORS = Object.freeze(['#75efff', '#7ca7ff', '#b6a4ff']);

function PrimaryLabel({ isRequired, courseComplete }) {
  if (isRequired) return <span>Отметить и продолжить</span>;
  if (courseComplete) return <span>Вернуться к завершению курса</span>;
  return <span>Вернуться к обязательному шагу</span>;
}

export default function LearningWorkspace({
  module,
  step,
  nextStep,
  requiredStepId,
  completedStepIds,
  effectsAllowed,
  finalStepId,
  onBack,
  onPrimaryAction,
  onEnterMaterial,
}) {
  const isRequired = step.id === requiredStepId;
  const isDone = completedStepIds.includes(step.id);
  const courseComplete = requiredStepId === null;
  const isFinalCompletion = courseComplete && step.id === finalStepId;

  return (
    <article
      className="course-material"
      data-learning-panel
      onPointerEnter={onEnterMaterial}
      aria-labelledby={`course-step-title-${step.id}`}
    >
      <nav className="course-material__utility" aria-label="Навигация текущего шага" data-course-control>
        <button type="button" className="course-button course-button--quiet" onClick={onBack}>
          <span aria-hidden="true">←</span> <span>Вернуться к паутине</span>
        </button>
        <span>{isDone ? 'Шаг пройден' : isRequired ? 'Шаг по порядку' : 'Просмотр без отметки'}</span>
      </nav>

      <header className="course-material__header">
        <span className="course-kicker">Модуль {module.index} · Шаг {step.index} из 4</span>
        <h1 id={`course-step-title-${step.id}`} tabIndex={-1}>
          {effectsAllowed ? (
            <Suspense fallback={step.title}>
              <DecryptedText
                key={step.id}
                text={step.title}
                animateOn="view"
                sequential
                revealDirection="start"
                speed={22}
                maxIterations={8}
                useOriginalCharsOnly
                parentClassName="course-material__decrypted-title"
                className="course-material__title-letter"
                encryptedClassName="course-material__title-letter course-material__title-letter--encrypted"
              />
            </Suspense>
          ) : step.title}
        </h1>
      </header>

      <div className="course-material__body">
        <section className="course-material__section" aria-labelledby={`why-${step.id}`}>
          <h2 id={`why-${step.id}`}>Зачем</h2>
          <p className="course-material__lead">{step.why}</p>
        </section>

        <section className="course-material__section" aria-labelledby={`understand-${step.id}`}>
          <h2 id={`understand-${step.id}`}>Понять</h2>
          <ul className="course-material__understand">
            {step.understand.map(point => <li key={point}>{point}</li>)}
          </ul>
          <div className="course-material__focus" aria-label={`Ключевая мысль: ${step.focusPhrase}`}>
            {effectsAllowed ? (
              <Suspense fallback={step.focusPhrase}>
                <TrueFocus
                  key={step.id}
                  sentence={step.focusPhrase}
                  manualMode={false}
                  blurAmount={3}
                  borderColor="#75efff"
                  glowColor="rgba(117, 239, 255, 0.42)"
                  animationDuration={0.45}
                  pauseBetweenAnimations={0.7}
                />
              </Suspense>
            ) : step.focusPhrase}
          </div>
        </section>

        <section className="course-material__section" aria-labelledby={`example-${step.id}`}>
          <h2 id={`example-${step.id}`}>Пример</h2>
          <SpotlightCard
            className="course-material__spotlight"
            spotlightColor="rgba(117, 239, 255, 0.18)"
          >
            <h3>{step.example.title}</h3>
            <p>{step.example.body}</p>
          </SpotlightCard>
        </section>

        <section className="course-material__section" aria-labelledby={`action-${step.id}`}>
          <h2 id={`action-${step.id}`}>Сделать</h2>
          <div className="course-material__task">
            <span>{step.action.label}</span>
            <p>{step.action.task}</p>
          </div>
          <SpotlightCard
            className="course-material__spotlight course-material__spotlight--details"
            spotlightColor="rgba(124, 167, 255, 0.18)"
          >
            <details>
              <summary>Открыть инструменты · {step.tools.length}</summary>
              <div className="course-material__tools">
                {step.tools.map(tool => (
                  <article key={tool.title}>
                    <h3>{tool.title}</h3>
                    <p>{tool.description}</p>
                    <code>{tool.content}</code>
                  </article>
                ))}
              </div>
            </details>
          </SpotlightCard>
        </section>

        <section className="course-material__section" aria-labelledby={`result-${step.id}`}>
          <h2 id={`result-${step.id}`}>Результат</h2>
          <dl className="course-material__result">
            <div>
              <dt>На выходе</dt>
              <dd>{step.action.output}</dd>
            </div>
            <div>
              <dt>Готово, когда</dt>
              <dd>{step.action.doneWhen}</dd>
            </div>
          </dl>
        </section>

        <section className="course-material__section" aria-labelledby={`next-${step.id}`}>
          <h2 id={`next-${step.id}`}>Дальше</h2>
          <ProgressBridge key={step.id} currentStep={step} nextStep={nextStep} effectsAllowed={effectsAllowed} />
          <SpotlightCard
            className="course-material__spotlight course-material__spotlight--details"
            spotlightColor="rgba(182, 164, 255, 0.16)"
          >
            <details>
              <summary>Источники и основания · {step.sources.length}</summary>
              <ul className="course-material__sources">
                {step.sources.map(source => (
                  <li key={`${source.url}:${source.usage}`}>
                    <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                    <p>{source.usage}</p>
                    <small>Проверено {source.checkedAt} · {source.type}</small>
                  </li>
                ))}
              </ul>
            </details>
          </SpotlightCard>
        </section>
      </div>

      <footer className="course-material__actions" data-course-control>
        {isFinalCompletion ? (
          <div className="course-material__complete">
            <span>28 / 28</span>
            <strong>Курс пройден. Все шаги отмечены по порядку.</strong>
          </div>
        ) : (
          <BorderGlow
            className="course-material__primary-glow"
            glowColor="186 100 73"
            backgroundColor="#080b18"
            borderRadius={12}
            glowRadius={20}
            glowIntensity={0.8}
            coneSpread={22}
            colors={GLOW_COLORS}
            fillOpacity={0.28}
          >
            <button
              type="button"
              className="course-button course-button--primary"
              onClick={onPrimaryAction}
            >
              <PrimaryLabel isRequired={isRequired} courseComplete={courseComplete} />
            </button>
          </BorderGlow>
        )}
      </footer>
    </article>
  );
}
