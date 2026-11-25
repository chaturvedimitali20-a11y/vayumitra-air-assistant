/**
 * @fileoverview VayuMitra UI Controller & Gemini API Service.
 * Connects accessible DOM controls with modular air quality domain logic in src/airEngine.js.
 */

import {
  sanitizeInput,
  classifyAQI,
  calculateImpactMetrics,
  buildSystemPrompt,
  generateFallbackPlan
} from "./src/airEngine.js";

export {
  sanitizeInput,
  classifyAQI,
  calculateImpactMetrics,
  buildSystemPrompt,
  generateFallbackPlan
};

const responseCache = new Map();
const API_TIMEOUT_MS = 12000;

/**
 * Calls Google Gemini 2.5 Flash API with AbortController timeout protection.
 * @param {string} apiKey - User-provided Gemini API key.
 * @param {string} prompt - Structured prompt string.
 * @param {typeof fetch} [fetchImpl=fetch] - Injectable fetch implementation for testing.
 * @returns {Promise<string>} Sanitized HTML response.
 */
export async function fetchGeminiAdvice(apiKey, prompt, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const endpoint = `https://googleapis.com{encodeURIComponent(apiKey)}`;
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 650 }
      })
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    const candidate = Array.isArray(data.candidates) ? data.candidates.at(0) : null;
    const part = candidate && candidate.content && Array.isArray(candidate.content.parts) ? candidate.content.parts.at(0) : null;
    const rawText = part && typeof part.text === "string" ? part.text : "";

    if (!rawText) {
      throw new Error("Empty response from Gemini API");
    }

    return rawText.replace(/```html|```/gi, "").trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

if (typeof document !== "undefined") {
  const form = document.getElementById("air-form");
  const aqiInput = document.getElementById("aqi");
  const aqiTag = document.getElementById("aqi-category");
  const apiKeyInput = document.getElementById("api-key");
  const modeBadge = document.getElementById("mode-badge");
  const presetBtn = document.getElementById("preset-ncr-btn");
  const errorBanner = document.getElementById("form-error");
  const generateBtn = document.getElementById("generate-btn");

  aqiInput.addEventListener("input", () => {
    const info = classifyAQI(aqiInput.value);
    aqiTag.textContent = info.label;
    aqiTag.className = `aqi-tag ${info.level}`;
  });

  apiKeyInput.addEventListener("input", () => {
    if (apiKeyInput.value.trim().length > 10) {
      modeBadge.textContent = "Live Gemini API Active";
      modeBadge.className = "badge badge-success";
    } else {
      modeBadge.textContent = "Demo Simulation Ready";
      modeBadge.className = "badge";
    }
  });

  presetBtn.addEventListener("click", () => {
    document.getElementById("location").value = "Greater Noida, Sector 150";
    document.getElementById("aqi").value = "442";
    document.getElementById("pollutant").value = "PM2.5";
    document.getElementById("home-type").value = "High-rise apartment (above 6th floor)";
    document.getElementById("vulnerable").value = "Toddler and elderly grandparent with asthma";
    document.getElementById("budget").value = "Zero/Low-Cost DIY Hacks Only";
    document.getElementById("routine").value = "16 km solo petrol car commute, morning park walk, daily cooking";
    aqiInput.dispatchEvent(new Event("input"));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBanner.hidden = true;

    const profile = {
      location: sanitizeInput(document.getElementById("location").value),
      aqi: Number(document.getElementById("aqi").value),
      pollutant: sanitizeInput(document.getElementById("pollutant").value),
      homeType: sanitizeInput(document.getElementById("home-type").value),
      vulnerable: sanitizeInput(document.getElementById("vulnerable").value),
      budget: sanitizeInput(document.getElementById("budget").value),
      routine: sanitizeInput(document.getElementById("routine").value)
    };

    if (!profile.location || !profile.routine || Number.isNaN(profile.aqi) || profile.aqi < 1) {
      errorBanner.textContent = "Please fill in your Location, valid AQI (1–999), and Daily Routine.";
      errorBanner.hidden = false;
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "⏳ Analyzing local airshed & generating plan...";

    const metrics = calculateImpactMetrics(profile.aqi, profile.routine);
    const apiKey = apiKeyInput.value.trim();
    const cacheKey = JSON.stringify({ ...profile, hasKey: Boolean(apiKey) });
    let htmlOutput = "";
    let sourceLabel = "Generated via Dynamic Simulation Engine";

    try {
      if (responseCache.has(cacheKey)) {
        htmlOutput = responseCache.get(cacheKey);
        sourceLabel = apiKey ? "Gemini 2.5 Flash (Cached Instant Response)" : "Dynamic Simulation (Cached)";
      } else if (apiKey) {
        const prompt = buildSystemPrompt(profile);
        htmlOutput = await fetchGeminiAdvice(apiKey, prompt);
        responseCache.set(cacheKey, htmlOutput);
        sourceLabel = "Generated via Google Gemini 2.5 Flash";
      } else {
        htmlOutput = generateFallbackPlan(profile, metrics);
        responseCache.set(cacheKey, htmlOutput);
      }
    } catch (err) {
      console.warn("Falling back to local engine:", err.message);
      htmlOutput = generateFallbackPlan(profile, metrics);
      sourceLabel = "Fallback Mode (Check API Key / Quota)";
    }

    document.getElementById("metric-exposure").textContent = metrics.exposureReduction;
    document.getElementById("metric-co2").textContent = `${metrics.co2SavedKg} kg`;
    document.getElementById("metric-window").textContent = metrics.safeWindow;
    document.getElementById("ai-output").innerHTML = htmlOutput;
    document.getElementById("community-impact-text").textContent = metrics.communityText;
    document.getElementById("source-indicator").textContent = sourceLabel;

    const resultsSection = document.getElementById("results-section");
    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: "smooth" });

    generateBtn.disabled = false;
    generateBtn.textContent = "✨ Generate Personalized Action & Impact Plan";
  });
}
