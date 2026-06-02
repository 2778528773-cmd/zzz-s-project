const api = window.todoApi;

const state = {
  tasks: [],
  view: 'all',
  query: '',
  completionMode: localStorage.getItem('donezo:completionMode') || 'all',
  displayMode: localStorage.getItem('donezo:displayMode') || 'list',
  sidebarCollapsed: localStorage.getItem('donezo:sidebarCollapsed') === 'true'
};

const els = {
  app: document.querySelector('.app'),
  content: document.querySelector('.content'),
  sidebarToggle: document.querySelector('#sidebarToggle'),
  todayText: document.querySelector('#todayText'),
  viewTitle: document.querySelector('#viewTitle'),
  viewHint: document.querySelector('#viewHint'),
  taskForm: document.querySelector('#taskForm'),
  titleInput: document.querySelector('#titleInput'),
  projectInput: document.querySelector('#projectInput'),
  dateInput: document.querySelector('#dateInput'),
  dateField: document.querySelector('.date-field'),
  dateDisplay: document.querySelector('#dateDisplay'),
  calendarPopover: document.querySelector('#calendarPopover'),
  calendarPrev: document.querySelector('#calendarPrev'),
  calendarNext: document.querySelector('#calendarNext'),
  calendarMonth: document.querySelector('#calendarMonth'),
  calendarGrid: document.querySelector('#calendarGrid'),
  calendarToday: document.querySelector('#calendarToday'),
  calendarClear: document.querySelector('#calendarClear'),
  importantInput: document.querySelector('#importantInput'),
  urgentInput: document.querySelector('#urgentInput'),
  searchInput: document.querySelector('#searchInput'),
  dailyEncouragement: document.querySelector('#dailyEncouragement'),
  taskList: document.querySelector('#taskList'),
  quadrantBoard: document.querySelector('#quadrantBoard'),
  emptyState: document.querySelector('#emptyState'),
  taskTemplate: document.querySelector('#taskTemplate'),
  completionBar: document.querySelector('#completionBar'),
  completionDetail: document.querySelector('#completionDetail'),
  allCount: document.querySelector('#allCount'),
  todayCount: document.querySelector('#todayCount'),
  openCount: document.querySelector('#openCount'),
  doneCount: document.querySelector('#doneCount'),
  navItems: [...document.querySelectorAll('.nav-item')],
  completionModes: [...document.querySelectorAll('.completion-mode')],
  displayModes: [...document.querySelectorAll('.display-mode')]
};

document.body.appendChild(els.calendarPopover);

let calendarCursor = new Date();
let calendarTarget = { type: 'form' };

const viewCopy = {
  all: ['全部任务', '安静地收拢要做的事，一条一条推进。'],
  today: ['今天', '今天到期的任务会出现在这里。'],
  open: ['进行中', '保持轻一点，但别失焦。'],
  done: ['已完成', '这些已经处理完了。']
};

const quadrantCopy = {
  q1: '重要且紧急',
  q2: '重要不紧急',
  q3: '不重要但紧急',
  q4: '不重要不紧急'
};

const quadrantHint = {
  q1: '马上处理',
  q2: '计划推进',
  q3: '快速处理',
  q4: '低压整理'
};

