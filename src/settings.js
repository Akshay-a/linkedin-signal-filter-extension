(function () {
  const STORAGE_KEY = "linkedInSignalSettings";

  const DEFAULT_SETTINGS = {
    mode: "hide-low-signal",
    strictness: 60,
    highlightHighSignal: true,
    hideMixedPosts: false,
    showReasonBadges: true
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeSettings(raw) {
    return {
      mode: ["hide-low-signal", "dim-low-signal", "mark-only"].includes(raw?.mode)
        ? raw.mode
        : DEFAULT_SETTINGS.mode,
      strictness: clamp(Number.isFinite(raw?.strictness) ? Math.round(raw.strictness) : DEFAULT_SETTINGS.strictness, 0, 100),
      highlightHighSignal: raw?.highlightHighSignal !== false,
      hideMixedPosts: raw?.hideMixedPosts === true,
      showReasonBadges: raw?.showReasonBadges !== false
    };
  }

  async function getSettings() {
    const data = await chrome.storage.sync.get(STORAGE_KEY);
    return normalizeSettings(data[STORAGE_KEY] || DEFAULT_SETTINGS);
  }

  async function saveSettings(partialSettings) {
    const current = await getSettings();
    const next = normalizeSettings({ ...current, ...partialSettings });
    await chrome.storage.sync.set({ [STORAGE_KEY]: next });
    return next;
  }

  async function resetSettings() {
    await chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
    return { ...DEFAULT_SETTINGS };
  }

  window.LinkedInSignalSettings = {
    STORAGE_KEY,
    DEFAULT_SETTINGS,
    getSettings,
    saveSettings,
    resetSettings
  };
})();
