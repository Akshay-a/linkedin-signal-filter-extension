(function () {
  const form = {
    mode: document.getElementById("mode"),
    strictness: document.getElementById("strictness"),
    strictnessValue: document.getElementById("strictnessValue"),
    highlightHighSignal: document.getElementById("highlightHighSignal"),
    hideMixedPosts: document.getElementById("hideMixedPosts"),
    showReasonBadges: document.getElementById("showReasonBadges"),
    rescan: document.getElementById("rescan"),
    openOptions: document.getElementById("openOptions"),
    status: document.getElementById("status")
  };

  function setStatus(text) {
    form.status.textContent = text;
  }

  function readFormValues() {
    return {
      mode: form.mode.value,
      strictness: Number(form.strictness.value),
      highlightHighSignal: form.highlightHighSignal.checked,
      hideMixedPosts: form.hideMixedPosts.checked,
      showReasonBadges: form.showReasonBadges.checked
    };
  }

  function hydrateForm(settings) {
    form.mode.value = settings.mode;
    form.strictness.value = String(settings.strictness);
    form.strictnessValue.textContent = String(settings.strictness);
    form.highlightHighSignal.checked = settings.highlightHighSignal;
    form.hideMixedPosts.checked = settings.hideMixedPosts;
    form.showReasonBadges.checked = settings.showReasonBadges;
  }

  async function persist() {
    const next = await window.LinkedInSignalSettings.saveSettings(readFormValues());
    hydrateForm(next);
    setStatus("Saved");
  }

  async function rescanActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setStatus("No active tab found");
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: "LSF_RESCAN" });
      if (response?.ok) {
        setStatus(`Re-scanned ${response.processed} posts`);
      } else {
        setStatus("No response from page");
      }
    } catch {
      setStatus("Open LinkedIn feed tab and try again");
    }
  }

  async function boot() {
    const settings = await window.LinkedInSignalSettings.getSettings();
    hydrateForm(settings);

    form.mode.addEventListener("change", persist);
    form.strictness.addEventListener("input", async () => {
      form.strictnessValue.textContent = form.strictness.value;
      await persist();
    });
    form.highlightHighSignal.addEventListener("change", persist);
    form.hideMixedPosts.addEventListener("change", persist);
    form.showReasonBadges.addEventListener("change", persist);

    form.rescan.addEventListener("click", rescanActiveTab);
    form.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());
  }

  boot();
})();
