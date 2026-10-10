(() => {
  "use strict";

  const exercises = document.getElementById("workoutExercises");
  const panel = document.getElementById("restTimer");
  if (!exercises || !panel) return;

  const $ = (id) => document.getElementById(id);
  const prefsKey = "forma-rest-prefs-v1";
  const sessionKey = "forma-active-rest-v1";
  const autoOption = $("autoRestEnabled");
  const soundOption = $("restSoundEnabled");
  const transitionOption = $("restExerciseSeconds");
  const timeLabel = $("restTimeRemaining");
  const restLabel = $("restTargetLabel");
  const restStatus = $("restStatus");
  const bar = $("restProgress");
  const pauseButton = $("restPause");
  const plusButton = $("restPlus");
  const doneButton = $("restDone");
  const closeButton = $("restClose");
  const defaultPrefs = { auto: true, sound: true, transition: 180 };

  function parseStored(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === "object" ? value : fallback;
    } catch {
      return fallback;
    }
  }
  function saveStored(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be unavailable */ }
  }
  const savedPrefs = parseStored(prefsKey, {});
  const prefs = {
    auto: typeof savedPrefs.auto === "boolean" ? savedPrefs.auto : defaultPrefs.auto,
    sound: typeof savedPrefs.sound === "boolean" ? savedPrefs.sound : defaultPrefs.sound,
    transition: [120, 150, 180, 240, 300].includes(Number(savedPrefs.transition)) ?
      Number(savedPrefs.transition) : defaultPrefs.transition
  };
  autoOption.checked = prefs.auto;
  soundOption.checked = prefs.sound;
  transitionOption.value = String(prefs.transition);

  let audioContext = null;
  let intervalId = null;
  const debounces = new WeakMap();
  let rest = { state: "idle", deadline: 0, remaining: 0, duration: 0, label: "", startedAt: 0 };

  function unlockSound() {
    if (!prefs.sound || audioContext) {
      if (audioContext && audioContext.state === "suspended") audioContext.resume().catch(() => {});
      return;
    }
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audioContext = new Context();
      if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    } catch { /* audio is optional */ }
  }
  function finishSound() {
    if (!prefs.sound || document.visibilityState !== "visible") return;
    try {
      unlockSound();
      if (audioContext && audioContext.state === "running") {
        const now = audioContext.currentTime;
        [0, 0.22].forEach((offset) => {
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = offset ? 990 : 780;
          gain.gain.setValueAtTime(0.0001, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.13, now + offset + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.start(now + offset);
          oscillator.stop(now + offset + 0.17);
        });
      }
    } catch { /* silent operation when browser blocks audio */ }
    if (navigator.vibrate) navigator.vibrate([130, 80, 130]);
  }
  function formatTime(ms) {
    const seconds = Math.ceil(Math.max(0, ms) / 1000);
    return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" +
      String(seconds % 60).padStart(2, "0");
  }
  function remainingNow() {
    return rest.state === "running" ? Math.max(0, rest.deadline - Date.now()) :
      Math.max(0, rest.remaining);
  }
  function storeRest() {
    if (rest.state === "idle" || rest.state === "finished") {
      try { localStorage.removeItem(sessionKey); } catch {}
    } else {
      saveStored(sessionKey, rest);
    }
  }
  function paint() {
    panel.classList.toggle("hidden", rest.state === "idle");
    if (rest.state === "idle") return;
    const remaining = remainingNow();
    timeLabel.textContent = formatTime(remaining);
    restLabel.textContent = rest.label;
    const finished = rest.state === "finished";
    restStatus.textContent = finished ? "Przerwa zakończona — możesz zaczynać" :
      rest.state === "paused" ? "Wstrzymano" : "Odpoczynek";
    bar.style.width = (rest.duration ? 100 * (1 - Math.min(1, remaining / rest.duration)) : 100) + "%";
    pauseButton.textContent = rest.state === "paused" ? "Wznów" : "Pauza";
    pauseButton.disabled = finished;
    plusButton.disabled = finished;
    doneButton.classList.toggle("hidden", finished);
    closeButton.textContent = finished ? "Zamknij" : "Anuluj";
    panel.classList.toggle("rest-complete", finished);
  }
  function stopInterval() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
  function completeRest(play = true) {
    stopInterval();
    rest.state = "finished";
    rest.deadline = 0;
    rest.remaining = 0;
    storeRest();
    paint();
    if (play) finishSound();
  }
  function tick() {
    if (rest.state !== "running") return;
    if (remainingNow() <= 0) completeRest();
    else paint();
  }
  function startTicker() {
    stopInterval();
    intervalId = setInterval(tick, 250);
  }
  function startRest(seconds, label) {
    const duration = Math.min(600, Math.max(30, Number(seconds) || 120)) * 1000;
    rest = {
      state: "running", deadline: Date.now() + duration, remaining: duration,
      duration, label, startedAt: Date.now()
    };
    storeRest();
    paint();
    startTicker();
  }
  function clearRest() {
    stopInterval();
    rest.state = "idle";
    storeRest();
    paint();
  }
  function afterReps(row) {
    if (!prefs.auto || !row.isConnected || row.dataset.restStarted === "1") return;
    const reps = row.querySelector(".set-reps");
    const val = reps && reps.value.trim();
    if (!val || !Number.isInteger(Number(val)) || Number(val) <= 0) return;
    const card = row.closest(".exercise-card");
    if (!card) return;
    const rows = Array.from(card.querySelectorAll(".set-row.data"));
    const cards = Array.from(exercises.querySelectorAll(".exercise-card"));
    const rowIndex = rows.indexOf(row);
    const cardIndex = cards.indexOf(card);
    if (rowIndex < 0 || cardIndex < 0) return;
    const lastSet = rowIndex === rows.length - 1;
    const nextCard = lastSet ? cards[cardIndex + 1] : null;
    const name = card.dataset.name || "ćwiczenie";
    row.dataset.restStarted = "1";
    if (lastSet && !nextCard) {
      rest = {state: "finished", deadline: 0, remaining: 0, duration: 0,
        label: "Wszystkie zaplanowane ćwiczenia zakończone", startedAt: Date.now()};
      stopInterval();
      storeRest();
      paint();
      finishSound();
      return;
    }
    const seconds = lastSet ? prefs.transition : Number(card.dataset.restseconds || 120);
    const target = lastSet ? "Następne ćwiczenie: " + (nextCard.dataset.name || "kolejne") :
      "Kolejna seria: " + name + " (" + (rowIndex + 2) + "/" + rows.length + ")";
    startRest(seconds, target);
  }

  exercises.addEventListener("focusin", (ev) => {
    if (ev.target.matches(".set-reps")) unlockSound();
  });
  exercises.addEventListener("input", (ev) => {
    if (!ev.target.matches(".set-reps")) return;
    const row = ev.target.closest(".set-row.data");
    if (!row) return;
    const old = debounces.get(row);
    if (old) clearTimeout(old);
    if (ev.target.value.trim() === "") {
      delete row.dataset.restStarted;
      return;
    }
    if (!prefs.auto || row.dataset.restStarted === "1") return;
    debounces.set(row, setTimeout(() => afterReps(row), 900));
  });
  exercises.addEventListener("change", (ev) => {
    if (!ev.target.matches(".set-reps")) return;
    const row = ev.target.closest(".set-row.data");
    if (!row) return;
    const pending = debounces.get(row);
    if (pending) clearTimeout(pending);
    afterReps(row);
  });
  autoOption.addEventListener("change", () => {
    prefs.auto = autoOption.checked;
    saveStored(prefsKey, prefs);
    if (!prefs.auto) clearRest();
  });
  soundOption.addEventListener("change", () => {
    prefs.sound = soundOption.checked;
    saveStored(prefsKey, prefs);
    if (prefs.sound) unlockSound();
  });
  transitionOption.addEventListener("change", () => {
    prefs.transition = Number(transitionOption.value) || 180;
    saveStored(prefsKey, prefs);
  });
  pauseButton.addEventListener("click", () => {
    if (rest.state === "running") {
      rest.remaining = remainingNow();
      rest.state = "paused";
      stopInterval();
    } else if (rest.state === "paused") {
      rest.deadline = Date.now() + rest.remaining;
      rest.state = "running";
      startTicker();
    }
    storeRest();
    paint();
  });
  plusButton.addEventListener("click", () => {
    if (rest.state === "running") rest.deadline += 30000;
    if (rest.state === "paused") rest.remaining += 30000;
    if (rest.state === "running" || rest.state === "paused") rest.duration += 30000;
    storeRest();
    paint();
  });
  doneButton.addEventListener("click", () => completeRest(false));
  closeButton.addEventListener("click", clearRest);
  ["workoutDaySelect", "jDate", "saveDetailedWorkout", "signOutBtn"].forEach((id) => {
    const node = $(id);
    if (node) node.addEventListener(id === "saveDetailedWorkout" || id === "signOutBtn" ? "click" : "change", clearRest);
  });
  document.addEventListener("visibilitychange", tick);
  window.addEventListener("pageshow", tick);
  const previous = parseStored(sessionKey, null);
  if (previous && ["running", "paused"].includes(previous.state) &&
    Date.now() - Number(previous.startedAt || 0) < 2 * 60 * 60 * 1000 &&
    Number(previous.duration) > 0) {
    rest = previous;
    if (rest.state === "running") {
      tick();
      if (rest.state === "running") startTicker();
    } else paint();
  } else {
    clearRest();
  }
})();