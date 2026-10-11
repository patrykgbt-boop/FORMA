(() => {
  "use strict";

  const toggle = document.getElementById("restPushToggle");
  const test = document.getElementById("restPushTest");
  const status = document.getElementById("restPushStatus");
  if (!toggle || !test || !status) return;

  const DEVICE_KEY = "forma-push-device-id-v1";
  const ENABLED_KEY = "forma-push-enabled-v1";
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId || !/^[0-9a-f-]{36}$/i.test(deviceId)) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  let publicKey = null;
  let enabled = false;
  let busy = false;
  let operationQueue = Promise.resolve();

  function supported() {
    return window.isSecureContext && "serviceWorker" in navigator &&
      "PushManager" in window && "Notification" in window;
  }
  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function isInstalled() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      navigator.standalone === true;
  }
  function setMessage(message, error = false) {
    status.textContent = message;
    status.style.color = error ? "#fca5a5" : "";
  }
  function draw() {
    toggle.disabled = busy || (!enabled && !publicKey);
    toggle.textContent = enabled ? "Wyłącz powiadomienia w tle" :
      busy ? "Przygotowywanie…" : "Włącz powiadomienia w tle";
    test.classList.toggle("hidden", !enabled);
    test.disabled = busy;
  }
  function base64urlToBytes(base64) {
    const safe = base64.replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(safe + "=".repeat((4 - safe.length % 4) % 4));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }
  async function call(action, body = {}) {
    const getToken = window.FORMA_PUSH_AUTH;
    if (typeof getToken !== "function") throw new Error("FORMA nie jest gotowa.");
    const token = await getToken();
    if (!token) throw new Error("Zaloguj się do FORMY.");
    const res = await fetch(window.FORMA_PUSH_API_URL, {
      method: "POST",
      keepalive: true,
      headers: {
        "Authorization": "Bearer " + token,
        "apikey": window.FORMA_PUSH_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, deviceId, ...body }),
    });
    let answer = {};
    try { answer = await res.json(); } catch {}
    if (!res.ok) throw new Error(answer.error || "Błąd serwera powiadomień (" + res.status + ").");
    return answer;
  }
  function queue(operation) {
    const next = operationQueue.then(operation, operation);
    operationQueue = next.catch(() => {});
    return next;
  }
  async function workerRegistration() {
    await navigator.serviceWorker.register("/sw.js");
    return navigator.serviceWorker.ready;
  }
  async function refresh() {
    if (busy) return;
    busy = true;
    draw();
    try {
      if (isIOS() && !isInstalled()) {
        enabled = false;
        publicKey = null;
        setMessage("Na iPhonie: otwórz FORMĘ z ekranu początkowego, nie w karcie Safari.");
        return;
      }
      if (!supported()) {
        enabled = false;
        publicKey = null;
        setMessage("Ta przeglądarka nie obsługuje powiadomień Web Push.", true);
        return;
      }
      if (Notification.permission === "denied") {
        enabled = false;
        setMessage("Powiadomienia są zablokowane. Włącz je w Ustawieniach iPhone’a → Powiadomienia → FORMA.", true);
        return;
      }
      const data = await call("config");
      if (!data.publicKey || typeof data.publicKey !== "string") {
        throw new Error("Brak klucza powiadomień.");
      }
      publicKey = data.publicKey;
      const registration = await workerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (Notification.permission === "granted" && subscription &&
          localStorage.getItem(ENABLED_KEY) === "1") {
        await call("register", { subscription: subscription.toJSON() });
        enabled = true;
        window.dispatchEvent(new Event("forma:push-enabled"));
        setMessage("Powiadomienia aktywne: FORMA przypomni o końcu przerwy także po zablokowaniu ekranu.");
      } else {
        enabled = false;
        localStorage.removeItem(ENABLED_KEY);
        setMessage("Włącz powiadomienia i zezwól na nie w iOS. Alarm może być opóźniony przez sieć lub system.");
      }
    } catch (err) {
      console.warn("FORMA push initialization:", err);
      enabled = false;
      setMessage("Nie udało się połączyć z serwerem powiadomień. Spróbuj ponownie, gdy będziesz online.", true);
    } finally {
      busy = false;
      draw();
    }
  }
  async function enable() {
    if (!supported() || !publicKey || busy) return;
    busy = true; draw();
    try {
      // This permission request must happen directly in the user's tap handler.
      let permission = Notification.permission;
      if (permission !== "granted") permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Nie zezwolono na powiadomienia. Możesz ponowić próbę w ustawieniach.", true);
        return;
      }
      const registration = await workerRegistration();
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64urlToBytes(publicKey),
        });
      }
      await call("register", { subscription: subscription.toJSON() });
      enabled = true;
      localStorage.setItem(ENABLED_KEY, "1");
      window.dispatchEvent(new Event("forma:push-enabled"));
      setMessage("Włączone! Po ukończeniu serii możesz zablokować ekran. Aby sprawdzić dostarczanie, wybierz „Wyślij test”.");
    } catch (err) {
      console.error("FORMA push enable:", err);
      enabled = false;
      setMessage("Nie udało się włączyć powiadomień: " + (err.message || "błąd systemu"), true);
    } finally {
      busy = false; draw();
    }
  }
  async function disable() {
    if (busy) return;
    busy = true; draw();
    try {
      await queue(() => call("unregister"));
      const registration = await workerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
      enabled = false;
      localStorage.removeItem(ENABLED_KEY);
      setMessage("Powiadomienia w tle wyłączone. Timer na ekranie nadal działa.");
    } catch (err) {
      setMessage("Nie udało się wyłączyć powiadomień na serwerze. Sprawdź połączenie.", true);
      console.error("FORMA push disable:", err);
      throw err;
    } finally {
      busy = false; draw();
    }
  }
  toggle.addEventListener("click", () => {
    if (enabled) disable().catch(() => {});
    else enable();
  });
  test.addEventListener("click", async () => {
    if (!enabled) return;
    test.disabled = true;
    try {
      await call("test");
      setMessage("Powiadomienie testowe wysłane. Jeśli go nie widzisz, sprawdź ustawienia iOS i tryb Skupienie.");
    } catch (err) {
      setMessage("Test nie powiódł się: " + (err.message || "błąd połączenia"), true);
    } finally { test.disabled = false; }
  });
  window.FORMA_REST_PUSH = {
    isEnabled: () => enabled,
    schedule(dueAt, label, timerId) {
      if (!enabled) return Promise.resolve({ scheduled: false });
      return queue(async () => {
        try {
          return await call("schedule", { dueAt: new Date(dueAt).toISOString(), label, timerId });
        } catch (err) {
          console.error("FORMA push timer scheduling failed:", err);
          setMessage("Uwaga: nie udało się ustawić alarmu w tle. Timer na ekranie działa, ale powiadomienie może nie nadejść.", true);
          return { scheduled: false };
        }
      });
    },
    cancel(timerId) {
      if (!enabled || !timerId) return Promise.resolve();
      return queue(async () => {
        try { await call("cancel", { timerId }); }
        catch (err) { console.warn("FORMA push cancel:", err); }
      });
    },
    disable,
  };
  window.addEventListener("forma:auth", () => { refresh(); });
  window.addEventListener("pageshow", () => {
    if (publicKey === null) refresh();
  });
  draw();
  refresh();
})();
