# 🌬️ VayuMitra — GenAI Urban Air Quality & Sustainability Assistant

**Built for Hack2skill PromptWars — Challenge 06 (Urban Air Quality Assistant)**

VayuMitra helps families and communities navigate severe winter smog and urban air pollution through hyper-localized indoor air quality hacks, low-emission daily routine swaps, and quantified health/carbon impact metrics.

---

## ✨ Key Features
- **Hyper-Local Smog Reasoning:** Tailors advice to city/sector, live AQI level, primary pollutant (`PM2.5`, `PM10`, `NO2`), housing floor/type, and family vulnerabilities (toddlers, elderly, asthma).
- **Zero/Low-Cost DIY ("Jugaad") Mode:** Recommends practical, zero-budget physics hacks (inversion-window ventilation timing, wet-mopping vs. dry sweeping, draft sealing) alongside sustainable commute swaps.
- **Quantified Personal & Community Impact:** Calculates daily indoor particulate exposure reduction (`%`), avoided `CO₂` emissions (`kg`), safe ventilation windows, and 500-household community ripple effects.
- **Dual Execution Engine:** Powered by **Google Gemini 2.5 Flash** with an instant built-in simulation fallback for zero-latency offline/evaluator testing.

---

## 🛡️ Architecture & Evaluation Highlights
1. **Code Quality:** Modular ES6 architecture separating pure business logic (`app.js`), semantic markup (`index.html`), and responsive design tokens (`style.css`).
2. **Security:** Zero hardcoded secrets; client-side memory-only API key handling (`autocomplete="off"`) and strict input sanitization against XSS injection.
3. **Efficiency:** Zero heavy framework dependencies (< 35 KB total repository size), instant load times, and single-call structured prompt generation.
4. **Testing:** Automated unit test suite (`tests/app.test.js`) powered by Node's native test runner (`node --test`).
5. **Accessibility:** WCAG AA high-contrast palette, skip-to-content link, semantic landmarks (`<header>`, `<main>`, `<section>`, `<footer>`), ARIA live regions, and visible keyboard focus indicators.

---

## 🚀 How to Run Locally & Run Tests
1. Clone this repository and open `index.html` in any modern browser (or use VS Code Live Server).
2. *(Optional)* Enter a free Google Gemini API key from [Google AI Studio](https://google.com) or click **Generate** immediately to run in Demo Simulation Mode.
3. Run the automated unit test suite (requires Node.js 18+):
   ```bash
   node --test tests/app.test.js
   ```
