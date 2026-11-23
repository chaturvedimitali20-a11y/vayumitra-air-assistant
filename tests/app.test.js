*(7 comprehensive unit tests covering XSS sanitization, AQI tiers, impact calculations, prompt generation, and dynamic pollutant/housing fallback rendering)*

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeInput,
  classifyAQI,
  calculateImpactMetrics,
  buildSystemPrompt,
  generateFallbackPlan
} from "../app.js";

test("sanitizeInput strips HTML tags and trims whitespace", () => {
  const dirty = "<script>alert('xss')</script>Greater Noida  ";
  assert.equal(sanitizeInput(dirty), "scriptalert('xss')/scriptGreater Noida");
});

test("sanitizeInput handles non-string and oversized inputs safely", () => {
  assert.equal(sanitizeInput(null), "");
  assert.equal(sanitizeInput(12345), "");
  assert.equal(sanitizeInput("a".repeat(500)).length, 300);
});

test("classifyAQI accurately categorizes all severity levels", () => {
  assert.equal(classifyAQI(-5).label, "Unknown");
  assert.equal(classifyAQI(85).level, "moderate");
  assert.equal(classifyAQI(250).level, "severe");
  assert.equal(classifyAQI(435).level, "severe");
  assert.match(classifyAQI(435).label, /Severe/);
});

test("calculateImpactMetrics quantifies car commute CO2 savings", () => {
  const metrics = calculateImpactMetrics(410, "Daily petrol car commute");
  assert.equal(metrics.exposureReduction, "-42%");
  assert.equal(metrics.co2SavedKg, 3.4);
  assert.equal(metrics.safeWindow, "2:15 PM – 3:00 PM");
  assert.match(metrics.communityText, /1,700 kg of CO₂/);
});

test("calculateImpactMetrics adjusts metrics for non-driving routines and moderate AQI", () => {
  const metrics = calculateImpactMetrics(180, "Morning park walk and metro");
  assert.equal(metrics.exposureReduction, "-24%");
  assert.equal(metrics.co2SavedKg, 1.5);
  assert.equal(metrics.safeWindow, "11:00 AM – 4:00 PM");
});

test("buildSystemPrompt embeds all user context parameters", () => {
  const prompt = buildSystemPrompt({
    location: "Delhi NCR",
    aqi: 390,
    pollutant: "PM2.5",
    homeType: "Apartment",
    vulnerable: "Toddler",
    budget: "DIY",
    routine: "Metro commute"
  });
  assert.match(prompt, /Delhi NCR/);
  assert.match(prompt, /390/);
  assert.match(prompt, /Toddler/);
});

test("generateFallbackPlan adapts dynamically to pollutant and housing inputs", () => {
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