const legacyPriorityMap = {
  high: 'q1',
  medium: 'q2',
  normal: 'q2',
  low: 'q4'
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateDisplay(value) {
  if (!value) return '时间';
  const [year, month, day] = value.split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

function updateDateDisplay() {
  els.dateDisplay.textContent = formatDateDisplay(els.dateInput.value);
}

function localDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function setDateValue(value) {
  if (calendarTarget.type === 'task' && calendarTarget.task) {
    calendarTarget.task.dueDate = value;
    calendarTarget.task.updatedAt = new Date().toISOString();
    await save();
    render();
    return;
  }

  els.dateInput.value = value;
  updateDateDisplay();
  renderCalendar();
}

function closeCalendar() {
  els.calendarPopover.classList.add('hidden');
  els.dateField.setAttribute('aria-expanded', 'false');
  if (calendarTarget.button) {
    calendarTarget.button.setAttribute('aria-expanded', 'false');
  }
  calendarTarget = { type: 'form' };
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const selected = calendarTarget.type === 'task' && calendarTarget.task ? calendarTarget.task.dueDate : els.dateInput.value;
  const today = todayISO();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  els.calendarMonth.textContent = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long'
  }).format(calendarCursor);
  els.calendarGrid.innerHTML = '';
  els.dateField.setAttribute('aria-expanded', 'true');

  for (let i = 0; i < firstWeekday; i += 1) {
    const spacer = document.createElement('span');
    spacer.className = 'calendar-spacer';
    els.calendarGrid.appendChild(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const value = localDateISO(date);
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = day;
    button.className = 'calendar-day';
    button.classList.toggle('today', value === today);
    button.classList.toggle('selected', value === selected);
    button.addEventListener('click', async () => {
      await setDateValue(value);
      closeCalendar();
    });

    els.calendarGrid.appendChild(button);
  }
}

function positionCalendar(anchor) {
  const anchorRect = anchor.getBoundingClientRect();
  const popoverRect = els.calendarPopover.getBoundingClientRect();
  const gap = 10;
  const maxLeft = Math.max(18, window.innerWidth - popoverRect.width - 18);
  const maxTop = Math.max(18, window.innerHeight - popoverRect.height - 18);
  const centeredLeft = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;
  const shouldOpenAbove = anchorRect.bottom + gap + popoverRect.height > window.innerHeight - 18;
  const preferredTop = shouldOpenAbove ? anchorRect.top - popoverRect.height - gap : anchorRect.bottom + gap;
  const left = Math.max(18, Math.min(centeredLeft, maxLeft));
  const top = Math.max(18, Math.min(preferredTop, maxTop));

  els.calendarPopover.style.left = `${left}px`;
  els.calendarPopover.style.top = `${top}px`;
  els.calendarPopover.dataset.placement = shouldOpenAbove ? 'top' : 'bottom';
}

function openCalendar(anchor = els.dateField, target = { type: 'form' }) {
  calendarTarget = target;
  const value = target.type === 'task' && target.task ? target.task.dueDate : els.dateInput.value;
  calendarCursor = value ? new Date(`${value}T00:00:00`) : new Date();
  renderCalendar();
  els.calendarPopover.classList.remove('hidden');
  positionCalendar(anchor);
  anchor.setAttribute('aria-expanded', 'true');
}

function syncCalendarPosition() {
  if (els.calendarPopover.classList.contains('hidden')) return;
  const anchor = calendarTarget.type === 'task' && calendarTarget.button ? calendarTarget.button : els.dateField;
  positionCalendar(anchor);
}

function quadrantFromFlags(isImportant, isUrgent) {
  if (isImportant && isUrgent) return 'q1';
  if (isImportant) return 'q2';
  if (isUrgent) return 'q3';
  return 'q4';
}

function normalizeQuadrant(priority) {
  return quadrantCopy[priority] ? priority : legacyPriorityMap[priority] || 'q4';
}

function sortTasks(tasks) {
  const order = { q1: 0, q2: 1, q3: 2, q4: 3 };
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    return (order[normalizeQuadrant(a.priority)] ?? 3) - (order[normalizeQuadrant(b.priority)] ?? 3);
  });
}

function filteredTasks() {
  const query = state.query.toLowerCase();
  return sortTasks(state.tasks).filter((task) => {
    const matchesView =
      state.view === 'all' ||
      (state.view === 'today' && task.dueDate === todayISO()) ||
      (state.view === 'open' && !task.completed) ||
      (state.view === 'done' && task.completed);
    const quadrant = quadrantCopy[normalizeQuadrant(task.priority)];
    const matchesQuery = [task.title, task.notes, task.project, quadrant].join(' ').toLowerCase().includes(query);
    return matchesView && matchesQuery;
  });
}

async function save() {
  await api.saveTasks(state.tasks);
}

