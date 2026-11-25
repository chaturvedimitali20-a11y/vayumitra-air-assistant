import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeInput,
  classifyAQI,
  calculateImpactMetrics,
  buildSystemPrompt,
  generateFallbackPlan
} from "../src/airEngine.js";
import { fetchGeminiAdvice } from "../app.js";

test("sanitizeInput strips HTML tags and trims whitespace", () => {
  const dirty = "<script>alert('xss')</script>Greater Noida  ";
  assert.equal(sanitizeInput(dirty), "scriptalert('xss')/scriptGreater Noida");
});

test("sanitizeInput handles non-string and oversized inputs safely", () => {
  assert.equal(sanitizeInput(null), "");
  assert.equal(sanitizeInput(12345), "");
  assert.equal(sanitizeInput("a".repeat(500)).length, 300);
});

test("classifyAQI accurately categorizes all CPCB severity levels", () => {
  assert.equal(classifyAQI(-5).label, "Unknown");
  assert.equal(classifyAQI(85).level, "moderate");
  assert.equal(classifyAQI(180).level, "moderate");
  assert.equal(classifyAQI(250).level, "severe");
  assert.equal(classifyAQI(350).level, "severe");
  assert.equal(classifyAQI(435).level, "severe");
  assert.match(classifyAQI(435).label, /Severe/);
});

test("calculateImpactMetrics quantifies car commute daily and weekly CO2 savings", () => {
  const metrics = calculateImpactMetrics(410, "Daily petrol car commute");
  assert.equal(metrics.exposureReduction, "-42%");
  assert.equal(metrics.co2SavedKg, 3.4);
  assert.equal(metrics.weeklyCo2SavedKg, 17.0);
  assert.equal(metrics.safeWindow, "2:15 PM – 3:00 PM");
  assert.match(metrics.communityText, /1,700 kg of CO₂/);
});

test("calculateImpactMetrics adjusts metrics for non-driving routines and moderate AQI", () => {
  const metrics = calculateImpactMetrics(180, "Morning park walk and metro");
  assert.equal(metrics.exposureReduction, "-24%");
  assert.equal(metrics.co2SavedKg, 1.5);
  assert.equal(metrics.weeklyCo2SavedKg, 7.5);
  assert.equal(metrics.safeWindow, "11:00 AM – 4:00 PM");
});

test("calculateImpactMetrics clamps extreme or invalid AQI values safely", () => {
  const highMetrics = calculateImpactMetrics(5000, "Scooter ride");
  assert.equal(highMetrics.exposureReduction, "-42%");
  const fallbackMetrics = calculateImpactMetrics("invalid", "Walking");
  assert.equal(fallbackMetrics.exposureReduction, "-34%");
});

test("buildSystemPrompt embeds all user context parameters", () => {
  const prompt = buildSystemPrompt({
    location: "Greater Noida",
    aqi: 390,
    pollutant: "PM2.5",
    homeType: "Apartment",
    vulnerable: "Toddler",
    budget: "DIY",
    routine: "Metro commute"
  });
  assert.match(prompt, /Greater Noida/);
  assert.match(prompt, /390/);
  assert.match(prompt, /Toddler/);
});

test("generateFallbackPlan adapts dynamically to PM10 and ground-floor housing", () => {
  const profile = {
    location: "Noida",
    aqi: 420,
    pollutant: "PM10",
    homeType: "Low-rise flat or ground floor",
    vulnerable: "Elderly",
    budget: "Zero/Low-Cost DIY Hacks Only",
    routine: "Car commute"
  };
  const metrics = calculateImpactMetrics(420, "Car commute");
  const html = generateFallbackPlan(profile, metrics);
  assert.match(html, /ground-floor windows/);
  assert.match(html, /PM10/);
  assert.match(html, /Elderly/);
});

test("generateFallbackPlan adapts dynamically to NO2 and independent houses", () => {
  const profile = {
    location: "Delhi",
    aqi: 260,
    pollutant: "NO2",
    homeType: "Independent house with courtyard",
    vulnerable: "Children",
    budget: "Moderate",
    routine: "Metro transit"
  };
  const metrics = calculateImpactMetrics(260, "Metro transit");
  const html = generateFallbackPlan(profile, metrics);
  assert.match(html, /courtyard\/driveway/);
  assert.match(html, /NO2/);
  assert.match(html, /1:30 PM – 3:15 PM/);
});

test("fetchGeminiAdvice parses valid Gemini API JSON and strips markdown fences", async () => {
  const mockFetch = async () => ({
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [{ text: "```html\n<h3>Custom Plan</h3><ul><li>Tip 1</li></ul>\n```" }]
          }
        }
      ]
    })
  });

  const result = await fetchGeminiAdvice("test-key", "test-prompt", mockFetch);
  assert.equal(result, "<h3>Custom Plan</h3><ul><li>Tip 1</li></ul>");
});

test("fetchGeminiAdvice throws clean error on non-OK HTTP status", async () => {
  const mockFailFetch = async () => ({ ok: false, status: 403 });
  await assert.rejects(
    () => fetchGeminiAdvice("bad-key", "test-prompt", mockFailFetch),
    /API returned status 403/
  );
});
