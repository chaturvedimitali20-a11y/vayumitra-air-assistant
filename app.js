/**
 * VayuMitra - Urban Air Quality & Sustainability Assistant
 * Modular logic exported for both browser execution and automated unit testing.
 */

/**
 * @fileoverview VayuMitra - Urban Air Quality & Sustainability Assistant
 * Modular ES6 logic with response caching, timeout protection, dynamic personalization, and XSS sanitization.
 */

const responseCache = new Map();
const API_TIMEOUT_MS = 12000;

/**
 * Sanitizes user input to prevent XSS and enforce length limits.
 * @param {string} str
 * @returns {string}
 */
export function sanitizeInput(str) {
    if (typeof str !== "string") return "";
    return str.replace(/[<>]/g, "").trim().slice(0, 300);
}

/**
 * Classifies numerical AQI into standard Indian CPCB severity tiers.
 * @param {number|string} aqi
 * @returns {{label: string, level: string}}
 */
export function classifyAQI(aqi) {
    const num = Number(aqi);
    if (Number.isNaN(num) || num < 0) return { label: "Unknown", level: "moderate" };
    if (num <= 100) return { label: "Good / Satisfactory (0–100)", level: "moderate" };
    if (num <= 200) return { label: "Moderate (101–200)", level: "moderate" };
    if (num <= 300) return { label: "Poor (201–300)", level: "severe" };
    if (num <= 400) return { label: "Very Poor (301–400)", level: "severe" };
    return { label: "Severe / Hazardous (401+)", level: "severe" };
}

/**
 * Computes quantified personal exposure reduction, CO2 savings, and community ripple metrics.
 * @param {number|string} aqi
 * @param {string} routineText
 * @returns {{exposureReduction: string, co2SavedKg: number, safeWindow: string, communityText: string}}
 */
export function calculateImpactMetrics(aqi, routineText) {
    const numAqi = Math.max(50, Math.min(999, Number(aqi) || 300));
    const lowerRoutine = (routineText || "").toLowerCase();

    const exposureReduction = numAqi >= 350 ? "-42%" : numAqi >= 200 ? "-34%" : "-24%";
    const hasCarOrBike =
        lowerRoutine.includes("car") ||
        lowerRoutine.includes("drive") ||
        lowerRoutine.includes("bike") ||
        lowerRoutine.includes("scooter");
    const co2SavedKg = hasCarOrBike ? 3.4 : 1.5;
    const safeWindow = numAqi >= 350 ? "2:15 PM – 3:00 PM" : numAqi >= 200 ? "1:30 PM – 3:15 PM" : "11:00 AM – 4:00 PM";

    return {
        exposureReduction,
        co2SavedKg,
        safeWindow,
        communityText: `If 500 households in your neighborhood adopt this swap today, your community prevents ${(co2SavedKg * 500).toLocaleString()} kg of CO₂ and ~${Math.round(co2SavedKg * 2.4)} kg of local particulate emissions.`
    };
}

/**
 * Builds a structured, token-efficient system prompt for Google Gemini.
 * @param {Object} profile
 * @returns {string}
 */
export function buildSystemPrompt(profile) {
    return `You are VayuMitra, a hyper-local Urban Air Quality & Sustainability Assistant.
Provide a concise daily plan in clean HTML bullet lists (<ul><li>...</li></ul>) with <h3> headings:
1. <h3>🏠 Indoor Air Quality Hacks (${profile.budget})</h3>
2. <h3>🚲 Low-Emission Daily Routine Swaps</h3>
3. <h3>📊 Direct Health & Environmental Impact</h3>

Context: Location=${profile.location}, AQI=${profile.aqi} (${classifyAQI(profile.aqi).label}), Pollutant=${profile.pollutant}, Home=${profile.homeType}, Vulnerable=${profile.vulnerable}, Routine=${profile.routine}.
Quantify exact exposure or emission reductions per tip. Keep under 260 words.`;
}

/**
 * Generates dynamic, context-sensitive recommendations tailored to every selected input.
 * @param {Object} profile
 * @param {Object} metrics
 * @returns {string}
 */
