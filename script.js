const STORAGE_KEY = "bow-tracker-workouts-v1";
const VIEW_TODAY = "today";
const VIEW_WEEK = "week";

const seedWorkouts = [
  { id: crypto.randomUUID(), name: "Bench Press", sets: 4, day: "Monday", completed: false },
  { id: crypto.randomUUID(), name: "Deadlift", sets: 5, day: "Tuesday", completed: false },
  { id: crypto.randomUUID(), name: "Pull Ups", sets: 3, day: "Wednesday", completed: false },
  { id: crypto.randomUUID(), name: "Shoulder Press", sets: 4, day: "Thursday", completed: false },
  { id: crypto.randomUUID(), name: "Leg Press", sets: 4, day: "Friday", completed: false },
  { id: crypto.randomUUID(), name: "Plank Holds", sets: 3, day: "Saturday", completed: false }
];

const state = {
  workouts: loadWorkouts(),
  view: VIEW_TODAY,
  draggingId: null
};

const nodes = {
  workoutList: document.querySelector("#workoutList"),
  workoutItemTemplate: document.querySelector("#workoutItemTemplate"),
  addWorkoutForm: document.querySelector("#addWorkoutForm"),
  workoutName: document.querySelector("#workoutName"),
  workoutSets: document.querySelector("#workoutSets"),
  workoutDay: document.querySelector("#workoutDay"),
  randomizeBtn: document.querySelector("#randomizeBtn"),
  clearCompletedBtn: document.querySelector("#clearCompletedBtn"),
  todayViewBtn: document.querySelector("#todayViewBtn"),
  weekViewBtn: document.querySelector("#weekViewBtn"),
  emptyState: document.querySelector("#emptyState"),
  completedCount: document.querySelector("#completedCount"),
  remainingCount: document.querySelector("#remainingCount"),
  progressPercent: document.querySelector("#progressPercent"),
  todayLabel: document.querySelector("#todayLabel")
};

init();

function init() {
  updateTodayLabel();
  registerEvents();
  render();
}

function loadWorkouts() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return seedWorkouts;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return seedWorkouts;
    }

    return parsed.map((item) => ({
      id: String(item.id),
      name: String(item.name),
      sets: Number(item.sets) || 1,
      day: String(item.day),
      completed: Boolean(item.completed)
    }));
  } catch {
    return seedWorkouts;
  }
}

function saveWorkouts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.workouts));
}

function registerEvents() {
  nodes.addWorkoutForm.addEventListener("submit", onAddWorkout);
  nodes.randomizeBtn.addEventListener("click", onRandomizeToday);
  nodes.clearCompletedBtn.addEventListener("click", onClearCompleted);

  nodes.todayViewBtn.addEventListener("click", () => setView(VIEW_TODAY));
  nodes.weekViewBtn.addEventListener("click", () => setView(VIEW_WEEK));

  nodes.workoutList.addEventListener("dragover", onDragOver);
  nodes.workoutList.addEventListener("drop", onDrop);
}

function setView(nextView) {
  state.view = nextView;
  nodes.todayViewBtn.classList.toggle("active", nextView === VIEW_TODAY);
  nodes.weekViewBtn.classList.toggle("active", nextView === VIEW_WEEK);
  nodes.todayViewBtn.setAttribute("aria-selected", String(nextView === VIEW_TODAY));
  nodes.weekViewBtn.setAttribute("aria-selected", String(nextView === VIEW_WEEK));
  render();
}

function onAddWorkout(event) {
  event.preventDefault();

  const name = nodes.workoutName.value.trim();
  const sets = Number(nodes.workoutSets.value);
  const selectedDay = nodes.workoutDay.value;
  const day = selectedDay === VIEW_TODAY ? getTodayName() : selectedDay;

  if (!name || !Number.isFinite(sets) || sets < 1) {
    return;
  }

  state.workouts.push({
    id: crypto.randomUUID(),
    name,
    sets,
    day,
    completed: false
  });

  nodes.addWorkoutForm.reset();
  nodes.workoutSets.value = "3";
  nodes.workoutDay.value = VIEW_TODAY;

  saveWorkouts();
  render();
}

function onRandomizeToday() {
  const todayName = getTodayName();
  const todayIndexes = [];

  state.workouts.forEach((workout, index) => {
    if (workout.day === todayName) {
      todayIndexes.push(index);
    }
  });

  if (todayIndexes.length < 2) {
    return;
  }

  const todayPool = todayIndexes.map((index) => state.workouts[index]);
  shuffleArray(todayPool);

  todayIndexes.forEach((index, i) => {
    state.workouts[index] = todayPool[i];
  });

  saveWorkouts();
  render();
}

