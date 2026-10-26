/**
 * ASCII Knight - UI & Interaction Controller
 * Minimalist glassmorphic HUD, presets, audio toggle, screenshot, and keyboard shortcuts.
 */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("view");
    const hud = document.getElementById("hud");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");
    const hudBody = document.getElementById("hud-body");
    const audioBtn = document.getElementById("audio-btn");
    const playBtn = document.getElementById("play-btn");
    const themeSelect = document.getElementById("theme-select");
    const windSlider = document.getElementById("wind-slider");
    const waveSlider = document.getElementById("wave-slider");
    const grassSlider = document.getElementById("grass-slider");
    const glowSlider = document.getElementById("glow-slider");
    const resetBtn = document.getElementById("reset-btn");
    const screenshotBtn = document.getElementById("screenshot-btn");
    const copyAsciiBtn = document.getElementById("copy-ascii-btn");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const fpsBadge = document.getElementById("fps-badge");
    const gridBadge = document.getElementById("grid-badge");
    const toast = document.getElementById("toast");

    // Initialize Simulation
    const sim = new window.AsciiKnightSim(canvas);

    // Toast helper
    let toastTimeout = null;
    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add("show");
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
      }, 2400);
    }

    // FPS & Grid dimensions callback
    sim.onFpsUpdate = (fps, cols, rows) => {
      if (fpsBadge) fpsBadge.textContent = `${fps} FPS`;
      if (gridBadge) gridBadge.textContent = `${cols}×${rows}`;
    };

    // Toggle HUD visibility
    hudToggleBtn.addEventListener("click", () => {
      hud.classList.toggle("collapsed");
      const isCollapsed = hud.classList.contains("collapsed");
      hudToggleBtn.title = isCollapsed ? "Show Controls (H)" : "Hide Controls (H)";
    });

    // Audio Toggle
    audioBtn.addEventListener("click", () => {
      if (!sim.audio) return;
      const isAudible = sim.audio.toggle();
      audioBtn.innerHTML = isAudible
        ? `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg><span>Wind: ON</span>`
        : `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg><span>Wind: OFF</span>`;
      audioBtn.classList.toggle("active", isAudible);
      showToast(isAudible ? "Procedural Wind Ambience: ON" : "Wind Ambience: Muted");
    });

    // Play / Pause Toggle
    playBtn.addEventListener("click", () => {
      sim.params.paused = !sim.params.paused;
      playBtn.innerHTML = sim.params.paused
        ? `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>Resume</span>`
        : `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg><span>Pause</span>`;
      playBtn.classList.toggle("active", sim.params.paused);
      showToast(sim.params.paused ? "Paused (Space)" : "Resumed");
    });

    // Theme selector
    themeSelect.addEventListener("change", (e) => {
      sim.params.theme = e.target.value;
      showToast(`Theme: ${e.target.options[e.target.selectedIndex].text}`);
    });

    // Sliders
    windSlider.addEventListener("input", (e) => {
      sim.params.grassWind = parseFloat(e.target.value);
      document.getElementById("wind-val").textContent = sim.params.grassWind.toFixed(1);
    });

    waveSlider.addEventListener("input", (e) => {
      sim.params.wave = parseFloat(e.target.value);
      document.getElementById("wave-val").textContent = sim.params.wave.toFixed(1);
    });

    grassSlider.addEventListener("input", (e) => {
      sim.params.grassHeight = parseFloat(e.target.value);
      document.getElementById("grass-val").textContent = sim.params.grassHeight.toFixed(1);
      sim.initGrass();
    });

    glowSlider.addEventListener("input", (e) => {
      sim.params.glow = parseFloat(e.target.value);
      document.getElementById("glow-val").textContent = sim.params.glow.toFixed(2);
    });

    // Reset Defaults
    resetBtn.addEventListener("click", () => {
      sim.params.grassWind = 2.0;
      sim.params.wave = 3.2;
      sim.params.grassHeight = 1.7;
      sim.params.glow = 0.5;
      sim.params.theme = "classic";

      windSlider.value = "2.0";
      waveSlider.value = "3.2";
      grassSlider.value = "1.7";
      glowSlider.value = "0.5";
      themeSelect.value = "classic";

      document.getElementById("wind-val").textContent = "2.0";
      document.getElementById("wave-val").textContent = "3.2";
      document.getElementById("grass-val").textContent = "1.7";
      document.getElementById("glow-val").textContent = "0.50";

      sim.initGrass();
      showToast("Defaults restored!");
    });

    // Screenshot
    screenshotBtn.addEventListener("click", () => {
      sim.takeScreenshot();
      showToast("High-res screenshot downloaded!");
    });

    // Copy ASCII Frame
    copyAsciiBtn.addEventListener("click", async () => {
      const asciiText = sim.getAsciiText();
      try {
        await navigator.clipboard.writeText(asciiText);
        showToast("ASCII frame copied to clipboard!");
      } catch (err) {
        showToast("Failed to copy clipboard");
      }
    });

    // Fullscreen Toggle
    fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        showToast("Entered Fullscreen");
      } else {
        document.exitFullscreen().catch(() => {});
        showToast("Exited Fullscreen");
      }
    });

    // Resize Handler
    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        sim.handleResize();
      }, 350);
    });

    // Global Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      // Ignore if user is inside an input/select
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        playBtn.click();
      } else if (e.key === "h" || e.key === "H") {
        hudToggleBtn.click();
      } else if (e.key === "m" || e.key === "M") {
        audioBtn.click();
      } else if (e.key === "s" || e.key === "S") {
        screenshotBtn.click();
      } else if (e.key === "c" || e.key === "C") {
        copyAsciiBtn.click();
      } else if (e.key === "f" || e.key === "F") {
        fullscreenBtn.click();
      } else if (e.key === "r" || e.key === "R") {
        resetBtn.click();
      }
    });

    // Auto fade hint after 5 seconds
    const keyHint = document.getElementById("shortcut-hint");
    if (keyHint) {
      setTimeout(() => {
        keyHint.classList.add("fade-out");
      }, 6000);
    }
  });
})();
