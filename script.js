/* Mudra Shah CV: all behaviour lives here. No dependencies.
   Sections: loader, reveals, hero letters, scenes, canvas background, cursor, nav, theme. */
(() => {
"use strict";

// bgEffect: "Dot field" | "Particles" | "Off"
const CONFIG = { bgEffect: "Dot field", customCursor: true, introLoader: true };

class CV {
  props = CONFIG;
  state = { roleIdx: 0, active: -1, indX: 0, indW: 0, scrolled: false };
  $ = (id) => document.getElementById(id);
  rootRef = { current: this.$("root") }; canvasRef = { current: this.$("bg") }; progRef = { current: this.$("progress") };
  tlRef = { current: this.$("timeline") }; fillRef = { current: this.$("timeline-fill") };
  ringRef = { current: this.$("cursor-ring") }; dotRef = { current: this.$("cursor-dot") };
  loaderRef = { current: this.$("loader") }; loaderNumRef = { current: this.$("loader-num") }; aboutRef = { current: this.$("about-text") };
  ids = ["about", "skills", "experience", "projects", "personal", "education", "contact"];

  INIT = {
    up: { opacity: 0, transform: "translateY(32px)" },
    word: { transform: "translateY(115%) rotate(14deg)" },
    line: { transform: "scaleX(0)" },
    drop: { opacity: 0 },
    flip: { opacity: 0, transform: "perspective(900px) rotateX(-75deg) translateY(30px)" },
    blur: { opacity: 0, transform: "translateX(-50px)", filter: "blur(10px)" },
  };
  mouse = { x: -999, y: -999 }; hovering = false; cleanups = []; ripples = []; vel = 0; mDir = 1;

  on(t, ev, fn, o) { t.addEventListener(ev, fn, o); this.cleanups.push(() => t.removeEventListener(ev, fn, o)); }

  mount() {
    this.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let theme = "dark"; try { theme = localStorage.getItem("theme") || "dark"; } catch (e) {}
    document.documentElement.dataset.theme = theme;
    if (!(CONFIG.customCursor && matchMedia("(pointer: fine)").matches)) {
      [this.ringRef, this.dotRef].forEach((r) => { r.current.remove(); r.current = null; });
    }
    this.$("year").textContent = new Date().getFullYear();
    this.header = this.$("header"); this.indicator = this.$("nav-indicator");
    this.navLinks = [...this.$("nav").querySelectorAll("a")];
    this.roleEls = [...this.rootRef.current.querySelectorAll("[data-role]")];
    const root = this.rootRef.current;
    this.words = [...root.querySelectorAll("[data-word]")];
    this.letters = [...root.querySelectorAll("[data-l]")].map((el) => ({ el, cx: 0, cy: 0, cur: 0 }));
    this.prepReveal();
    if (CONFIG.introLoader && !this.reduce) this.runLoader(() => this.startReveal());
    else { if (this.loaderRef.current) this.loaderRef.current.style.display = "none"; this.startReveal(); }
    this.setupAmbient(); this.setupLoops(); this.setupScenes();
    this.on(window, "scroll", this.onScroll, { passive: true });
    this.on(window, "resize", () => { this.lastActive = null; this.onScroll(); if (this.heroReady) this.cacheLetters(); });
    this.on(window, "mousemove", this.onMove, { passive: true });
    this.on(window, "click", this.onClick);
    this.on(document, "mouseleave", () => { this.mouse = { x: -999, y: -999 }; });
    this.on(this.$("theme-toggle"), "click", this.toggleTheme);
    this.on(this.$("email-link"), "mouseenter", this.waveEmail);
    this.renderRoles(true);
    if (!this.reduce) this.roleTimer = setInterval(() => { this.state.roleIdx = (this.state.roleIdx + 1) % this.roleEls.length; this.renderRoles(); }, 2600);
    setTimeout(this.onScroll, 50);
  }

  renderRoles(instant) {
    const n = this.roleEls.length, cur = this.state.roleIdx;
    this.roleEls.forEach((el, i) => {
      if (instant) el.style.transition = "none";
      el.style.transform = i === cur ? "translateY(0%)" : i === (cur - 1 + n) % n ? "translateY(-110%)" : "translateY(110%)";
      el.style.opacity = i === cur ? 1 : 0;
      if (instant) { el.offsetWidth; el.style.transition = ""; }
    });
  }

  renderNav() {
    const s = this.state;
    this.header.classList.toggle("scrolled", s.scrolled);
    this.navLinks.forEach((a, i) => a.classList.toggle("on", i === s.active));
    this.indicator.style.width = s.indW + "px";
    this.indicator.style.transform = `translateX(${s.indX}px)`;
    this.indicator.style.opacity = s.active >= 0 ? 1 : 0;
  }

  onScroll = () => {
    const h = document.documentElement, vh = innerHeight;
    if (this.progRef.current) this.progRef.current.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`;
    const scrolled = scrollY > 30;
    const active = this.ids.findIndex((id) => { const s = document.getElementById(id); if (!s) return false; const r = s.getBoundingClientRect(); return r.top <= vh / 3 && r.bottom > vh / 3; });
    if (active !== this.lastActive || scrolled !== this.state.scrolled) {
      this.lastActive = active;
      const link = this.navLinks[active];
      Object.assign(this.state, { scrolled, active, indX: link ? link.offsetLeft : this.state.indX, indW: link ? link.offsetWidth : this.state.indW });
      this.renderNav();
    }
    const tl = this.tlRef.current, fill = this.fillRef.current;
    if (tl && fill) {
      const r = tl.getBoundingClientRect(), line = vh * 0.6;
      fill.style.transform = `scaleY(${Math.max(0, Math.min(1, (line - r.top) / r.height))})`;
      tl.querySelectorAll("[data-dot]").forEach((d) => {
        const lit = d.getBoundingClientRect().top < line;
        d.style.borderColor = lit ? "var(--accent2)" : "";
        d.style.boxShadow = lit ? "0 0 0 5px color-mix(in srgb, var(--accent2) 22%, transparent), 0 0 18px var(--accent2)" : "";
        d.style.transform = lit ? "scale(1.1)" : "";
      });
    }
    const ab = this.aboutRef.current;
    if (ab && this.words && !this.reduce) {
      const r = ab.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.3)));
      const lit = p * this.words.length * 1.15;
      this.words.forEach((w, i) => { const on = i < lit; if (w._on !== on) { w._on = on; w.style.opacity = on ? 1 : 0.18; w.style.color = on && i > lit - 3 ? "var(--accent2)" : ""; } else if (on) w.style.color = i > lit - 3 ? "var(--accent2)" : ""; });
    }
  };

  sceneAnim(el) {
    const a = el.dataset.a, d = +(el.dataset.d || 0), x = el.dataset.x, y = el.dataset.y, I = Infinity;
    const o = (duration, extra) => Object.assign({ duration, iterations: I, delay: d }, extra || {});
    switch (a) {
      case "pkt": return [[{ left: "12%", opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.85 }, { left: "74%", opacity: 0 }], o(2000, { easing: "cubic-bezier(.5,0,.5,1)" })];
      case "ring": return [[{ transform: "scale(.6)", opacity: 0.9 }, { transform: "scale(2.8)", opacity: 0 }], o(1600, { easing: "ease-out" })];
      case "live": return [[{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }], o(1200)];
      case "coin": return [[{ transform: "translateY(0) scale(.5)", opacity: 0 }, { transform: "translateY(-10px) scale(1)", opacity: 1, offset: 0.25 }, { transform: "translateY(-32px) scale(1)", opacity: 0 }], o(2400, { easing: "ease-out" })];
      case "road": return [[{ backgroundPosition: "0 0" }, { backgroundPosition: "-28px 0" }], o(320)];
      case "truck": return [[{ left: "-30%" }, { left: "105%" }], o(5200)];
      case "route": return [[{ transform: "scaleX(0)" }, { transform: "scaleX(1)", offset: 0.9 }, { transform: "scaleX(1)" }], o(5200)];
      case "bump": return [[{ transform: "translateY(0)" }, { transform: "translateY(-1.5px)" }, { transform: "translateY(0)" }], o(260)];
      case "wheel": return [[{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], o(420)];
      case "led": return [[{ background: "var(--accent2)" }, { background: "var(--accent2)", offset: 0.6 }, { background: "oklch(0.8 0.15 80)", offset: 0.72 }, { background: "oklch(0.66 0.2 25)", offset: 0.84 }, { background: "oklch(0.66 0.2 25)", offset: 0.96 }, { background: "var(--accent2)" }], o(4200)];
      case "screen": return [[{ opacity: 0.6 }, { opacity: 0.6, offset: 0.72 }, { opacity: 0.1, offset: 0.84 }, { opacity: 0.1, offset: 0.96 }, { opacity: 0.6 }], o(4200)];
      case "meter": return [[{ width: "100%" }, { width: "0%", offset: 0.85 }, { width: "0%", offset: 0.95 }, { width: "100%" }], o(4200)];
      case "env": return [[{ left: "50%", top: "18%", opacity: 0 }, { opacity: 1, offset: 0.06 }, { left: "50%", top: "46%", offset: 0.28 }, { left: x, top: "46%", offset: 0.55 }, { left: x, top: "66%", opacity: 1, offset: 0.74 }, { left: x, top: "66%", opacity: 0, offset: 0.8 }, { left: x, top: "66%", opacity: 0 }], o(4500, { easing: "ease-in-out" })];
      case "pop": return [[{ transform: "translateX(-50%) scale(1)", background: "var(--bg)" }, { transform: "translateX(-50%) scale(1)", background: "var(--bg)", offset: 0.72 }, { transform: "translateX(-50%) scale(1.28)", background: "color-mix(in srgb, var(--accent2) 30%, var(--bg))", offset: 0.79 }, { transform: "translateX(-50%) scale(1)", background: "var(--bg)", offset: 0.9 }, { transform: "translateX(-50%) scale(1)", background: "var(--bg)" }], o(4500)];
      case "plane": return [[{ left: "-15%", top: "44%" }, { left: "45%", top: "12%" }, { left: "112%", top: "30%" }], o(5600)];
      case "train": return [[{ left: "110%" }, { left: "-48%" }], o(4200)];
      case "win": return [[{ opacity: 0.15 }, { opacity: 0.15, offset: 0.4 }, { opacity: 1, offset: 0.48 }, { opacity: 1, offset: 0.85 }, { opacity: 0.15 }], o(3200)];
      case "scan": return [[{ top: "6px" }, { top: "100%" }], o(1400)];
      case "docin": return [[{ left: "22%", top: y, opacity: 0 }, { opacity: 1, offset: 0.1 }, { left: "47%", top: "50%", opacity: 1, offset: 0.85 }, { left: "50%", top: "50%", opacity: 0 }], o(1800, { easing: "ease-in" })];
      case "docout": return [[{ left: "53%", top: "50%", opacity: 0 }, { opacity: 1, offset: 0.15 }, { left: x, top: y, opacity: 1, offset: 0.85 }, { left: x, top: y, opacity: 0 }], o(1800, { easing: "ease-out" })];
      case "tick": return [[{ background: "transparent", borderColor: "var(--border)" }, { background: "transparent", borderColor: "var(--border)", offset: 0.15 }, { background: "var(--accent2)", borderColor: "var(--accent2)", offset: 0.2 }, { background: "var(--accent2)", borderColor: "var(--accent2)", offset: 0.88 }, { background: "transparent", borderColor: "var(--border)" }], o(4000)];
      case "fuel": return [[{ width: "12%" }, { width: "12%", offset: 0.1 }, { width: "100%", offset: 0.7 }, { width: "100%", offset: 0.92 }, { width: "12%" }], o(4000, { easing: "ease-in-out" })];
      case "gps": return [[{ left: "14%", top: "72%" }, { left: "14%", top: "40%", offset: 0.2 }, { left: "46%", top: "40%", offset: 0.45 }, { left: "46%", top: "62%", offset: 0.6 }, { left: "74%", top: "62%", offset: 0.8 }, { left: "74%", top: "30%", offset: 0.95 }, { left: "74%", top: "30%" }], o(5100)];
      case "tab": return [[{ background: "var(--accent)", color: "#fff" }, { background: "var(--accent)", color: "#fff", offset: 0.31 }, { background: "transparent", color: "var(--muted)", offset: 0.34 }, { background: "transparent", color: "var(--muted)", offset: 0.98 }, { background: "var(--accent)", color: "#fff" }], o(5100)];
      case "invoice": return [[{ transform: "translateY(130%)", opacity: 0 }, { transform: "translateY(130%)", opacity: 0, offset: 0.78 }, { transform: "none", opacity: 1, offset: 0.9 }, { transform: "none", opacity: 1, offset: 0.97 }, { transform: "translateY(-15%)", opacity: 0 }], o(5100, { easing: "cubic-bezier(.2,.8,.2,1)" })];
      case "bid": return [[{ width: "0%" }, { width: x, offset: 0.4 }, { width: x, offset: 0.92 }, { width: "0%" }], o(4800, { easing: "ease-out" })];
      case "closed": return [[{ transform: "translate(-50%,-50%) rotate(-8deg) scale(2.2)", opacity: 0 }, { transform: "translate(-50%,-50%) rotate(-8deg) scale(2.2)", opacity: 0, offset: 0.44 }, { transform: "translate(-50%,-50%) rotate(-8deg) scale(1)", opacity: 1, offset: 0.52 }, { transform: "translate(-50%,-50%) rotate(-8deg) scale(1)", opacity: 1, offset: 0.92 }, { transform: "translate(-50%,-50%) rotate(-8deg) scale(1)", opacity: 0 }], o(4800, { easing: "cubic-bezier(.5,0,.75,1.3)" })];
      case "mail": return [[{ left: "82%", top: "46%", opacity: 0 }, { left: "82%", top: "46%", opacity: 0, offset: 0.58 }, { left: "84%", top: "40%", opacity: 1, offset: 0.62 }, { left: "97%", top: "8%", opacity: 0, offset: 0.8 }, { left: "97%", top: "8%", opacity: 0 }], o(4800, { easing: "ease-in" })];
      case "gatetruck": return [[{ left: "-20%", opacity: 1 }, { left: "50%", opacity: 1, offset: 0.85 }, { left: "58%", opacity: 0 }], o(3600)];
      case "barrier": return [[{ transform: "rotate(-75deg)" }, { transform: "rotate(-75deg)", offset: 0.6 }, { transform: "rotate(0deg)", offset: 0.7 }, { transform: "rotate(0deg)", offset: 0.88 }, { transform: "rotate(-75deg)" }], o(1800, { easing: "ease-in-out" })];
      case "codeco": return [[{ left: "32%", top: "40%", opacity: 0 }, { left: "32%", top: "40%", opacity: 0, offset: 0.3 }, { left: "33%", top: "40%", opacity: 1, offset: 0.35 }, { left: "78%", top: "78%", opacity: 1, offset: 0.75 }, { left: "78%", top: "78%", opacity: 0, offset: 0.8 }, { left: "78%", top: "78%", opacity: 0 }], o(1800, { easing: "ease-in-out" })];
      case "move": { const ds = el.dataset, dur = +ds.dur || 1800, f = dur > 3000 ? 0.12 : 0.85;
        return [[{ left: ds.x0, top: ds.y0, opacity: 0 }, { opacity: 1, offset: f * 0.15 }, { left: ds.x1, top: ds.y1, opacity: 1, offset: f }, { left: ds.x1, top: ds.y1, opacity: 0, offset: Math.min(1, f + 0.03) }, { left: ds.x1, top: ds.y1, opacity: 0 }], o(dur, { easing: "ease-in-out" })]; }
      case "daycard": return [[{ opacity: 0, transform: "translateX(24px)" }, { opacity: 0, transform: "translateX(24px)", offset: 0.1 }, { opacity: 1, transform: "none", offset: 0.18 }, { opacity: 1, transform: "none", offset: 0.9 }, { opacity: 0, transform: "none" }], o(6000, { easing: "cubic-bezier(.2,.8,.2,1)" })];
      case "type": return [[{ maxWidth: "0px", easing: "steps(14,end)" }, { maxWidth: "120px", offset: 0.3 }, { maxWidth: "120px", offset: 0.85 }, { maxWidth: "0px" }], o(6000)];
      case "cur1": return [[{ opacity: 1 }, { opacity: 1, offset: 0.42 }, { opacity: 0, offset: 0.5 }, { opacity: 0, offset: 0.92 }, { opacity: 1 }], o(3600)];
      case "cur2": return [[{ opacity: 0 }, { opacity: 0, offset: 0.42 }, { opacity: 1, offset: 0.5 }, { opacity: 1, offset: 0.92 }, { opacity: 0 }], o(3600)];
      case "fill": return [[{ height: "15%" }, { height: "85%" }], o(5000, { direction: "alternate", easing: "ease-in-out" })];
    }
    return null;
  }

  setupScenes() {
    if (this.reduce) return;
    const scenes = [...this.rootRef.current.querySelectorAll("[data-scene]")];
    scenes.forEach((sc) => {
      sc._anims = [...sc.querySelectorAll("[data-a]")].map((el) => { const b = this.sceneAnim(el); return b && el.animate(b[0], b[1]); }).filter(Boolean);
      sc._anims.forEach((a) => a.pause());
    });
    this.sceneIO = new IntersectionObserver((entries) => entries.forEach((e) => (e.target._anims || []).forEach((a) => (e.isIntersecting ? a.play() : a.pause()))), { threshold: 0 });
    scenes.forEach((sc) => this.sceneIO.observe(sc));
  }

  runLoader(cb) {
    const L = this.loaderRef.current, N = this.loaderNumRef.current;
    if (!L) return cb();
    const t0 = performance.now(), D = 1100;
    let finished = false;
    const fallback = setTimeout(() => tick(t0 + D), D + 900);
    const tick = (t) => {
      if (finished) return;
      const p = Math.min((t - t0) / D, 1);
      if (N) N.textContent = Math.round((1 - Math.pow(1 - p, 3)) * 100);
      if (p < 1) return requestAnimationFrame(tick);
      finished = true; clearTimeout(fallback);
      const a = L.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }], { duration: 900, delay: 120, easing: "cubic-bezier(.8,0,.2,1)", fill: "forwards" });
      a.onfinish = () => { L.style.display = "none"; };
      setTimeout(cb, 380);
    };
    requestAnimationFrame(tick);
  }

  prepReveal() {
    const root = this.rootRef.current;
    if (this.reduce) {
      root.querySelectorAll("[data-w]").forEach((b) => (b.style.width = b.dataset.w + "%"));
      root.querySelectorAll("[data-count]").forEach((c) => (c.textContent = c.dataset.count + "+"));
      this.words.forEach((w) => (w.style.opacity = 1));
      return;
    }
    root.querySelectorAll("[data-reveal]").forEach((el) => Object.assign(el.style, this.INIT[el.dataset.reveal] || this.INIT.up));
    root.querySelectorAll("[data-card]").forEach((c) => (c.style.opacity = 0));
  }

  startReveal() {
    if (this.reduce) return;
    const root = this.rootRef.current, targetOf = new Map();
    this.io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      this.io.unobserve(e.target);
      (targetOf.get(e.target) || []).forEach((el) => this.playReveal(el));
    }), { threshold: 0.12 });
    root.querySelectorAll("[data-reveal]").forEach((el) => {
      const k = el.dataset.reveal, obs = k === "word" || k === "line" ? el.parentElement : el;
      if (!targetOf.has(obs)) targetOf.set(obs, []);
      targetOf.get(obs).push(el);
      this.io.observe(obs);
    });
    this.dealIO = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      this.dealIO.unobserve(e.target); this.deal(e.target);
    }), { threshold: 0.08 });
    root.querySelectorAll("[data-deal]").forEach((g) => this.dealIO.observe(g));
    setTimeout(() => { this.heroReady = true; this.cacheLetters(); }, 1500);
  }

  clear(el, a) { a.onfinish = () => { ["opacity", "transform", "filter"].forEach((p) => el.style.removeProperty(p)); a.cancel(); }; }

  playReveal(el) {
    const d = +el.dataset.delay || 0, k = el.dataset.reveal, from = this.INIT[k] || this.INIT.up;
    let kf, opt;
    if (k === "drop") {
      const r = (Math.random() - 0.5) * 50;
      kf = [
        { opacity: 0, transform: `translateY(-180px) rotate(${r}deg)`, easing: "cubic-bezier(.55,0,1,.45)" },
        { opacity: 1, transform: `translateY(0) rotate(${r * 0.25}deg)`, offset: 0.55, easing: "cubic-bezier(0,.55,.45,1)" },
        { opacity: 1, transform: "translateY(-18px) rotate(0deg)", offset: 0.75, easing: "cubic-bezier(.55,0,1,.45)" },
        { opacity: 1, transform: "translateY(0) rotate(0deg)" },
      ];
      opt = { duration: 1050, delay: d, fill: "both" };
    } else {
      const to = {};
      Object.keys(from).forEach((p) => (to[p] = p === "opacity" ? 1 : p === "filter" ? "blur(0px)" : k === "line" ? "scaleX(1)" : "none"));
      kf = [from, to];
      opt = { duration: k === "word" ? 1000 : k === "flip" ? 1100 : 900, delay: d, fill: "both", easing: k === "word" ? "cubic-bezier(.7,0,.2,1)" : "cubic-bezier(.2,.8,.2,1)" };
    }
    this.clear(el, el.animate(kf, opt));
    const ease = "cubic-bezier(.2,.8,.2,1)";
    el.querySelectorAll("[data-w]").forEach((b, i) => {
      const a = b.animate([{ width: "0%" }, { width: b.dataset.w + "%" }], { duration: 1300, delay: d + 350 + i * 70, easing: ease, fill: "forwards" });
      a.onfinish = () => { b.style.width = b.dataset.w + "%"; a.cancel(); };
    });
    el.querySelectorAll("[data-count]").forEach((c) => setTimeout(() => this.countUp(c), d));
    el.querySelectorAll("[data-scramble]").forEach((h) => this.scramble(h, d));
  }

  deal(grid) {
    const g = grid.getBoundingClientRect();
    const cx = g.left + g.width / 2, cy = Math.max(g.top, 0) + Math.min(g.bottom, innerHeight) / 2 - Math.max(g.top, 0) / 2;
    grid.querySelectorAll("[data-card]").forEach((c, i) => {
      const r = c.getBoundingClientRect(), dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      const rot = (Math.random() - 0.5) * 40;
      const a = c.animate([
        { opacity: 0, transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(.55)` },
        { opacity: 1, transform: `translate(${dx * 0.85}px,${dy * 0.85}px) rotate(${rot * 0.8}deg) scale(.62)`, offset: 0.12 },
        { opacity: 1, transform: "none" },
      ], { duration: 1150, delay: 120 + i * 130, easing: "cubic-bezier(.2,.9,.25,1)", fill: "both" });
      a.onfinish = () => { c.style.removeProperty("opacity"); a.cancel(); };
    });
  }


  scramble(h, delay) {
    const fin = h.dataset.final || (h.dataset.final = h.textContent);
    const G = "!<>-_/[]{}=+*^?#%ABCDEFXYZ0123456789";
    const ends = [...fin].map((_, i) => 250 + i * (520 / fin.length) + Math.random() * 280);
    const t0 = performance.now() + delay;
    const iv = setInterval(() => {
      const e = performance.now() - t0; let out = "", done = true;
      for (let i = 0; i < fin.length; i++) {
        if (fin[i] === " " || e >= ends[i]) out += fin[i];
        else { done = false; out += G[(Math.random() * G.length) | 0]; }
      }
      h.textContent = out;
      if (done) clearInterval(iv);
    }, 45);
  }

  countUp(el) {
    const end = +el.dataset.count, t0 = performance.now();
    const tick = (t) => { const p = Math.min((t - t0) / 1400, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + (p === 1 ? "+" : ""); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  cacheLetters() {
    (this.letters || []).forEach((L) => {
      L.el.parentElement.style.overflow = "visible";
      const prev = L.el.style.transform; L.el.style.transform = "";
      const r = L.el.getBoundingClientRect();
      L.cx = r.left + r.width / 2 + scrollX; L.cy = r.top + r.height / 2 + scrollY;
      L.el.style.transform = prev;
    });
  }

  setupAmbient() {
    const root = this.rootRef.current; if (!root || this.reduce) return;
    root.querySelectorAll("[data-wheel]").forEach((el) => el.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(14px)", opacity: 0 }], { duration: 1600, iterations: Infinity }));
    const m = root.querySelector("[data-marquee]");
    if (m) {
      this.mAnim = m.animate([{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }], { duration: 38000, iterations: Infinity });
      this.mSkew = root.querySelector("[data-mskew]");
      const band = this.mSkew.parentElement;
      band.addEventListener("mouseenter", () => (this.mHover = true));
      band.addEventListener("mouseleave", () => (this.mHover = false));
    }
  }

  onMove = (e) => {
    this.mouse = { x: e.clientX, y: e.clientY };
    const t = e.target && e.target.closest ? e.target : null;
    this.hovering = !!(t && t.closest("a,button"));
    const m = t && t.closest("[data-magnetic]");
    if (this.mag && this.mag !== m) this.mag.style.transform = "";
    this.mag = m;
    if (m) { const r = m.getBoundingClientRect(); m.style.transition = (m.style.transition ? m.style.transition + "," : "") + "transform .25s cubic-bezier(.2,.8,.2,1)"; m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.28}px,${(e.clientY - r.top - r.height / 2) * 0.38}px)`; }
    const c = t && t.closest("[data-tilt]");
    if (this.tilt && this.tilt !== c) { this.tilt.style.transform = ""; const s = this.tilt.querySelector("[data-spot]"); if (s) s.style.opacity = 0; }
    this.tilt = c;
    if (c && !this.reduce) {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
      c.style.transition = "transform .15s ease-out, border-color .3s";
      c.style.transform = `rotateY(${(x - 0.5) * 9}deg) rotateX(${(0.5 - y) * 9}deg) translateZ(8px)`;
      const s = c.querySelector("[data-spot]"); if (s) s.style.opacity = 1;
    }
  };

  onClick = (e) => {
    if (this.reduce) return;
    const now = performance.now();
    this.ripples.push({ x: e.clientX, y: e.clientY, t: now });
    if (this.pts) this.pts.forEach((p) => { const dx = p.x - e.clientX, dy = p.y - e.clientY, d = Math.hypot(dx, dy) || 1; if (d < 260) { p.vx += (dx / d) * 3 * (1 - d / 260); p.vy += (dy / d) * 3 * (1 - d / 260); } });
    const ring = document.createElement("div");
    Object.assign(ring.style, { position: "fixed", left: e.clientX - 10 + "px", top: e.clientY - 10 + "px", width: "20px", height: "20px", borderRadius: "50%", border: "2px solid var(--accent2)", pointerEvents: "none", zIndex: 199 });
    document.body.appendChild(ring);
    ring.animate([{ transform: "scale(0)", opacity: 0.9 }, { transform: "scale(9)", opacity: 0 }], { duration: 750, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = () => ring.remove();
  };

  waveEmail = (e) => {
    if (this.reduce) return;
    e.currentTarget.querySelectorAll("[data-el]").forEach((s, i) => s.animate([{ transform: "none" }, { transform: "translateY(-16px) rotate(-8deg) scale(1.15)" }, { transform: "none" }], { duration: 560, delay: i * 24, easing: "cubic-bezier(.3,.7,.4,1)" }));
  };

  setupLoops() {
    const cv = this.canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    let w, h;
    const init = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.pts = Array.from({ length: Math.min(90, Math.floor((w * h) / 18000)) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 }));
    };
    init(); this.on(window, "resize", init);
    const sm = { x: -999, y: -999 }, ring = { x: -100, y: -100, s: 1 };
    let lastY = scrollY;
    const frame = (t) => {
      this.raf = requestAnimationFrame(frame);
      const M = this.mouse;
      if (M.x < -900) { sm.x = sm.y = -999; } else if (sm.x < -900) { sm.x = M.x; sm.y = M.y; } else { sm.x += (M.x - sm.x) * 0.1; sm.y += (M.y - sm.y) * 0.1; }
      const rg = this.ringRef.current, dt = this.dotRef.current;
      if (rg && dt) {
        if (ring.x < -90) { ring.x = M.x; ring.y = M.y; }
        ring.x += (M.x - ring.x) * 0.18; ring.y += (M.y - ring.y) * 0.18; ring.s += ((this.hovering ? 1.8 : 1) - ring.s) * 0.18;
        rg.style.transform = `translate(${ring.x - 18}px,${ring.y - 18}px) scale(${ring.s})`;
        rg.style.background = this.hovering ? "color-mix(in srgb, var(--accent2) 14%, transparent)" : "transparent";
        dt.style.transform = `translate(${M.x - 3}px,${M.y - 3}px) scale(${this.hovering ? 0 : 1})`;
      }
      if (!this.reduce) {
        const v = scrollY - lastY; lastY = scrollY;
        this.vel += (v - this.vel) * 0.12;
        if (this.mAnim) {
          if (Math.abs(this.vel) > 0.8) this.mDir = this.vel < 0 ? -1 : 1;
          this.mAnim.playbackRate = (1 + Math.min(Math.abs(this.vel) * 0.35, 10)) * this.mDir * (this.mHover ? 0.25 : 1);
          if (this.mSkew) this.mSkew.style.transform = `skewX(${Math.max(-14, Math.min(14, -this.vel * 0.5))}deg)`;
        }
        if (this.heroReady && this.letters) {
          for (const L of this.letters) {
            const dx = M.x - L.cx, dy = M.y - (L.cy - scrollY), d = Math.hypot(dx, dy);
            const target = M.x < -900 ? 0 : Math.max(0, 1 - d / 240);
            L.cur += (target - L.cur) * 0.14;
            if (L.cur > 0.002 || L.moved) {
              L.moved = L.cur > 0.002;
              L.el.style.transform = L.moved ? `translateY(${-L.cur * 26}px) rotate(${(-dx / 240) * 12 * L.cur}deg) scale(${1 + L.cur * 0.14})` : "";
            }
          }
        }
      }
      const mode = this.props.bgEffect ?? "Dot field";
      ctx.clearRect(0, 0, w, h);
      this.ripples = this.ripples.filter((r) => t - r.t < 1600);
      if (mode === "Off") return;
      const light = document.documentElement.dataset.theme === "light";
      const rgb = light ? "90,70,220" : "140,150,255", cy = light ? "8,145,178" : "34,211,238";
      if (mode === "Particles") {
        const pts = this.pts;
        for (const p of pts) {
          if (!this.reduce) { p.x += p.vx; p.y += p.vy; p.vx *= 0.985; p.vy *= 0.985; if (Math.hypot(p.vx, p.vy) < 0.2) { p.vx += (Math.random() - 0.5) * 0.05; p.vy += (Math.random() - 0.5) * 0.05; } }
          if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
          const dx = p.x - M.x, dy = p.y - M.y, d = Math.hypot(dx, dy);
          if (d < 120 && d > 0) { p.x += (dx / d) * 1.2; p.y += (dy / d) * 1.2; }
          ctx.fillStyle = `rgba(${rgb},.7)`; ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 7); ctx.fill();
        }
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 130) { ctx.strokeStyle = `rgba(${rgb},${0.25 * (1 - d / 130)})`; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
        }
        return;
      }
      const S = 30, tt = this.reduce ? 0 : t, R = this.ripples;
      for (let y = S / 2; y < h; y += S) for (let x = S / 2; x < w; x += S) {
        const dx = x - sm.x, dy = y - sm.y, d = Math.hypot(dx, dy) || 1;
        const m = Math.max(0, 1 - d / 210), wave = Math.sin(x * 0.011 + y * 0.007 + tt * 0.0011) * 0.5 + 0.5;
        let px = x + (dx / d) * m * m * 16, py = y + (dy / d) * m * m * 16, band = 0;
        for (const rp of R) {
          const age = t - rp.t, rx = x - rp.x, ry = y - rp.y, rd = Math.hypot(rx, ry) || 1;
          const b = Math.exp(-Math.pow((rd - age * 0.6) / 36, 2)) * (1 - age / 1600);
          if (b > 0.01) { px += (rx / rd) * b * 16; py += (ry / rd) * b * 16; band = Math.max(band, b); }
        }
        const a = 0.06 + wave * 0.1 + m * 0.6 + band * 0.7, r = 0.9 + wave * 0.5 + m * 2 + band * 2;
        ctx.fillStyle = m > 0.05 || band > 0.08 ? `rgba(${cy},${Math.min(a, 1)})` : `rgba(${rgb},${a})`;
        ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
      }
    };
    this.raf = requestAnimationFrame(frame);
  }

  toggleTheme = (e) => {
    const root = document.documentElement, next = root.dataset.theme === "light" ? "dark" : "light";
    const apply = () => { root.dataset.theme = next; try { localStorage.setItem("theme", next); } catch (er) {} };
    if (!document.startViewTransition || this.reduce) return apply();
    const x = e.clientX, y = e.clientY, R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] }, { duration: 750, easing: "cubic-bezier(.7,0,.2,1)", pseudoElement: "::view-transition-new(root)" }));
  };
}

new CV().mount();
})();
