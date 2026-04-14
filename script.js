const STORAGE_KEY = "bow-tracker-workouts-v1";
const VIEW_TODAY = "today";
const VIEW_WEEK = "week";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const PRESET_ROUTINES = [
  {
    id: "beginner-strength",
    name: "Beginner Strength",
    description: "A balanced three-day plan for building consistency and learning the basics.",
    workouts: [
      { name: "Goblet Squat", sets: 3, day: "Monday" },
      { name: "Bench Press", sets: 4, day: "Monday" },
      { name: "Seated Row", sets: 3, day: "Monday" },
      { name: "Romanian Deadlift", sets: 3, day: "Wednesday" },
      { name: "Dumbbell Shoulder Press", sets: 3, day: "Wednesday" },
      { name: "Lat Pulldown", sets: 3, day: "Wednesday" },
      { name: "Leg Press", sets: 4, day: "Friday" },
      { name: "Incline Dumbbell Press", sets: 3, day: "Friday" },
      { name: "Plank Holds", sets: 3, day: "Friday" }
    ]
  },
  {
    id: "push-pull-legs",
    name: "Push Pull Legs",
    description: "A classic split that spreads volume across the week and is easy to expand.",
    workouts: [
      { name: "Barbell Bench Press", sets: 4, day: "Monday" },
      { name: "Incline Dumbbell Press", sets: 3, day: "Monday" },
      { name: "Cable Lateral Raise", sets: 3, day: "Monday" },
      { name: "Barbell Row", sets: 4, day: "Wednesday" },
      { name: "Pull Ups", sets: 3, day: "Wednesday" },
      { name: "Hammer Curl", sets: 3, day: "Wednesday" },
      { name: "Back Squat", sets: 4, day: "Friday" },
      { name: "Romanian Deadlift", sets: 3, day: "Friday" },
      { name: "Walking Lunges", sets: 3, day: "Friday" }
    ]
  },
  {
    id: "upper-lower",
    name: "Upper Lower Split",
    description: "Four focused sessions with clear upper and lower body emphasis.",
    workouts: [
      { name: "Bench Press", sets: 4, day: "Monday" },
      { name: "Chest Supported Row", sets: 4, day: "Monday" },
      { name: "Cable Fly", sets: 3, day: "Monday" },
      { name: "Back Squat", sets: 4, day: "Tuesday" },
      { name: "Leg Curl", sets: 3, day: "Tuesday" },
      { name: "Standing Calf Raise", sets: 4, day: "Tuesday" },
      { name: "Overhead Press", sets: 4, day: "Thursday" },
      { name: "Lat Pulldown", sets: 3, day: "Thursday" },
      { name: "Triceps Pressdown", sets: 3, day: "Thursday" },
      { name: "Deadlift", sets: 4, day: "Friday" },
      { name: "Bulgarian Split Squat", sets: 3, day: "Friday" },
      { name: "Hanging Knee Raise", sets: 3, day: "Friday" }
    ]
  }
];

const seedWorkouts = [
  createWorkout("Bench Press", 4, "Monday"),
  createWorkout("Deadlift", 5, "Tuesday"),
  createWorkout("Pull Ups", 3, "Wednesday"),
  createWorkout("Shoulder Press", 4, "Thursday"),
  createWorkout("Leg Press", 4, "Friday"),
  createWorkout("Plank Holds", 3, "Saturday")
];

const state = {
  workouts: loadWorkouts(),
  view: VIEW_TODAY,
  draggingId: null,
  editingId: null
};

