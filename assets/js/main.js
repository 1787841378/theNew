/* =========================================================================
   魔方复原格 · 三阶魔方教程 — interactions
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FACE_COLORS = {
    U: "#FFC93C",
    D: "#F1F4F9",
    F: "#2E6BFF",
    B: "#1DBF73",
    R: "#FF3A5E",
    L: "#FF8A3D",
  };
  var FACE_NAMES = { F: "前", U: "上", R: "右", L: "左", D: "下", B: "后" };
  var FACE_SIDES = {
    front: "F",
    back: "B",
    right: "R",
    left: "L",
    top: "U",
    bottom: "D",
  };

  /* ---------------------------------------------------------------- utils */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  /* ----------------------------------------------------------- 3D cube */
  function buildCube(el) {
    if (!el) return;
    el.innerHTML = "";
    Object.keys(FACE_SIDES).forEach(function (side) {
      var face = document.createElement("div");
      face.className = "face f-" + side;
      var color = FACE_COLORS[FACE_SIDES[side]];
      for (var i = 0; i < 9; i++) {
        var sticker = document.createElement("span");
        sticker.className = "sticker";
        sticker.style.setProperty("--c", color);
        face.appendChild(sticker);
      }
      el.appendChild(face);
    });
  }

  /* ------------------------------------------------------- hero cube */
  function initHeroCube() {
    var stage = $("#heroCubeStage");
    var cube = $("#heroCube");
    if (!stage || !cube) return;
    buildCube(cube);

    var state = { rx: -24, ry: -34, vx: 0, vy: 0, dragging: false, visible: true };
    var lastPointer = { x: 0, y: 0 };
    var rafId = 0;
    var lastTime = 0;

    function render() {
      cube.style.transform =
        "rotateX(" + state.rx.toFixed(2) + "deg) rotateY(" + state.ry.toFixed(2) + "deg)";
    }

    function frame(now) {
      var dt = lastTime ? Math.min(now - lastTime, 48) / 16.667 : 1;
      lastTime = now;
      if (!state.dragging) {
        if (Math.abs(state.vx) > 0.01 || Math.abs(state.vy) > 0.01) {
          state.ry += state.vx;
          state.rx = clamp(state.rx - state.vy, -80, 80);
          state.vx *= 0.93;
          state.vy *= 0.93;
        } else if (!reduceMotion) {
          state.ry += 0.16 * dt;
        }
        render();
      }
      rafId = window.requestAnimationFrame(frame);
    }

    function start() {
      if (!rafId) {
        lastTime = 0;
        rafId = window.requestAnimationFrame(frame);
      }
    }
    function stop() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    render();

    /* drag / touch */
    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      state.dragging = true;
      state.vx = 0;
      state.vy = 0;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
      stage.classList.add("is-dragging");
      if (stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
      start();
    });

    stage.addEventListener("pointermove", function (e) {
      if (!state.dragging) return;
      var dx = e.clientX - lastPointer.x;
      var dy = e.clientY - lastPointer.y;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
      state.ry += dx * 0.45;
      state.rx = clamp(state.rx - dy * 0.45, -80, 80);
      state.vx = dx * 0.45;
      state.vy = dy * 0.45;
      render();
    });

    function endDrag(e) {
      if (!state.dragging) return;
      state.dragging = false;
      stage.classList.remove("is-dragging");
      if (e && e.pointerId !== undefined && stage.releasePointerCapture) {
        try {
          stage.releasePointerCapture(e.pointerId);
        } catch (err) {
          /* noop */
        }
      }
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", function () {
      if (state.dragging) endDrag();
    });

    /* keyboard */
    stage.addEventListener("keydown", function (e) {
      var step = 8;
      var handled = true;
      switch (e.key) {
        case "ArrowLeft":
          state.ry -= step;
          break;
        case "ArrowRight":
          state.ry += step;
          break;
        case "ArrowUp":
          state.rx = clamp(state.rx - step, -80, 80);
          break;
        case "ArrowDown":
          state.rx = clamp(state.rx + step, -80, 80);
          break;
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        state.vx = 0;
        state.vy = 0;
        render();
      }
    });

    /* pause when off screen */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          state.visible = entries[0].isIntersecting;
          if (state.visible) start();
          else stop();
        },
        { threshold: 0.05 }
      ).observe(stage);
    } else {
      start();
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (state.visible) start();
    });
  }

  /* -------------------------------------------------- notation demo */
  function initNotationDemo() {
    var cube = $("#demoCube");
    var arrow = $("#turnArrow");
    var formulaEl = $("#demoFormula");
    var meaningEl = $("#demoMeaning");
    var faceButtons = $$(".face-btn");
    var dirButtons = $$(".dir-btn");
    if (!cube) return;
    buildCube(cube);

    var FACING = {
      F: { x: 0, y: 0 },
      B: { x: 0, y: 180 },
      R: { x: 0, y: -90 },
      L: { x: 0, y: 90 },
      U: { x: -90, y: 0 },
      D: { x: 90, y: 0 },
    };
    var state = { face: "R", dir: "cw", spin: 0 };

    function render() {
      cube.style.transform =
        "rotateZ(" +
        state.spin +
        "deg) rotateX(" +
        FACING[state.face].x +
        "deg) rotateY(" +
        FACING[state.face].y +
        "deg)";
    }

    function setReadout() {
      var mark = state.dir === "cw" ? "" : state.dir === "ccw" ? "\u2032" : "2";
      var text =
        state.dir === "cw"
          ? "顺时针旋转 90°"
          : state.dir === "ccw"
          ? "逆时针旋转 90°"
          : "旋转 180°";
      if (formulaEl) formulaEl.textContent = state.face + mark;
      if (meaningEl) meaningEl.textContent = FACE_NAMES[state.face] + "面" + text;
    }

    function pulseArrow() {
      if (!arrow) return;
      arrow.classList.remove("is-cw", "is-ccw", "is-half", "is-on");
      // force reflow so the class toggle restarts the transition
      void arrow.offsetWidth;
      arrow.classList.add("is-" + (state.dir === "cw" ? "cw" : state.dir === "ccw" ? "ccw" : "half"));
      arrow.classList.add("is-on");
      window.clearTimeout(pulseArrow.timer);
      pulseArrow.timer = window.setTimeout(function () {
        arrow.classList.remove("is-on");
      }, 950);
    }

    function turn() {
      var delta = state.dir === "cw" ? 90 : state.dir === "ccw" ? -90 : 180;
      state.spin += delta;
      if (Math.abs(state.spin) > 720) state.spin = state.spin % 360;
      render();
      setReadout();
      pulseArrow();
    }

    faceButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.face = btn.dataset.face;
        faceButtons.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        render();
        setReadout();
        pulseArrow();
      });
    });

    dirButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.dir = btn.dataset.dir;
        dirButtons.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        turn();
      });
    });

    if (formulaEl) {
      formulaEl.addEventListener("click", turn);
      formulaEl.style.cursor = "pointer";
      formulaEl.title = "点击再转一次";
    }

    render();
    setReadout();
  }

  /* --------------------------------------------------- layer diagram */
  function initLayerHighlight() {
    var items = $$(".layer-list li");
    if (!items.length) return;
    var groups = $$("#layerDiagram .layer");
    function light(index) {
      groups.forEach(function (g) {
        g.classList.toggle("is-lit", g.getAttribute("data-layer") === String(index));
      });
    }
    items.forEach(function (li) {
      var layer = li.dataset.layer;
      function on() {
        items.forEach(function (x) {
          x.classList.toggle("is-active", x === li);
        });
        light(layer);
      }
      function off() {
        li.classList.remove("is-active");
        light(null);
      }
      li.addEventListener("mouseenter", on);
      li.addEventListener("mouseleave", off);
      li.addEventListener("focus", on);
      li.addEventListener("blur", off);
      li.setAttribute("tabindex", "0");
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (li.classList.contains("is-active")) off();
          else on();
        }
      });
      li.addEventListener("click", function () {
        if (li.classList.contains("is-active")) off();
        else on();
      });
    });
  }

  /* --------------------------------------------------------- header UI */
  function initHeader() {
    var header = $("#siteHeader");
    var progress = $("#progressBar");
    var toTop = $("#toTop");
    var nav = $("#nav");
    var toggle = $("#navToggle");
    var links = $$(".nav a");
    var sections = links
      .map(function (a) {
        var id = a.getAttribute("href");
        return id && id.charAt(0) === "#" ? document.querySelector(id) : null;
      })
      .filter(Boolean);

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (header) header.classList.toggle("is-scrolled", y > 12);
      /* at the very top no section is active yet */
      if (y < 180) links.forEach(function (a) { a.classList.remove("is-active"); });
      if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      if (toTop) toTop.classList.toggle("is-visible", y > 700);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }

    /* scroll spy */
    if ("IntersectionObserver" in window && sections.length) {
      var spy = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var id = "#" + entry.target.id;
            links.forEach(function (a) {
              a.classList.toggle("is-active", a.getAttribute("href") === id);
            });
          });
        },
        { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
      );
      sections.forEach(function (s) {
        spy.observe(s);
      });
    }

    /* mobile menu */
    function setMenu(open) {
      document.body.classList.toggle("nav-open", open);
      if (toggle) toggle.setAttribute("aria-expanded", String(open));
      if (toggle) toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    }
    if (toggle) {
      toggle.addEventListener("click", function () {
        setMenu(!document.body.classList.contains("nav-open"));
      });
    }
    if (nav) {
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) setMenu(false);
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
    document.addEventListener("click", function (e) {
      if (!document.body.classList.contains("nav-open")) return;
      if (e.target.closest("#nav") || e.target.closest("#navToggle")) return;
      setMenu(false);
    });
  }

  /* ------------------------------------------------------- reveal */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;
    /* only hide content once this script is definitely running */
    document.documentElement.classList.add("reveal-ready");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ------------------------------------------------- optional images */
  function initOptionalImages() {
    $$("img[data-optional]").forEach(function (img) {
      img.addEventListener("error", function () {
        img.style.display = "none";
        img.setAttribute("data-missing", "true");
      });
      if (img.complete && img.naturalWidth === 0) {
        img.style.display = "none";
        img.setAttribute("data-missing", "true");
      }
    });
  }

  /* ---------------------------------------------------------- boot */
  function boot() {
    initHeroCube();
    initNotationDemo();
    initLayerHighlight();
    initHeader();
    initReveal();
    initOptionalImages();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