function onClearCompleted() {
  state.workouts = state.workouts.filter((workout) => !workout.completed);
  saveWorkouts();
  render();
}

function onToggleCompleted(id) {
  const item = state.workouts.find((workout) => workout.id === id);
  if (!item) {
    return;
  }

  item.completed = !item.completed;
  saveWorkouts();
  renderStats();
  renderList();
}

function onDeleteWorkout(id) {
  state.workouts = state.workouts.filter((workout) => workout.id !== id);
  saveWorkouts();
  render();
}

function onDragStart(event, id) {
  state.draggingId = id;
  event.dataTransfer.effectAllowed = "move";
  event.currentTarget.classList.add("dragging");
}

function onDragEnd(event) {
  state.draggingId = null;
  event.currentTarget.classList.remove("dragging");
}

function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function onDrop(event) {
  event.preventDefault();

  const sourceId = state.draggingId;
  const targetRow = event.target.closest(".workout-item");
  const targetId = targetRow?.dataset.id;

  if (!sourceId || !targetId || sourceId === targetId) {
    return;
  }

  const visible = getVisibleWorkouts();
  const sourceVisibleIndex = visible.findIndex((x) => x.id === sourceId);
  const targetVisibleIndex = visible.findIndex((x) => x.id === targetId);

  if (sourceVisibleIndex < 0 || targetVisibleIndex < 0) {
    return;
  }

  const visibleIds = visible.map((x) => x.id);
  visibleIds.splice(sourceVisibleIndex, 1);
  visibleIds.splice(targetVisibleIndex, 0, sourceId);

  const reorderedVisible = visibleIds
    .map((id) => state.workouts.find((workout) => workout.id === id))
    .filter(Boolean);

  const final = [];
  let pointer = 0;

  state.workouts.forEach((workout) => {
    const inCurrentView = isWorkoutInCurrentView(workout);
    if (inCurrentView) {
      final.push(reorderedVisible[pointer]);
      pointer += 1;
    } else {
      final.push(workout);
    }
  });

  state.workouts = final;
  saveWorkouts();
  renderList();
}

function render() {
  renderStats();
  renderList();
}

function renderStats() {
  const visible = getVisibleWorkouts();
  const completed = visible.filter((item) => item.completed).length;
  const remaining = visible.length - completed;
  const progress = visible.length ? Math.round((completed / visible.length) * 100) : 0;

  nodes.completedCount.textContent = String(completed);
  nodes.remainingCount.textContent = String(remaining);
  nodes.progressPercent.textContent = `${progress}%`;
}

function renderList() {
  nodes.workoutList.innerHTML = "";
  const visible = getVisibleWorkouts();

  if (!visible.length) {
    nodes.emptyState.classList.remove("hidden");
    return;
  }

  nodes.emptyState.classList.add("hidden");

  visible.forEach((workout) => {
    const fragment = nodes.workoutItemTemplate.content.cloneNode(true);
    const row = fragment.querySelector(".workout-item");
    const checkbox = fragment.querySelector(".complete-checkbox");
    const name = fragment.querySelector(".workout-name");
    const meta = fragment.querySelector(".workout-meta");
    const deleteBtn = fragment.querySelector(".delete-btn");

    row.dataset.id = workout.id;
    row.classList.toggle("completed", workout.completed);

    checkbox.checked = workout.completed;
    checkbox.addEventListener("change", () => onToggleCompleted(workout.id));

    name.textContent = workout.name;
    meta.textContent = `${workout.sets} set${workout.sets > 1 ? "s" : ""} - ${workout.day}`;

    deleteBtn.addEventListener("click", () => onDeleteWorkout(workout.id));

    row.addEventListener("dragstart", (event) => onDragStart(event, workout.id));
    row.addEventListener("dragend", onDragEnd);

    nodes.workoutList.appendChild(fragment);
  });
}

function getVisibleWorkouts() {
  if (state.view === VIEW_WEEK) {
    return [...state.workouts];
  }

  const todayName = getTodayName();
  return state.workouts.filter((workout) => workout.day === todayName);
}

function isWorkoutInCurrentView(workout) {
  if (state.view === VIEW_WEEK) {
    return true;
  }

  return workout.day === getTodayName();
}

function updateTodayLabel() {
  const now = new Date();
  nodes.todayLabel.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function getTodayName() {
  return new Date().toLocaleDateString(undefined, { weekday: "long" });
}

function shuffleArray(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}
