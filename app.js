/**
 * VayuMitra - Urban Air Quality & Sustainability Assistant
 * Modular logic exported for both browser execution and automated unit testing.
 */

export function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 300);
}

export function classifyAQI(aqi) {
  const num = Number(aqi);
  if (Number.isNaN(num) || num < 0) return { label: "Unknown", level: "moderate" };
  if (num <= 100) return { label: "Good / Satisfactory (0–100)", level: "moderate" };
  if (num <= 200) return { label: "Moderate (101–200)", level: "moderate" };
  if (num <= 300) return { label: "Poor (201–300)", level: "severe" };
  if (num <= 400) return { label: "Very Poor (301–400)", level: "severe" };
  return { label: "Severe / Hazardous (401+)", level: "severe" };
}

export function calculateImpactMetrics(aqi, routineText) {
  const numAqi = Math.max(50, Math.min(999, Number(aqi) || 300));
  const lowerRoutine = (routineText || "").toLowerCase();

  const exposureReduction = numAqi >= 300 ? "-42%" : "-28%";
  const hasCarOrBike = lowerRoutine.includes("car") || lowerRoutine.includes("drive") || lowerRoutine.includes("bike");
  const co2SavedKg = hasCarOrBike ? 3.4 : 1.5;
  const safeWindow = numAqi >= 350 ? "2:15 PM – 3:00 PM" : "1:30 PM – 3:30 PM";

  return {
    exposureReduction,
    co2SavedKg,
    safeWindow,
    communityText: `If 500 households in your neighborhood adopt this swap today, your community prevents ${(co2SavedKg * 500).toLocaleString()} kg of CO₂ and ~${Math.round(co2SavedKg * 2.4)} kg of local particulate emissions.`
  };
}

export function buildSystemPrompt(profile) {
  return `You are VayuMitra, an empathetic, hyper-local Urban Air Quality & Sustainability Assistant.
Analyze the user's situation and provide a concise, actionable daily plan in clean HTML bullet lists (<ul><li>...</li></ul>) with <h3> headings:
1. <h3>🏠 Indoor Air Quality Hacks (${profile.budget})</h3>
2. <h3>🚲 Low-Emission Daily Routine Swaps</h3>
3. <h3>📊 Direct Health & Environmental Impact</h3>

User Context:
- Location: ${profile.location}
- Current AQI: ${profile.aqi} (${classifyAQI(profile.aqi).label})
- Primary Pollutant: ${profile.pollutant}
- Home Type: ${profile.homeType}
- Vulnerable Members: ${profile.vulnerable}
- Daily Routine: ${profile.routine}

Rules: Tailor strictly to their home type, budget, and family vulnerability. Quantify exact exposure or emission reductions for each tip. Keep response under 280 words.`;
}

function generateFallbackPlan(profile, metrics) {
  return `
    <h3>🏠 Indoor Air Quality Hacks (${profile.budget})</h3>
    <ul>
      <li><strong>Inversion-Aware Ventilation:</strong> Keep balcony doors and window gaps sealed with damp rolled towels until <strong>${metrics.safeWindow}</strong>, when afternoon warmth temporarily lifts ground-level ${profile.pollutant} smog.</li>
      <li><strong>Zero-Resuspension Cleaning:</strong> Switch strictly to wet-mopping floors instead of dry broom sweeping, and run your kitchen exhaust fan on high during tadka/frying to trap indoor spikes.</li>
      <li><strong>Respiratory Shield:</strong> Use warm saline nasal rinses for <strong>${profile.vulnerable}</strong> every evening to clear trapped fine particulates.</li>
    </ul>

    <h3>🚲 Low-Emission Daily Routine Swaps</h3>
    <ul>
      <li><strong>Commute Shift:</strong> Replace solo tailpipe trips in <em>"${profile.routine}"</em> with Metro/bus + e-rickshaw last-mile transit, or carpool with 2 colleagues.</li>
      <li><strong>Outdoor Timing:</strong> Move outdoor exercise indoors before 11:00 AM; peak winter smog concentrates near ground level during early morning temperature inversions.</li>
      <li><strong>Zero Indoor Combustion:</strong> Avoid burning incense (agarbatti), mosquito coils, or candles today—these spike indoor PM2.5 above 500 µg/m³.</li>
    </ul>

    <h3>📊 Direct Health &amp; Environmental Impact</h3>
    <ul>
      <li><strong>Personal Health Impact:</strong> Cuts household indoor particulate inhalation by <strong>${metrics.exposureReduction}</strong> during severe smog hours.</li>
      <li><strong>Direct Carbon &amp; Smog Impact:</strong> Your commute and combustion swaps prevent <strong>${metrics.co2SavedKg} kg of CO₂</strong> and ~8g of local NOx/PM2.5 from entering ${profile.location}'s airshed today.</li>
    </ul>
  `;
}

async function fetchGeminiAdvice(apiKey, prompt) {
  const endpoint = `https://googleapis.com{encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 650 }
    })
  });

  if (!response.ok) {
    throw new Error(`API returned status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return rawText.replace(/```html|```/gi, "").trim();
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
    let htmlOutput = "";
    let sourceLabel = "Generated via Localized Simulation Engine";

    try {
      if (apiKey) {
        const prompt = buildSystemPrompt(profile);
        htmlOutput = await fetchGeminiAdvice(apiKey, prompt);
        sourceLabel = "Generated via Google Gemini 2.5 Flash";
      } else {
        await new Promise((r) => setTimeout(r, 400));
        htmlOutput = generateFallbackPlan(profile, metrics);
      }
    } catch (err) {
      console.warn("Falling back to local engine:", err.message);
      htmlOutput = generateFallbackPlan(profile, metrics);
      sourceLabel = "Offline Fallback Mode (Check API Key)";
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