export function generateFallbackPlan(profile, metrics) {
    let homeHack = `Seal balcony sliding door tracks and window gaps with damp rolled towels until <strong>${metrics.safeWindow}</strong>.`;
    if (profile.homeType.toLowerCase().includes("ground")) {
        homeHack = `Keep street-facing ground-floor windows shut during peak traffic hours and place damp door-draft stoppers at the main entrance until <strong>${metrics.safeWindow}</strong>.`;
    } else if (profile.homeType.toLowerCase().includes("independent")) {
        homeHack = `Sprinkle water lightly on your courtyard/driveway dust in the morning and keep courtyard doors closed until <strong>${metrics.safeWindow}</strong>.`;
    }

    const isDIY = profile.budget.toLowerCase().includes("diy");
    let pollutantHack = isDIY
        ? `Place wide bowls of water near sunny windows and run your kitchen exhaust fan on high during cooking to trap fine <strong>${profile.pollutant}</strong> aerosols.`
        : `Run your HEPA purifier on High in the bedroom 45 minutes before sleep and wear a snug N95 mask outdoors to block <strong>${profile.pollutant}</strong>.`;

    if (profile.pollutant === "PM10") {
        pollutantHack = isDIY
            ? `Wipe window sills, fans, and furniture with a damp microfiber cloth twice daily—heavy <strong>PM10</strong> dust settles fast and re-enters the air if dry-dusted.`
            : `Clean your purifier pre-filter mesh today and seal balcony vents against coarse <strong>PM10</strong> construction and road dust.`;
    } else if (profile.pollutant === "NO2") {
        pollutantHack = `Keep your kitchen chimney/exhaust running on maximum while using the gas stove and add indoor spider/snake plants near kitchen windows to absorb <strong>NO2</strong>.`;
    }

    const lowerRoutine = profile.routine.toLowerCase();
    const isVehicleUser = lowerRoutine.includes("car") || lowerRoutine.includes("bike") || lowerRoutine.includes("drive");
    const commuteSwap = isVehicleUser
        ? `Replace your solo vehicle trip in <em>"${profile.routine}"</em> with Metro/bus transit or a 3-person carpool today.`
        : `Keep your low-emission commute in <em>"${profile.routine}"</em>, and wear a well-fitted N95 mask during last-mile walking stretches.`;

    const timingAdvice =
        Number(profile.aqi) >= 300
            ? `Shift any outdoor walk or exercise strictly indoors—at AQI <strong>${profile.aqi}</strong>, morning ground-level smog traps pollutants at breathing height.`
            : `Schedule outdoor errands during the clearer <strong>${metrics.safeWindow}</strong> window when thermal mixing disperses local emissions.`;

    return `
    <h3>🏠 Indoor Air Quality Hacks (${profile.budget})</h3>
    <ul>
      <li><strong>Housing-Specific Shield (${profile.homeType}):</strong> ${homeHack}</li>
      <li><strong>Targeted ${profile.pollutant} Control:</strong> ${pollutantHack}</li>
      <li><strong>Care Plan for ${profile.vulnerable}:</strong> Use warm saline nasal rinses in the evening and avoid burning incense, candles, or mosquito coils indoors.</li>
    </ul>

    <h3>🚲 Low-Emission Daily Routine Swaps</h3>
    <ul>
      <li><strong>Tailored Commute Action:</strong> ${commuteSwap}</li>
      <li><strong>Smart Schedule Shift:</strong> ${timingAdvice}</li>
    </ul>

    <h3>📊 Direct Health &amp; Environmental Impact</h3>
    <ul>
      <li><strong>Personal Exposure Impact:</strong> Reduces household indoor particulate inhalation by <strong>${metrics.exposureReduction}</strong> in <strong>${profile.location}</strong> today.</li>
      <li><strong>Direct Emission Savings:</strong> Your daily routine adjustments prevent <strong>${metrics.co2SavedKg} kg of CO₂</strong> and ~${Math.round(metrics.co2SavedKg * 2.4)}g of local tailpipe particulates.</li>
    </ul>
  `;
}

/**
 * Calls Google Gemini 2.5 Flash API with AbortController timeout protection.
 * @param {string} apiKey
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function fetchGeminiAdvice(apiKey, prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const endpoint = `https://googleapis.com{encodeURIComponent(apiKey)}`;
        const response = await fetch(endpoint, {
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
        document.getElementById("metric-co2").textContent = ${ metrics.co2SavedKg } kg;
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