const nodes = {
  addWorkoutForm: document.querySelector("#addWorkoutForm"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  clearProgressBtn: document.querySelector("#resetProgressBtn"),
  completedCount: document.querySelector("#completedCount"),
  emptyState: document.querySelector("#emptyState"),
  focusMeta: document.querySelector("#focusMeta"),
  focusTitle: document.querySelector("#focusTitle"),
  formModeLabel: document.querySelector("#formModeLabel"),
  formTitle: document.querySelector("#formTitle"),
  listTitle: document.querySelector("#listTitle"),
  presetFeedback: document.querySelector("#presetFeedback"),
  presetLibrary: document.querySelector("#presetLibrary"),
  progressBar: document.querySelector("#progressBar"),
  progressDetail: document.querySelector("#progressDetail"),
  progressPercent: document.querySelector("#progressPercent"),
  randomizeBtn: document.querySelector("#randomizeBtn"),
  remainingCount: document.querySelector("#remainingCount"),
  submitWorkoutBtn: document.querySelector("#submitWorkoutBtn"),
  todayLabel: document.querySelector("#todayLabel"),
  todayOption: document.querySelector("#todayOption"),
  todayViewBtn: document.querySelector("#todayViewBtn"),
  viewCaption: document.querySelector("#viewCaption"),
  weekViewBtn: document.querySelector("#weekViewBtn"),
  workoutDay: document.querySelector("#workoutDay"),
  workoutItemTemplate: document.querySelector("#workoutItemTemplate"),
  workoutList: document.querySelector("#workoutList"),
  workoutName: document.querySelector("#workoutName"),
  workoutSets: document.querySelector("#workoutSets")
};

init();

function init() {
  updateTodayLabel();
  registerEvents();
  renderPresetLibrary();
  render();
}

function createWorkout(name, sets, day) {
  return {
    id: createId(),
    name,
    sets,
    day,
    lastCompletedOn: null
  };
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadWorkouts() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [...seedWorkouts];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...seedWorkouts];
    }

    const workouts = parsed
      .map((item) => normalizeWorkout(item))
      .filter((item) => item !== null);

    return workouts.length ? workouts : [...seedWorkouts];
  } catch {
    return [...seedWorkouts];
  }
}

function normalizeWorkout(item) {
  const name = String(item?.name ?? "").trim();
  const day = DAYS.includes(String(item?.day)) ? String(item.day) : getTodayName();

  if (!name) {
    return null;
  }

  let lastCompletedOn = null;

  if (isIsoDate(item?.lastCompletedOn)) {
    lastCompletedOn = item.lastCompletedOn;
  } else if (item?.completed === true) {
    lastCompletedOn = getScheduledDateIso(day);
  }

  return {
    id: String(item?.id || createId()),
    name,
    sets: clampSets(Number(item?.sets)),
    day,
    lastCompletedOn
  };
}

function saveWorkouts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.workouts));
}

function registerEvents() {
  nodes.addWorkoutForm.addEventListener("submit", onSubmitWorkout);
  nodes.cancelEditBtn.addEventListener("click", cancelEditing);
  nodes.clearProgressBtn.addEventListener("click", onResetProgress);
  nodes.randomizeBtn.addEventListener("click", onRandomizeToday);
  nodes.todayViewBtn.addEventListener("click", () => setView(VIEW_TODAY));
  nodes.weekViewBtn.addEventListener("click", () => setView(VIEW_WEEK));
  window.addEventListener("storage", onStorageSync);
}

function onStorageSync(event) {
  if (event.key !== STORAGE_KEY) {
    return;
  }

  state.workouts = loadWorkouts();
  cancelEditing({ focusForm: false });
  render();
}

function setView(nextView) {
  if (state.view === nextView) {
    return;
  }

  state.view = nextView;
  render();
}

function onSubmitWorkout(event) {
  event.preventDefault();

  const name = nodes.workoutName.value.trim();
  const sets = clampSets(Number(nodes.workoutSets.value));
  const chosenDay = nodes.workoutDay.value === VIEW_TODAY ? getTodayName() : nodes.workoutDay.value;

  if (!name || !DAYS.includes(chosenDay)) {
    return;
  }

  if (state.editingId) {
    const current = state.workouts.find((workout) => workout.id === state.editingId);

    if (!current) {
      cancelEditing({ focusForm: false });
      return;
    }

    current.name = name;
    current.sets = sets;

    if (current.day !== chosenDay) {
      current.day = chosenDay;
      current.lastCompletedOn = null;
    }
  } else {
    state.workouts.push({
      id: createId(),
      name,
      sets,
      day: chosenDay,
      lastCompletedOn: null
    });
  }

  saveWorkouts();
  cancelEditing({ focusForm: false });
  render();
}

function onRandomizeToday() {
  const todayName = getTodayName();
  const todayWorkouts = state.workouts.filter((workout) => workout.day === todayName);

  if (todayWorkouts.length < 2) {
    return;
  }

  shuffleArray(todayWorkouts);

  const reordered = [];
  let todayIndex = 0;

  state.workouts.forEach((workout) => {
    if (workout.day === todayName) {
      reordered.push(todayWorkouts[todayIndex]);
      todayIndex += 1;
      return;
    }

    reordered.push(workout);
  });

  state.workouts = reordered;
  saveWorkouts();
  renderList();
  renderSummary();
}

function onResetProgress() {
  const visible = getVisibleWorkouts();

  visible.forEach((workout) => {
    if (isWorkoutCompleted(workout)) {
      workout.lastCompletedOn = null;
    }
  });

  saveWorkouts();
  render();
}

