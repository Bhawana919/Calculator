<div align="center">

# ⚡ OmniCalc

### A Modern, Precision-Engineered Web Calculator & Unit Converter

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Ready-brightgreen?style=for-the-badge&logo=github)](https://pages.github.com/)

<p align="center">
  A state-of-the-art web calculator with <b>Glassmorphism UI</b>, <b>Live Evaluation</b>, <b>Scientific Functions</b>, <b>Unit Conversion</b>, <b>Persistent History</b>, <b>Tactile Sound Effects</b>, and <b>Custom Themes</b>. Built with pure Vanilla HTML, CSS, and JavaScript with <b>zero dependencies</b>.
</p>

</div>

---

## 🌟 Features

- 🧮 **Dual Calculator Modes**:
  - **Standard Mode**: Everyday arithmetic (`+`, `−`, `×`, `÷`), percentages (`%`), sign toggle (`±`), clear (`AC`), and backspace (`⌫`).
  - **Scientific Mode**: Trigonometric functions (`sin`, `cos`, `tan`) with **DEG / RAD** angle toggle, logarithms (`log`, `ln`), powers & roots (`xʸ`, `x²`, `√x`, `1/x`), constants (`π`, `e`), factorial (`n!`), and parentheses.
- ⚡ **Live Real-time Preview**: Displays intermediate evaluated results in real time as you compose expressions.
- 🎯 **Floating Point Precision**: Automatically handles JavaScript floating point inaccuracies (e.g., `0.1 + 0.2 = 0.3`).
- 🔄 **Integrated Unit Converter**: Instant two-way conversion for:
  - **Length** (Meters, Kilometers, Centimeters, Millimeters, Miles, Yards, Feet, Inches)
  - **Weight & Mass** (Kilograms, Grams, Milligrams, Metric Tons, Pounds, Ounces)
  - **Temperature** (Celsius, Fahrenheit, Kelvin)
  - **Digital Data** (Bytes, KB, MB, GB, TB)
  - **Speed** (m/s, km/h, mph, knots)
  - **Time** (Seconds, Minutes, Hours, Days, Weeks)
- 🕒 **Persistent Calculation History**:
  - Fly-out drawer records calculations with timestamps.
  - One-click restore to inject past expressions or answers back into the calculator.
  - Persisted across sessions using `localStorage`.
- 🎨 **4 Custom Themes**:
  - **Obsidian Neon** (Default cosmic dark with indigo glow)
  - **Cyberpunk** (Electric cyan and hot magenta on onyx)
  - **Matrix Emerald** (Deep terminal obsidian with emerald glow)
  - **Frosted Light** (Apple-inspired clean frosted glass)
- 🔊 **Web Audio Synthesizer**:
  - Native browser audio click and chime synthesizer for tactile feedback (zero external audio files).
  - Can be toggled on/off with persistent memory.
- 📋 **One-Click Clipboard Copy**: Click the primary display or copy button to copy results instantly with toast alert feedback.
- 📱 **Fully Responsive**: Optimized for desktop, tablets, and smartphones.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `0` – `9` | Input Numbers |
| `.`, `,` | Decimal Point |
| `+`, `-`, `*`, `/` | Basic Operators (`+`, `−`, `×`, `÷`) |
| `^` | Power ($x^y$) |
| `%` | Percentage |
| `Enter` or `=` | Calculate Result |
| `Backspace` | Backspace / Delete Last Digit |
| `Escape` or `c` | Clear All (`AC`) |
| `(` and `)` | Parentheses |
| `h` / `H` | Toggle History Drawer |

---

## 🚀 Quick Start / Local Setup

Because OmniCalc is built with pure Vanilla web technologies, **no build step or installation is needed**.

### Option 1: Direct in Browser
Simply open `index.html` in your favorite web browser:
```bash
# On Windows
start index.html

# On macOS
open index.html

# On Linux
xdg-open index.html
```

### Option 2: Using a Local HTTP Server
```bash
# Using Python
python -m http.server 8080

# Or using Node.js npx serve
npx serve
```
Then visit: `http://localhost:8080`

---

## 🌐 Deploy to GitHub Pages (Free Hosting)

Deploy OmniCalc to the web in less than 1 minute:

1. Push this repository to your GitHub account (see instructions below).
2. On GitHub, navigate to your repository's **Settings** tab.
3. Click on **Pages** in the left sidebar (under "Code and automation").
4. Under **Build and deployment** > **Source**, select **Deploy from a branch**.
5. Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
6. Click **Save**.
7. In a few seconds, your calculator will be live at:
   `https://<your-username>.github.io/<your-repo-name>/`

---

## 📂 Project Structure

```
calculator/
├── .gitignore       # Git ignore rules for clean repository
├── LICENSE          # MIT Open Source License
├── README.md        # Documentation and guide
├── index.html       # Semantic HTML5 markup, accessibility & SEO
├── style.css        # Multi-theme CSS design system & animations
└── script.js        # Calculator evaluator engine, converter & audio
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
