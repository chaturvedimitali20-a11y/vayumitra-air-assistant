# 🌬️ VayuMitra — GenAI Urban Air Quality & Sustainability Assistant

**Built for Hack2skill PromptWars — Challenge 06 (Urban Air Quality Assistant)**

> **Live Demo:** [https://chaturvedimitali20-a11y.github.io/vayumitra-air-assistant/](https://chaturvedimitali20-a11y.github.io/vayumitra-air-assistant/)

VayuMitra is a GenAI-powered web application designed to help urban families manage severe winter smog and air pollution through localized air quality guidance, DIY indoor health hacks, and quantified environmental impact metrics.

---

## ✨ Key Features & Architecture
- **Hyper-Local Smog Reasoning:** Tailors real-time advice based on location, live AQI metrics, primary pollutants (`PM2.5`, `PM10`, `NO2`), housing types, and household vulnerabilities.
- **Dual Execution Engine:** Combines Google Gemini 2.5 Flash API integration with in-memory caching and a dynamic fallback simulation engine.
- **Modular Codebase:** Separates pure domain logic (`src/airEngine.js`), UI orchestration (`app.js`), semantic markup (`index.html`), and high-contrast styling (`style.css`).
- **Automated Testing & CI:** Includes 11 automated unit tests (`tests/app.test.js`) executed via `npm test` and integrated into GitHub Actions (`.github/workflows/test.yml`).
- **Accessibility:** Built with WCAG AA compliance, semantic landmarks, ARIA live regions, and keyboard navigation support.

---

## 🚀 Quick Start
1. Start a local server: `python -m http.server 8000`
2. Open **[http://localhost:8000](http://localhost:8000)** (optional: supply an API key from [Google AI Studio](https://google.com)).
3. Run unit tests: `npm test`
