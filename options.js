(function () {
  const fields = {
    mode: document.getElementById("mode"),
    strictness: document.getElementById("strictness"),
    strictnessValue: document.getElementById("strictnessValue"),
    highlightHighSignal: document.getElementById("highlightHighSignal"),
    hideMixedPosts: document.getElementById("hideMixedPosts"),
    showReasonBadges: document.getElementById("showReasonBadges"),
    save: document.getElementById("save"),
    reset: document.getElementById("reset"),
    status: document.getElementById("status")
  };

  function status(message) {
    fields.status.textContent = message;
  }

  function readValues() {
    return {
      mode: fields.mode.value,
      strictness: Number(fields.strictness.value),
      highlightHighSignal: fields.highlightHighSignal.checked,
      hideMixedPosts: fields.hideMixedPosts.checked,
      showReasonBadges: fields.showReasonBadges.checked
    };
  }

  function setValues(settings) {
    fields.mode.value = settings.mode;
    fields.strictness.value = String(settings.strictness);
    fields.strictnessValue.textContent = String(settings.strictness);
    fields.highlightHighSignal.checked = settings.highlightHighSignal;
    fields.hideMixedPosts.checked = settings.hideMixedPosts;
    fields.showReasonBadges.checked = settings.showReasonBadges;
  }

  async function save() {
    const next = await window.LinkedInSignalSettings.saveSettings(readValues());
    setValues(next);
    status("Saved settings");
  }

  async function reset() {
    const defaults = await window.LinkedInSignalSettings.resetSettings();
    setValues(defaults);
    status("Reset to defaults");
  }

  async function boot() {
    const initial = await window.LinkedInSignalSettings.getSettings();
    setValues(initial);

    fields.strictness.addEventListener("input", () => {
      fields.strictnessValue.textContent = fields.strictness.value;
    });

    fields.save.addEventListener("click", save);
    fields.reset.addEventListener("click", reset);
  }

  boot();
})();
