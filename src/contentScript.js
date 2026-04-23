(function () {
  const POST_SELECTOR = "div.feed-shared-update-v2";
  const BADGE_CLASS = "lisf-badge";

  let currentSettings = null;

  function getPostText(postElement) {
    const candidates = postElement.querySelectorAll(
      ".update-components-text, .update-components-text-view, .feed-shared-update-v2__description, .feed-shared-update-v2__commentary"
    );

    const merged = Array.from(candidates)
      .map((node) => (node.innerText || "").trim())
      .filter(Boolean)
      .join("\n");

    return (merged || postElement.innerText || "").replace(/\s+/g, " ").trim();
  }

  function getExternalDomain(postElement) {
    const links = Array.from(postElement.querySelectorAll("a[href]"));
    for (const link of links) {
      try {
        const url = new URL(link.href);
        const host = url.hostname.toLowerCase();
        if (!host.includes("linkedin.com") && !host.includes("lnkd.in")) {
          return host;
        }
      } catch {
        // Ignore unparsable URLs.
      }
    }
    return null;
  }

  function getMetadata(postElement) {
    const domain = getExternalDomain(postElement);
    const hasMedia = Boolean(postElement.querySelector("video, img"));
    return {
      hasExternalLink: Boolean(domain),
      externalDomain: domain,
      hasMedia
    };
  }

  function clearDecorations(postElement) {
    const existingBadge = postElement.querySelector(`.${BADGE_CLASS}`);
    if (existingBadge) {
      existingBadge.remove();
    }

    postElement.classList.remove("lisf-highlight", "lisf-dim", "lisf-hidden");

    if (postElement.dataset.lisfOriginalDisplay !== undefined) {
      postElement.style.display = postElement.dataset.lisfOriginalDisplay;
    }
  }

  function ensureBadge(postElement, result) {
    if (!currentSettings.showReasonBadges) {
      return;
    }

    const badge = document.createElement("div");
    badge.className = `${BADGE_CLASS} lisf-badge--${result.label}`;

    const labelMap = {
      "high-signal": "Signal: High",
      mixed: "Signal: Mixed",
      "low-signal": "Signal: Low"
    };

    const reason = result.reasons.length > 0 ? ` (${result.reasons.slice(0, 2).join(", ")})` : "";
    badge.textContent = `${labelMap[result.label] || "Signal"}${reason}`;

    postElement.prepend(badge);
  }

  function applyVisibility(postElement, result) {
    const shouldFilter =
      result.label === "low-signal" || (currentSettings.hideMixedPosts && result.label === "mixed");

    if (result.label === "high-signal" && currentSettings.highlightHighSignal) {
      postElement.classList.add("lisf-highlight");
    }

    if (!shouldFilter) {
      return;
    }

    if (currentSettings.mode === "hide-low-signal") {
      if (postElement.dataset.lisfOriginalDisplay === undefined) {
        postElement.dataset.lisfOriginalDisplay = postElement.style.display || "";
      }
      postElement.style.display = "none";
      postElement.classList.add("lisf-hidden");
      return;
    }

    if (currentSettings.mode === "dim-low-signal") {
      postElement.classList.add("lisf-dim");
    }
  }

  function processPost(postElement) {
    const text = getPostText(postElement);
    if (!text || text.length < 10) {
      return;
    }

    clearDecorations(postElement);

    const result = window.LinkedInSignalClassifier.analyzePost(text, {
      strictness: currentSettings.strictness,
      ...getMetadata(postElement)
    });

    ensureBadge(postElement, result);
    applyVisibility(postElement, result);

    postElement.dataset.lisfProcessed = "1";
  }

  function processAllPosts(root = document) {
    const posts = root.querySelectorAll(POST_SELECTOR);
    for (const post of posts) {
      processPost(post);
    }
    return posts.length;
  }

  async function refreshSettingsAndRescan() {
    currentSettings = await window.LinkedInSignalSettings.getSettings();
    return processAllPosts(document);
  }

  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
          break;
        }
      }

      if (!shouldProcess) {
        return;
      }

      window.requestAnimationFrame(() => {
        processAllPosts(document);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function setupEvents() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync") {
        return;
      }
      if (!changes[window.LinkedInSignalSettings.STORAGE_KEY]) {
        return;
      }
      refreshSettingsAndRescan();
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== "LSF_RESCAN") {
        return;
      }
      refreshSettingsAndRescan().then((count) => {
        sendResponse({ ok: true, processed: count });
      });
      return true;
    });
  }

  async function boot() {
    if (!window.LinkedInSignalClassifier || !window.LinkedInSignalSettings) {
      return;
    }

    currentSettings = await window.LinkedInSignalSettings.getSettings();
    processAllPosts(document);
    setupObserver();
    setupEvents();
  }

  boot();
})();