function onToggleCompleted(id) {
  const workout = state.workouts.find((item) => item.id === id);

  if (!workout) {
    return;
  }

  workout.lastCompletedOn = isWorkoutCompleted(workout) ? null : getScheduledDateIso(workout.day);
  saveWorkouts();
  render();
}

function onEditWorkout(id) {
  const workout = state.workouts.find((item) => item.id === id);

  if (!workout) {
    return;
  }

  state.editingId = id;
  nodes.workoutName.value = workout.name;
  nodes.workoutSets.value = String(workout.sets);
  nodes.workoutDay.value = workout.day;
  renderFormState();
  nodes.workoutName.focus();
}

function onDeleteWorkout(id) {
  const workout = state.workouts.find((item) => item.id === id);

  if (!workout) {
    return;
  }

  const confirmed = window.confirm(`Delete "${workout.name}" from your routine?`);
  if (!confirmed) {
    return;
  }

  state.workouts = state.workouts.filter((item) => item.id !== id);

  if (state.editingId === id) {
    cancelEditing({ focusForm: false });
  }

  saveWorkouts();
  render();
}

function onUsePreset(presetId) {
  const preset = PRESET_ROUTINES.find((item) => item.id === presetId);

  if (!preset) {
    return;
  }

  const imported = preset.workouts.map((workout) => ({
    id: createId(),
    name: workout.name,
    sets: clampSets(workout.sets),
    day: workout.day,
    lastCompletedOn: null
  }));

  state.workouts.push(...imported);
  saveWorkouts();
  showPresetFeedback(`Added ${preset.name} with ${imported.length} workouts.`);
  render();
}

function showPresetFeedback(message) {
  nodes.presetFeedback.textContent = message;
  nodes.presetFeedback.classList.remove("hidden");
}

function renderPresetLibrary() {
  nodes.presetLibrary.innerHTML = "";

  PRESET_ROUTINES.forEach((preset) => {
    const card = document.createElement("article");
    const header = document.createElement("div");
    const kicker = document.createElement("p");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const meta = document.createElement("p");
    const list = document.createElement("ul");
    const button = document.createElement("button");

    card.className = "preset-card";
    header.className = "preset-card-header";
    kicker.className = "card-kicker";
    title.className = "preset-card-title";
    description.className = "preset-card-copy";
    meta.className = "preset-meta";
    list.className = "preset-list";
    button.className = "btn btn-primary preset-action";
    button.type = "button";

    kicker.textContent = "Starter Routine";
    title.textContent = preset.name;
    description.textContent = preset.description;
    meta.textContent = `${preset.workouts.length} workouts across ${countPresetDays(preset)} days`;

    getPresetPreviewItems(preset).forEach((workout) => {
      const item = document.createElement("li");
      item.textContent = `${workout.day}: ${workout.name} (${workout.sets} sets)`;
      list.appendChild(item);
    });

    button.textContent = "Add to routine";
    button.addEventListener("click", () => onUsePreset(preset.id));

    header.append(kicker, title, description);
    card.append(header, meta, list, button);
    nodes.presetLibrary.appendChild(card);
  });
}

function countPresetDays(preset) {
  return new Set(preset.workouts.map((workout) => workout.day)).size;
}

function getPresetPreviewItems(preset) {
  return preset.workouts.slice(0, 4);
}

function cancelEditing(options = {}) {
  const { focusForm = true } = options;

  state.editingId = null;
  nodes.addWorkoutForm.reset();
  nodes.workoutSets.value = "3";
  nodes.workoutDay.value = VIEW_TODAY;
  renderFormState();

  if (focusForm) {
    nodes.workoutName.focus();
  }
}

function render() {
  updateTodayLabel();
  renderViewState();
  renderFormState();
  renderSummary();
  renderStats();
  renderList();
}

function renderViewState() {
  const todayName = getTodayName();

  nodes.todayViewBtn.classList.toggle("active", state.view === VIEW_TODAY);
  nodes.weekViewBtn.classList.toggle("active", state.view === VIEW_WEEK);
  nodes.todayViewBtn.setAttribute("aria-selected", String(state.view === VIEW_TODAY));
  nodes.weekViewBtn.setAttribute("aria-selected", String(state.view === VIEW_WEEK));

  nodes.viewCaption.textContent =
    state.view === VIEW_TODAY
      ? `Showing ${todayName}'s plan.`
      : `Showing the full week of ${getWeekRangeLabel()}.`;

  nodes.listTitle.textContent =
    state.view === VIEW_TODAY ? `${todayName}'s workouts` : "This week's workout split";
}

