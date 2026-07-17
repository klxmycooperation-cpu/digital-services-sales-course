import LineSidebar from '../components/react-bits/LineSidebar/LineSidebar.jsx';

export default function CourseSidebar({
  modules,
  activeModuleId,
  completedStepIds,
  onSelectModule,
}) {
  const activeIndex = Math.max(0, modules.findIndex(module => module.id === activeModuleId));
  const completed = new Set(completedStepIds);

  return (
    <aside className="course-sidebar" data-course-control>
      <div className="course-sidebar__heading">
        <span>Маршрут</span>
        <strong>{String(activeIndex + 1).padStart(2, '0')} / {String(modules.length).padStart(2, '0')}</strong>
      </div>

      <div className="course-sidebar__exact" aria-hidden="true">
        <LineSidebar
          key={activeModuleId}
          items={modules.map(module => module.shortTitle)}
          defaultActive={activeIndex}
          accentColor="#75efff"
          textColor="#9aa6c5"
          markerColor="#354263"
          markerLength={48}
          maxShift={16}
          itemGap={16}
          fontSize={0.92}
          onItemClick={index => onSelectModule(modules[index].id)}
        />
      </div>

      <label className="course-sidebar__native-label">
        <span>Тема обучения</span>
        <select
          aria-label="Выбрать тему обучения"
          value={activeModuleId}
          onChange={event => onSelectModule(event.target.value)}
        >
          {modules.map(module => {
            const count = module.stepIds.filter(stepId => completed.has(stepId)).length;
            return (
              <option key={module.id} value={module.id}>
                {module.index}. {module.title} — {count}/4
              </option>
            );
          })}
        </select>
      </label>
    </aside>
  );
}