function updateCounts() {
  const total = state.tasks.length;
  const done = state.tasks.filter((task) => task.completed).length;
  const todayTasks = state.tasks.filter((task) => task.dueDate === todayISO());
  const todayDone = todayTasks.filter((task) => task.completed).length;
  const today = state.tasks.filter((task) => task.dueDate === todayISO() && !task.completed).length;
  const open = total - done;
  const completionTasks =
    state.completionMode === 'today' ? state.tasks.filter((task) => task.dueDate === todayISO()) : state.tasks;
  const completionTotal = completionTasks.length;
  const completionDone = completionTasks.filter((task) => task.completed).length;
  const completion = completionTotal ? Math.round((completionDone / completionTotal) * 100) : 0;

  els.allCount.textContent = total;
  els.todayCount.textContent = today;
  els.openCount.textContent = open;
  els.doneCount.textContent = done;
  els.completionBar.style.width = `${completion}%`;
  els.completionDetail.textContent = `${completionDone}/${completionTotal}（${completion}%）`;
  els.dailyEncouragement.classList.toggle('hidden', todayTasks.length === 0 || todayDone !== todayTasks.length);

  for (const mode of els.completionModes) {
    mode.classList.toggle('active', mode.dataset.completionMode === state.completionMode);
  }
}

function renderTask(task) {
  const node = els.taskTemplate.content.firstElementChild.cloneNode(true);
  const checkButton = node.querySelector('.check-button');
  const titleInput = node.querySelector('.task-title');
  const notesInput = node.querySelector('.task-notes');
  const projectPill = node.querySelector('.project-pill');
  const priorityPill = node.querySelector('.priority-pill');
  const dueButton = node.querySelector('.due-button');
  const dueButtonLabel = dueButton.querySelector('strong');
  const deleteButton = node.querySelector('.delete-button');

  node.classList.toggle('completed', task.completed);
  titleInput.value = task.title;
  notesInput.value = task.notes || '';
  projectPill.textContent = task.project || 'Inbox';
  const quadrant = normalizeQuadrant(task.priority);
  priorityPill.textContent = quadrantCopy[quadrant];
  priorityPill.classList.add(`priority-${quadrant}`);
  dueButtonLabel.textContent = task.dueDate ? task.dueDate.replaceAll('-', '/') : '时间';
  dueButton.setAttribute('aria-expanded', 'false');

  checkButton.addEventListener('click', async () => {
    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();
    await save();
    render();
  });

  titleInput.addEventListener('change', async () => {
    task.title = titleInput.value.trim() || task.title;
    task.updatedAt = new Date().toISOString();
    await save();
    render();
  });

  notesInput.addEventListener('change', async () => {
    task.notes = notesInput.value.trim();
    task.updatedAt = new Date().toISOString();
    await save();
    render();
  });

  dueButton.addEventListener('click', () => {
    openCalendar(dueButton, { type: 'task', task, button: dueButton });
  });

  deleteButton.addEventListener('click', async () => {
    state.tasks = state.tasks.filter((item) => item.id !== task.id);
    await save();
    render();
  });

  return node;
}

function renderList(tasks) {
  els.taskList.innerHTML = '';

  for (const task of tasks) {
    els.taskList.appendChild(renderTask(task));
  }
}

function renderQuadrantBoard(tasks) {
  els.quadrantBoard.innerHTML = '';

  for (const quadrant of ['q1', 'q2', 'q3', 'q4']) {
    const column = document.createElement('section');
    const header = document.createElement('header');
    const title = document.createElement('h3');
    const count = document.createElement('span');
    const hint = document.createElement('p');
    const list = document.createElement('ul');
    const quadrantTasks = tasks.filter((task) => normalizeQuadrant(task.priority) === quadrant);

    column.className = `quadrant-column quadrant-${quadrant}`;
    header.className = 'quadrant-header';
    list.className = 'quadrant-list';
    title.textContent = quadrantCopy[quadrant];
    count.textContent = quadrantTasks.length;
    hint.textContent = quadrantHint[quadrant];

    header.append(title, count);
    column.append(header, hint, list);

    for (const task of quadrantTasks) {
      list.appendChild(renderTask(task));
    }

    els.quadrantBoard.appendChild(column);
  }
}

