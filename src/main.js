import './style.css';

const STORAGE_KEY = 'studentTasks';

let tasks = [];
let currentFilter = 'all';

try {
  const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  tasks = Array.isArray(savedTasks) ? savedTasks : [];
} catch {
  tasks = [];
}

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="container">
    <header class="header">
      <p class="eyebrow">STAY ORGANIZED</p>
      <h1>Student Task Manager</h1>
      <p class="subtitle">Plan your work. Track your progress.</p>
    </header>

    <section class="summary">
      <div class="summary-card">
        <span>Total Tasks</span>
        <strong id="total-count">0</strong>
      </div>
      <div class="summary-card">
        <span>Remaining Tasks</span>
        <strong id="pending-count">0</strong>
      </div>
      <div class="summary-card">
        <span>Completed</span>
        <strong id="completed-count">0</strong>
      </div>
    </section>

    <section class="panel">
      <h2>Add a New Task</h2>

      <form id="task-form">
        <label for="task-name">Task Name</label>
        <input
          id="task-name"
          type="text"
          placeholder="Enter your task..."
          required
          maxlength="150"
        />

        <label for="task-date">Due Date</label>
        <input id="task-date" type="text" placeholder="Select due date" readonly required />
        <div id="calendar-picker" class="calendar-picker" hidden></div>

        <button class="primary-button" type="submit">
          + Add Task
        </button>
      </form>
    </section>

    <section class="tasks-section">
      <h2>My Tasks</h2>

      <div class="filters">
        <button type="button" class="filter-button active"
          data-filter="all">All</button>
        <button type="button" class="filter-button"
          data-filter="pending">Pending</button>
        <button type="button" class="filter-button"
          data-filter="completed">Completed</button>
      </div>

      <div id="task-list"></div>
    </section>
  </main>
`;

const form = document.querySelector('#task-form');
const nameInput = document.querySelector('#task-name');
const dateInput = document.querySelector('#task-date');
const taskList = document.querySelector('#task-list');

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

dateInput.min = getLocalDate();

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function renderTasks() {
  document.querySelector('#total-count').textContent = tasks.length;
  document.querySelector('#pending-count').textContent = tasks.filter(
    (task) => !task.completed
  ).length;
  document.querySelector('#completed-count').textContent = tasks.filter(
    (task) => task.completed
  ).length;

  document.querySelectorAll('.filter-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === currentFilter);
  });

  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === 'pending') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <p>No tasks to show.</p>
        <span>Add a task or choose another filter.</span>
      </div>
    `;
    return;
  }

  taskList.innerHTML = filteredTasks
    .map((task) => {
      const overdue =
        !task.completed && task.date && task.date < getLocalDate();

      return `
      <article class="task-item ${task.completed ? 'completed-task' : ''}">
        <div class="task-details">
          <strong class="task-name">
            ${escapeHTML(task.name)}
          </strong>

          <p class="due-date ${overdue ? 'overdue' : ''}">
            Due: ${escapeHTML(task.date || '')}
            ${overdue ? ' — OVERDUE!' : ''}
          </p>
        </div>

        <label class="done-label">
          <input
            type="checkbox"
            data-id="${escapeHTML(task.id)}"
            ${task.completed ? 'checked' : ''}
          />
          <span>Done</span>
        </label>

        <button
          type="button"
          class="delete-button"
          data-delete-id="${escapeHTML(task.id)}"
        >
          Delete
        </button>
      </article>
    `;
    })
    .join('');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const date = dateInput.value;

  if (!name || !date) return;

  tasks.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    date,
    completed: false,
  });

  saveTasks();
  form.reset();
  dateInput.min = getLocalDate();
  currentFilter = 'all';
  renderTasks();
  nameInput.focus();
});

app.addEventListener('click', (event) => {
  const filterButton = event.target.closest('[data-filter]');

  if (filterButton) {
    currentFilter = filterButton.dataset.filter;
    renderTasks();
    return;
  }

  const deleteButton = event.target.closest('[data-delete-id]');

  if (deleteButton) {
    const id = deleteButton.dataset.deleteId;
    tasks = tasks.filter((task) => String(task.id) !== id);
    saveTasks();
    renderTasks();
  }
});

app.addEventListener('change', (event) => {
  const checkbox = event.target.closest('input[type="checkbox"][data-id]');

  if (!checkbox) return;

  const task = tasks.find((item) => String(item.id) === checkbox.dataset.id);

  if (task) {
    task.completed = checkbox.checked;
    saveTasks();
    renderTasks();
  }
});

renderTasks();
const calendarInput = document.querySelector('#task-date');
const calendarPicker = document.querySelector('#calendar-picker');

let calendarMonth = new Date();
calendarMonth.setDate(1);

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  let daysHTML = '';

  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((day) => {
    daysHTML += `<span class="calendar-weekday">${day}</span>`;
  });

  for (let i = 0; i < firstDay; i++) {
    daysHTML += '<span class="calendar-empty"></span>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;
    const isPastDate = dateString < getLocalDate();
    const isToday = dateString === getLocalDate();

    daysHTML += `
    <button type="button"
    class="calendar-day ${isPastDate ? 'past-date' : ''} ${
      isToday ? 'today-date' : ''
    }"
    data-date="${dateString}">
        ${day}
      </button>
    `;
  }

  calendarPicker.innerHTML = `
    <div class="calendar-heading">
      <button type="button" data-month="-1" aria-label="Previous month">‹</button>
      <strong>${monthName}</strong>
      <button type="button" data-month="1" aria-label="Next month">›</button>
    </div>
    <div class="calendar-grid">${daysHTML}</div>
  `;
}

calendarInput.addEventListener('click', () => {
  calendarPicker.hidden = false;
  renderCalendar();
});

calendarPicker.addEventListener('click', (event) => {
  const monthButton = event.target.closest('[data-month]');

  if (monthButton) {
    calendarMonth.setMonth(
      calendarMonth.getMonth() + Number(monthButton.dataset.month)
    );
    renderCalendar();
    return;
  }

  const dayButton = event.target.closest('[data-date]');

  if (dayButton) {
    calendarInput.value = dayButton.dataset.date;
    calendarPicker.hidden = true;
  }
});

document.addEventListener('click', (event) => {
  if (
    !calendarPicker.contains(event.target) &&
    event.target !== calendarInput
  ) {
    calendarPicker.hidden = true;
  }
});
