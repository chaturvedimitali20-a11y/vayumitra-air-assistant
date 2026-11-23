import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeInput,
  classifyAQI,
  calculateImpactMetrics,
  buildSystemPrompt
} from "../app.js";

test("sanitizeInput strips HTML tags to prevent XSS", () => {
  const dirty = "<script>alert('xss')</script>Greater Noida  ";
  assert.equal(sanitizeInput(dirty), "scriptalert('xss')/scriptGreater Noida");
});

test("classifyAQI accurately categorizes severe winter smog", () => {
  const result = classifyAQI(435);
  assert.equal(result.level, "severe");
  assert.match(result.label, /Severe/);
});

test("calculateImpactMetrics quantifies car commute CO2 savings", () => {
  const metrics = calculateImpactMetrics(410, "Daily petrol car commute");
  assert.equal(metrics.exposureReduction, "-42%");
  assert.equal(metrics.co2SavedKg, 3.4);
  assert.equal(metrics.safeWindow, "2:15 PM – 3:00 PM");
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
