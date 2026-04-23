(function () {
  const SLOP_PATTERNS = [
    { reason: "storybook opener", weight: 4, regex: /\bonce upon a time\b/i },
    { reason: "journey framing", weight: 3, regex: /\bmy\s+journey\b/i },
    { reason: "generic life lesson", weight: 3, regex: /\bhere('?s| is) what (i|we) learned\b/i },
    { reason: "emotional bait", weight: 3, regex: /\bi almost gave up\b|\bfrom broke to\b|\btears? in my eyes\b/i },
    { reason: "engagement bait", weight: 2, regex: /\blike if\b|\bcomment\s+["']?(yes|interested|agree)["']?\b|\bfollow for more\b/i },
    { reason: "hustle cliche", weight: 2, regex: /\bgrind\b|\bhustle\b|\bno excuses\b|\bnever quit\b/i },
    { reason: "motivation hashtag", weight: 2, regex: /#motivation|#mindset|#success|#inspiration/i },
    { reason: "ai guru framing", weight: 2, regex: /\bchatgpt changed my life\b|\bai made me\b/i }
  ];

  const TECH_PATTERNS = [
    { reason: "demo wording", weight: 4, regex: /\b(demo|walkthrough|screen\s?recording|live build|ship(ped|ping)?)\b/i },
    { reason: "technical nouns", weight: 3, regex: /\b(api|sdk|latency|throughput|architecture|schema|webhook|cache|benchmark)\b/i },
    { reason: "engineering verbs", weight: 3, regex: /\b(debugged|refactored|implemented|deployed|optimized|instrumented)\b/i },
    { reason: "code artifact", weight: 3, regex: /\b(github|repository|repo|pull request|commit|changelog|release notes)\b/i },
    { reason: "article depth", weight: 2, regex: /\b(postmortem|deep dive|how it works|technical write-?up|system design)\b/i },
    { reason: "data and metrics", weight: 2, regex: /\b\d+(ms|s|sec|seconds|%|x|kb|mb|gb|rps|qps)\b/i },
    { reason: "stack terms", weight: 2, regex: /\b(docker|kubernetes|postgres|redis|typescript|python|rust|node\.js|golang)\b/i }
  ];

  const TECH_DOMAINS = [
    "github.com",
    "arxiv.org",
    "medium.com",
    "substack.com",
    "dev.to",
    "stackoverflow.com",
    "docs.",
    "readme.com"
  ];

  function scoreMatches(text, patterns) {
    const matches = [];
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        score += pattern.weight;
        matches.push(pattern.reason);
      }
    }
    return { score, matches };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function thresholdsForStrictness(strictness) {
    const normalized = clamp(Number.isFinite(strictness) ? strictness : 60, 0, 100);
    const minTechnical = normalized >= 85 ? 6 : normalized >= 65 ? 4 : 2;
    const minQuality = normalized >= 85 ? 3 : normalized >= 65 ? 1 : 0;
    const lowSignalBias = normalized >= 80 ? 2 : normalized >= 60 ? 1 : 0;
    return { minTechnical, minQuality, lowSignalBias };
  }

  function isTechnicalDomain(domain) {
    if (!domain) {
      return false;
    }
    const normalized = domain.toLowerCase();
    return TECH_DOMAINS.some((candidate) => normalized.includes(candidate));
  }

  function analyzePost(text, options = {}) {
    const normalizedText = (text || "").replace(/\s+/g, " ").trim();
    const wordCount = normalizedText.length === 0 ? 0 : normalizedText.split(" ").length;

    const slop = scoreMatches(normalizedText, SLOP_PATTERNS);
    const tech = scoreMatches(normalizedText, TECH_PATTERNS);

    let slopScore = slop.score;
    let technicalScore = tech.score;

    if (options.hasExternalLink) {
      technicalScore += 1;
    }

    if (isTechnicalDomain(options.externalDomain)) {
      technicalScore += 2;
    }

    if (options.hasMedia && /\bdemo|walkthrough|screen|build\b/i.test(normalizedText)) {
      technicalScore += 2;
    }

    if (wordCount < 30 && technicalScore === 0) {
      slopScore += 2;
    }

    if (/(\bcomment\b|\bfollow\b|\bshare\b|\blike\b).{0,30}(\bfor\b|\bbelow\b)/i.test(normalizedText)) {
      slopScore += 1;
    }

    const qualityScore = technicalScore - slopScore;
    const thresholds = thresholdsForStrictness(options.strictness);

    let label = "mixed";
    if (technicalScore >= thresholds.minTechnical && qualityScore >= thresholds.minQuality) {
      label = "high-signal";
    }

    if (
      qualityScore <= -1 - thresholds.lowSignalBias ||
      slopScore >= technicalScore + 3 + thresholds.lowSignalBias
    ) {
      label = "low-signal";
    }

    if (label === "mixed" && technicalScore <= 1 && slopScore >= 2) {
      label = "low-signal";
    }

    const reasons = [
      ...tech.matches.slice(0, 3),
      ...slop.matches.slice(0, 3)
    ];

    return {
      label,
      technicalScore,
      slopScore,
      qualityScore,
      wordCount,
      reasons,
      matchedTechnical: tech.matches,
      matchedSlop: slop.matches
    };
  }

  window.LinkedInSignalClassifier = {
    analyzePost
  };
})();