function renderFormState() {
  const isEditing = Boolean(state.editingId);

  nodes.formModeLabel.textContent = isEditing ? "Edit Workout" : "Build Routine";
  nodes.formTitle.textContent = isEditing ? "Update your plan" : "Add a workout";
  nodes.submitWorkoutBtn.textContent = isEditing ? "Save changes" : "Add workout";
  nodes.cancelEditBtn.classList.toggle("hidden", !isEditing);
}

function renderSummary() {
  const todayName = getTodayName();
  const todayWorkouts = state.workouts.filter((workout) => workout.day === todayName);
  const completedToday = todayWorkouts.filter((workout) => isWorkoutCompleted(workout)).length;
  const remainingToday = todayWorkouts.length - completedToday;
  const nextWorkout = todayWorkouts.find((workout) => !isWorkoutCompleted(workout));

  if (!todayWorkouts.length) {
    nodes.focusTitle.textContent = "Rest day or add a plan";
    nodes.focusMeta.textContent =
      "Nothing is scheduled for today yet. Add a workout above or import a preset routine.";
  } else if (!remainingToday) {
    nodes.focusTitle.textContent = "Today's work is done";
    nodes.focusMeta.textContent = `${todayWorkouts.length} workouts checked off for ${todayName}.`;
  } else {
    nodes.focusTitle.textContent = nextWorkout?.name || `${remainingToday} workouts left`;
    nodes.focusMeta.textContent = `${remainingToday} of ${todayWorkouts.length} workouts are still waiting for ${todayName}.`;
  }

  const todayCount = todayWorkouts.length;
  const completedVisible = getVisibleWorkouts().filter((workout) => isWorkoutCompleted(workout)).length;

  nodes.randomizeBtn.disabled = todayCount < 2;
  nodes.clearProgressBtn.disabled = completedVisible === 0;
  nodes.clearProgressBtn.textContent = state.view === VIEW_TODAY ? "Reset Today" : "Reset Week";
}

function renderStats() {
  const visible = getVisibleWorkouts();
  const completed = visible.filter((workout) => isWorkoutCompleted(workout)).length;
  const remaining = visible.length - completed;
  const progress = visible.length ? Math.round((completed / visible.length) * 100) : 0;

  nodes.completedCount.textContent = String(completed);
  nodes.remainingCount.textContent = String(remaining);
  nodes.progressPercent.textContent = `${progress}%`;
  nodes.progressDetail.textContent = visible.length
    ? `${completed} of ${visible.length} workouts checked off`
    : "No workouts in this view yet";
  nodes.progressBar.style.width = `${progress}%`;
}

function renderList() {
  nodes.workoutList.innerHTML = "";

  const groups = getGroupsForCurrentView();
  const visibleCount = groups.reduce((count, group) => count + group.items.length, 0);

  if (!visibleCount) {
    nodes.emptyState.classList.remove("hidden");
    nodes.emptyState.textContent =
      state.view === VIEW_TODAY
        ? `No workouts scheduled for ${getTodayName()} yet. Add one above or import a pre-made routine.`
        : "No workouts in your weekly split yet. Add a few sessions or start with a pre-made routine.";
    return;
  }

  nodes.emptyState.classList.add("hidden");

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "day-group";

    const header = document.createElement("header");
    header.className = "day-header";

    const headingWrap = document.createElement("div");
    const title = document.createElement("h3");
    const meta = document.createElement("p");

    title.className = "day-name";
    meta.className = "day-meta";
    title.textContent = `${group.day} - ${formatMonthDay(getDateForWeekday(group.day))}`;

    const doneCount = group.items.filter((workout) => isWorkoutCompleted(workout)).length;
    meta.textContent = `${doneCount}/${group.items.length} complete`;

    headingWrap.append(title, meta);

    const hint = document.createElement("p");
    hint.className = "day-meta";
    hint.textContent = group.day === getTodayName() ? "Today" : "Scheduled";

    header.append(headingWrap, hint);

    const list = document.createElement("ul");
    list.className = "day-list";

    group.items.forEach((workout) => {
      list.appendChild(buildWorkoutRow(workout));
    });

    section.append(header, list);
    nodes.workoutList.appendChild(section);
  });
}

