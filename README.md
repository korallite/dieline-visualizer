# Dieline Generator – Web-Based CAD Tool

Interactive web-based **dieline generator** for packaging design (B1 box).  
Built with **HTML Canvas** and modular JavaScript logic.

---

## 🌟 Features

- Real-time calculation of **box dimensions** and **flaps**
- Interactive **canvas rendering** of dieline
- **SVG export** for production
- Clean **CAD mode / Light mode** interface
- Modular code: **logic separated from rendering** for easy maintenance
- Logic obfuscated to protect intellectual property

---

## 🛠 Tech Stack

- HTML5 / CSS3 / Tailwind (optional)
- Vanilla JavaScript
- Modular architecture: `logic.js` + `canvas.js`
- GitHub Pages deployment
- Obfuscated JavaScript for business logic

---

## 📊 How It Works

1. User inputs box dimensions: P, L, T, F, Pl, coakan  
2. `logic.js` calculates:
   - Panel positions
   - Flap dimensions
   - Total sheet width & height
3. `canvas.js` renders the dieline:
   - Panels, creases, flaps
   - Measurements in mm
4. User can export **SVG** for production or print

---

## 🔗 Live Demo

[https://karbox.my.id/] (https://korallite.github.io/dieline-visualizer)
