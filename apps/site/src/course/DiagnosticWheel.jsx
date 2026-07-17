import OptionWheel from '../components/react-bits/OptionWheel/OptionWheel.jsx';
import { resolveDiagnosticSelection } from './course-state.mjs';

export default function DiagnosticWheel({
  course,
  stepById,
  diagnosticId,
  onSelectDiagnostic,
  onOpenStep,
}) {
  const { activeIndex, diagnostic } = resolveDiagnosticSelection(course, diagnosticId);
  if (!diagnostic) return null;
  const recommendedStep = stepById[diagnostic.inspectStepId];
  if (!recommendedStep) return null;

  return (
    <section className="course-diagnostic" aria-labelledby="course-diagnostic-title" data-course-control>
      <div className="course-diagnostic__copy">
        <span className="course-kicker">Быстрый диагноз</span>
        <h2 id="course-diagnostic-title">Что сейчас мешает продажам?</h2>
        <p>Выберите реальный bottleneck. Маршрут останется целым, а паутина подсветит первый шаг для проверки.</p>
      </div>

      <div className="course-diagnostic__wheel-frame">
        <OptionWheel
          key={diagnostic.id}
          items={course.diagnostics.map(item => item.label)}
          defaultSelected={activeIndex}
          onChange={index => onSelectDiagnostic(course.diagnostics[index].id)}
          textColor="#7180a4"
          activeColor="#f4f7ff"
          fontSize={1.05}
          spacing={1.8}
          tilt={7}
          blur={0.8}
          fade={0.32}
          inset={28}
          loop
          className="course-diagnostic__wheel"
        />
      </div>

      <div className="course-diagnostic__result">
        <label className="course-diagnostic__native">
          <span>Точный выбор</span>
          <select
            aria-label="Выбрать проблему продаж"
            value={diagnostic.id}
            onChange={event => onSelectDiagnostic(event.target.value)}
          >
            {course.diagnostics.map(item => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <div className="course-diagnostic__announcement" role="status" aria-live="polite" aria-atomic="true">
          <span>Первый фикс</span>
          <strong>{recommendedStep.shortTitle}</strong>
          <p>{diagnostic.nextAction}</p>
        </div>
        <button type="button" onClick={() => onOpenStep(diagnostic.inspectStepId)}>
          Перейти к рекомендованному шагу
        </button>
      </div>
    </section>
  );
}