function buildWorkoutRow(workout) {
  const fragment = nodes.workoutItemTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".workout-item");
  const checkbox = fragment.querySelector(".complete-checkbox");
  const name = fragment.querySelector(".workout-name");
  const meta = fragment.querySelector(".workout-meta");
  const editBtn = fragment.querySelector(".edit-btn");
  const deleteBtn = fragment.querySelector(".delete-btn");
  const completed = isWorkoutCompleted(workout);

  row.dataset.id = workout.id;
  row.dataset.day = workout.day;
  row.classList.toggle("completed", completed);

  checkbox.checked = completed;
  checkbox.setAttribute("aria-label", `Mark ${workout.name} complete`);
  checkbox.addEventListener("change", () => onToggleCompleted(workout.id));

  name.textContent = workout.name;
  meta.textContent = buildWorkoutMeta(workout, completed);

  editBtn.addEventListener("click", () => onEditWorkout(workout.id));
  deleteBtn.addEventListener("click", () => onDeleteWorkout(workout.id));

  row.addEventListener("dragstart", (event) => onDragStart(event, workout.id));
  row.addEventListener("dragend", onDragEnd);
  row.addEventListener("dragover", onDragOver);
  row.addEventListener("drop", onDrop);

  return row;
}

function buildWorkoutMeta(workout, completed) {
  const setLabel = `${workout.sets} set${workout.sets === 1 ? "" : "s"}`;
  const dayLabel = state.view === VIEW_TODAY ? workout.day : formatMonthDay(getDateForWeekday(workout.day));
  const status = completed ? "checked off" : "ready";

  return `${setLabel} - ${dayLabel} - ${status}`;
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

  const targetRow = event.currentTarget;
  const sourceId = state.draggingId;
  const targetId = targetRow.dataset.id;

  if (!sourceId || !targetId || sourceId === targetId) {
    return;
  }

  const sourceWorkout = state.workouts.find((workout) => workout.id === sourceId);
  const targetWorkout = state.workouts.find((workout) => workout.id === targetId);

  if (!sourceWorkout || !targetWorkout || sourceWorkout.day !== targetWorkout.day) {
    return;
  }

  reorderWithinDay(sourceWorkout.day, sourceId, targetId);
  state.draggingId = null;
  saveWorkouts();
  renderList();
}

function reorderWithinDay(day, sourceId, targetId) {
  const dayWorkouts = state.workouts.filter((workout) => workout.day === day);
  const sourceIndex = dayWorkouts.findIndex((workout) => workout.id === sourceId);
  const targetIndex = dayWorkouts.findIndex((workout) => workout.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0) {
    return;
  }

  const reordered = [...dayWorkouts];
  const [moved] = reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, moved);

  const next = [];
  let pointer = 0;

  state.workouts.forEach((workout) => {
    if (workout.day === day) {
      next.push(reordered[pointer]);
      pointer += 1;
      return;
    }

    next.push(workout);
  });

  state.workouts = next;
}

function getGroupsForCurrentView() {
  if (state.view === VIEW_TODAY) {
    const todayName = getTodayName();
    return [
      {
        day: todayName,
        items: state.workouts.filter((workout) => workout.day === todayName)
      }
    ];
  }

  return DAYS.map((day) => ({
    day,
    items: state.workouts.filter((workout) => workout.day === day)
  })).filter((group) => group.items.length);
}

function getVisibleWorkouts() {
  return getGroupsForCurrentView().flatMap((group) => group.items);
}

function isWorkoutCompleted(workout) {
  return workout.lastCompletedOn === getScheduledDateIso(workout.day);
}

function updateTodayLabel() {
  const today = new Date();
  nodes.todayLabel.textContent = `${formatLongDate(today)} - Week of ${formatMonthDay(getStartOfWeek(today))}`;
  nodes.todayOption.textContent = `Today (${getTodayName()})`;
}

function getTodayName() {
  const dayIndex = new Date().getDay();
  return DAYS[dayIndex === 0 ? 6 : dayIndex - 1];
}

function getScheduledDateIso(day) {
  return formatIsoDate(getDateForWeekday(day));
}

function getDateForWeekday(day, anchorDate = new Date()) {
  const weekStart = getStartOfWeek(anchorDate);
  const index = DAYS.indexOf(day);
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + index);
  return date;
}

function getStartOfWeek(anchorDate = new Date()) {
  const date = new Date(anchorDate);
  date.setHours(0, 0, 0, 0);

  const day = date.getDay();
  const shift = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + shift);
  return date;
}

function getWeekRangeLabel() {
  const start = getStartOfWeek();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${formatMonthDay(start)} - ${formatMonthDay(end)}`;
}

function formatLongDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function formatMonthDay(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function clampSets(value) {
  if (!Number.isFinite(value)) {
    return 3;
  }

  return Math.min(20, Math.max(1, Math.round(value)));
}

function shuffleArray(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}