function render() {
  const [title, hint] = viewCopy[state.view];
  const tasks = filteredTasks();

  els.viewTitle.textContent = title;
  els.viewHint.textContent = hint;
  els.emptyState.classList.toggle('hidden', tasks.length > 0);
  els.taskList.classList.toggle('hidden', state.displayMode !== 'list' || tasks.length === 0);
  els.quadrantBoard.classList.toggle('hidden', state.displayMode !== 'quadrant' || tasks.length === 0);

  if (state.displayMode === 'quadrant') {
    els.taskList.innerHTML = '';
    renderQuadrantBoard(tasks);
  } else {
    els.quadrantBoard.innerHTML = '';
    renderList(tasks);
  }

  for (const item of els.navItems) {
    item.classList.toggle('active', item.dataset.view === state.view);
  }

  for (const mode of els.displayModes) {
    mode.classList.toggle('active', mode.dataset.displayMode === state.displayMode);
  }

  updateCounts();
}

function renderSidebarState() {
  els.app.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
  els.sidebarToggle.setAttribute('aria-label', state.sidebarCollapsed ? '展开侧边栏' : '收起侧边栏');
  els.sidebarToggle.setAttribute('title', state.sidebarCollapsed ? '展开侧边栏' : '收起侧边栏');
}

els.taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = els.titleInput.value.trim();
  if (!title) return;

  state.tasks.unshift({
    id: crypto.randomUUID(),
    title,
    notes: '',
    project: els.projectInput.value.trim() || 'Inbox',
    dueDate: els.dateInput.value,
    priority: quadrantFromFlags(els.importantInput.checked, els.urgentInput.checked),
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  els.taskForm.reset();
  updateDateDisplay();
  await save();
  render();
  els.titleInput.focus();
});

els.dateInput.addEventListener('change', updateDateDisplay);

els.dateField.addEventListener('click', (event) => {
  event.preventDefault();
  openCalendar(els.dateField, { type: 'form' });
});

els.dateField.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openCalendar(els.dateField, { type: 'form' });
  }
  if (event.key === 'Escape') {
    closeCalendar();
  }
});

els.calendarPrev.addEventListener('click', () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
  renderCalendar();
});

els.calendarNext.addEventListener('click', () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
  renderCalendar();
});

els.calendarToday.addEventListener('click', async () => {
  await setDateValue(todayISO());
  closeCalendar();
});

els.calendarClear.addEventListener('click', async () => {
  await setDateValue('');
  closeCalendar();
});

document.addEventListener('click', (event) => {
  if (els.calendarPopover.classList.contains('hidden')) return;
  if (els.calendarPopover.contains(event.target) || els.dateField.contains(event.target)) return;
  if (calendarTarget.button && calendarTarget.button.contains(event.target)) return;
  closeCalendar();
});

els.content.addEventListener('scroll', syncCalendarPosition, { passive: true });
window.addEventListener('scroll', syncCalendarPosition, { passive: true });
window.addEventListener('resize', syncCalendarPosition);

els.searchInput.addEventListener('input', () => {
  state.query = els.searchInput.value.trim();
  render();
});

for (const item of els.navItems) {
  item.addEventListener('click', () => {
    state.view = item.dataset.view;
    render();
  });
}

for (const mode of els.completionModes) {
  mode.addEventListener('click', () => {
    state.completionMode = mode.dataset.completionMode;
    localStorage.setItem('donezo:completionMode', state.completionMode);
    updateCounts();
  });
}

for (const mode of els.displayModes) {
  mode.addEventListener('click', () => {
    state.displayMode = mode.dataset.displayMode;
    localStorage.setItem('donezo:displayMode', state.displayMode);
    render();
  });
}

els.sidebarToggle.addEventListener('click', () => {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  localStorage.setItem('donezo:sidebarCollapsed', String(state.sidebarCollapsed));
  renderSidebarState();
});

async function boot() {
  els.todayText.textContent = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(new Date());
  state.tasks = await api.listTasks();
  updateDateDisplay();
  renderSidebarState();
  render();
  els.titleInput.focus();
}

boot();
