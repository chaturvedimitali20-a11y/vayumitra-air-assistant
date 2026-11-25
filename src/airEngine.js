/**
 * @fileoverview Core domain logic for VayuMitra Urban Air Quality & Sustainability Assistant.
 * Pure, side-effect-free functions for AQI classification, emission/exposure impact modeling,
 * XSS sanitization, and structured Gemini prompt engineering.
 */

export function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").trim().slice(0, 300);
}

export function classifyAQI(aqi) {
  const num = Number(aqi);
  if (Number.isNaN(num) || num < 0) {
    return { label: "Unknown", level: "moderate", healthRisk: "Enter a valid AQI reading." };
  }
  if (num <= 100) {
    return { label: "Good / Satisfactory (0–100)", level: "moderate", healthRisk: "Minimal respiratory impact." };
  }
  if (num <= 200) {
    return { label: "Moderate (101–200)", level: "moderate", healthRisk: "Mild discomfort for asthma patients." };
  }
  if (num <= 300) {
    return { label: "Poor (201–300)", level: "severe", healthRisk: "Breathing discomfort on prolonged exposure." };
  }
  if (num <= 400) {
    return { label: "Very Poor (301–400)", level: "severe", healthRisk: "Respiratory illness on prolonged exposure." };
  }
  return { label: "Severe / Hazardous (401+)", level: "severe", healthRisk: "Severe health impact even on healthy individuals." };
}

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
  const weeklyCo2SavedKg = Number((co2SavedKg * 5).toFixed(1));
  const safeWindow = numAqi >= 350 ? "2:15 PM – 3:00 PM" : numAqi >= 200 ? "1:30 PM – 3:15 PM" : "11:00 AM – 4:00 PM";

  return {
    exposureReduction,
    co2SavedKg,
    weeklyCo2SavedKg,
    safeWindow,
    communityText: `If 500 households in your neighborhood adopt this swap today, your community prevents ${(co2SavedKg * 500).toLocaleString()} kg of CO₂ and ~${Math.round(co2SavedKg * 2.4)} kg of local particulate emissions (saving ${weeklyCo2SavedKg} kg CO₂ per household every 5-day workweek).`
  };
}

export function buildSystemPrompt(profile) {
  return `You are VayuMitra, a hyper-local Urban Air Quality & Sustainability Assistant.
Provide a concise daily plan in clean HTML bullet lists (<ul><li>...</li></ul>) with <h3> headings:
1. <h3>🏠 Indoor Air Quality Hacks (${profile.budget})</h3>
2. <h3>🚲 Low-Emission Daily Routine Swaps</h3>
3. <h3>📊 Direct Health & Environmental Impact</h3>

Context: Location=${profile.location}, AQI=${profile.aqi} (${classifyAQI(profile.aqi).label}), Pollutant=${profile.pollutant}, Home=${profile.homeType}, Vulnerable=${profile.vulnerable}, Routine=${profile.routine}.
Quantify exact exposure or emission reductions per tip. Keep under 260 words.`;
}

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
      <li><strong>Direct Emission Savings:</strong> Prevents <strong>${metrics.co2SavedKg} kg CO₂ today</strong> (<strong>${metrics.weeklyCo2SavedKg} kg CO₂/week</strong>) and ~${Math.round(metrics.co2SavedKg * 2.4)}g of local tailpipe particulates.</li>
    </ul>
  `;
}
