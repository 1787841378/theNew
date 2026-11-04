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
  /* A real 3x3 cube: only the selected layer turns, the hold (which face is
     front / up) is selectable, the view can be dragged, and selecting a
     letter spotlights its 9 stickers while the rest fade out and back.
     Model space: x right, y up, z toward the viewer. */
  function initRubikDemo() {
    var host = $("#demoCube");
    var stage = $("#rubikStage");
    if (!host || !stage) return;

    var NAMES = { F: "前", U: "上", R: "右", L: "左", D: "下", B: "后" };
    var COLOR_NAMES = { F: "蓝", U: "黄", R: "红", L: "橙", D: "白", B: "绿" };
    var FACE_COLOR = { F: "#2E6BFF", U: "#FFC93C", R: "#FF3A5E", L: "#FF8A3D", D: "#F1F4F9", B: "#1DBF73" };
    var CLASS_FACE = { pz: "F", nz: "B", px: "R", nx: "L", py: "U", ny: "D" };
    var NORMALS = { F: [0, 0, 1], B: [0, 0, -1], U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0] };
    var NORMAL_FACE = { "0,0,1": "F", "0,0,-1": "B", "0,1,0": "U", "0,-1,0": "D", "1,0,0": "R", "-1,0,0": "L" };
    var NORMAL_CLASS = { "1,0,0": "px", "-1,0,0": "nx", "0,1,0": "py", "0,-1,0": "ny", "0,0,1": "pz", "0,0,-1": "nz" };
    var LOCAL_NORMALS = {
      px: [1, 0, 0], nx: [-1, 0, 0],
      py: [0, 1, 0], ny: [0, -1, 0],
      pz: [0, 0, 1], nz: [0, 0, -1],
    };
    var FACES = {
      U: { axis: 1, sign: 1 }, D: { axis: 1, sign: -1 },
      R: { axis: 0, sign: 1 }, L: { axis: 0, sign: -1 },
      F: { axis: 2, sign: 1 }, B: { axis: 2, sign: -1 },
    };
    var OPPOSITE = { F: "B", B: "F", U: "D", D: "U", R: "L", L: "R" };
    var GLOW = { F: "g-pz", B: "g-nz", R: "g-px", L: "g-nx", U: "g-py", D: "g-ny" };
    var DEFAULT_ORBIT = { x: 16, y: -30 };
    var IDENTITY = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    /* ---------------- matrix helpers ---------------- */
    function rot(axis, deg) {
      var r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
      if (axis === 0) return [[1, 0, 0], [0, c, -s], [0, s, c]];
      if (axis === 1) return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
      return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
    }
    function cross(a, b) {
      return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    }
    function transpose(m) {
      return [[m[0][0], m[1][0], m[2][0]], [m[0][1], m[1][1], m[2][1]], [m[0][2], m[1][2], m[2][2]]];
    }
    function mul(a, b) {
      var out = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], i, j, k;
      for (i = 0; i < 3; i++) {
        for (j = 0; j < 3; j++) {
          for (k = 0; k < 3; k++) out[i][j] += a[i][k] * b[k][j];
        }
      }
      return out;
    }
    function apply(m, v) {
      return [
        m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
        m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
        m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
      ];
    }
    function toCss(m) {
      /* world -> screen mirrors Y: O_css = S * O * S */
      var sgn = [1, -1, 1], out = [], col, row;
      for (col = 0; col < 3; col++) {
        for (row = 0; row < 3; row++) out.push(+(m[row][col] * sgn[row] * sgn[col]).toFixed(6));
        out.push(0);
      }
      out.push(0, 0, 0, 1);
      return out.join(",");
    }
    function keyOf(v) {
      return Math.round(v[0]) + "," + Math.round(v[1]) + "," + Math.round(v[2]);
    }

    /* ---------------- state ---------------- */
    var hold = { front: "F", up: "U" };
    var orbit = { x: DEFAULT_ORBIT.x, y: DEFAULT_ORBIT.y };
    var letterFace = { F: "F", U: "U", R: "R", L: "L", D: "D", B: "B" };
    var cubies = [];
    var inner = null;
    var busy = false;
    var queue = [];
    var spotTimer = 0;
    var state = { face: "R", dir: "cw" };
    var formulaEl = $("#demoFormula");
    var meaningEl = $("#demoMeaning");
    var viewBtn = $("#viewReset");

    /* ---------------- hold / view ---------------- */
    function holdMatrix() {
      var f = NORMALS[hold.front];
      var u = NORMALS[hold.up];
      var r = cross(u, f);
      var basis = [[r[0], u[0], f[0]], [r[1], u[1], f[1]], [r[2], u[2], f[2]]];
      return transpose(basis);
    }

    function updateLetterFaces() {
      var inverse = transpose(holdMatrix());
      Object.keys(NORMALS).forEach(function (letter) {
        letterFace[letter] = NORMAL_FACE[keyOf(apply(inverse, NORMALS[letter]))];
      });
    }

    function applyView() {
      var orbitM = mul(rot(0, orbit.x), rot(1, orbit.y));
      var view = mul(orbitM, holdMatrix());
      host.style.transform = "matrix3d(" + toCss(view) + ")";
    }

    function updateOffAxis() {
      if (!viewBtn) return;
      var off =
        Math.abs(orbit.x - DEFAULT_ORBIT.x) > 1.5 || Math.abs(orbit.y - DEFAULT_ORBIT.y) > 1.5;
      viewBtn.classList.toggle("is-off", off);
      viewBtn.setAttribute(
        "aria-label",
        off ? "视角已偏离所选拿法，点击回正" : "回正到所选拿法视角"
      );
    }

    function perpendicular(a, b) {
      var na = NORMALS[a], nb = NORMALS[b];
      return na[0] * nb[0] + na[1] * nb[1] + na[2] * nb[2] === 0;
    }

    function pickPerpendicular(base, kind) {
      var order = kind === "up" ? ["U", "F", "R", "L", "B", "D"] : ["F", "U", "R", "L", "B", "D"];
      for (var i = 0; i < order.length; i++) {
        if (perpendicular(base, order[i])) return order[i];
      }
      return base;
    }

    function setHold(which, face) {
      if (!perpendicular(face, which === "front" ? hold.up : hold.front)) {
        if (which === "front") hold.up = pickPerpendicular(face, "up");
        else hold.front = pickPerpendicular(face, "front");
      }
      hold[which] = face;
      orbit.x = DEFAULT_ORBIT.x;
      orbit.y = DEFAULT_ORBIT.y;
      updateLetterFaces();
      syncHold();
      syncFaceButtons();
      syncNotationList();
      highlight(letterFace[state.face]);
      readout();
      applyView();
      updateOffAxis();
    }

    /* ---------------- UI sync ---------------- */
    function syncHold() {
      $$(".hold-dot").forEach(function (dot) {
        var group = dot.closest(".hold-group").getAttribute("data-hold");
        var face = dot.getAttribute("data-face");
        var chosen = group === "front" ? hold.front : hold.up;
        dot.classList.toggle("is-active", face === chosen);
        dot.setAttribute("aria-pressed", face === chosen ? "true" : "false");
        dot.title = (group === "front" ? "把" : "让") + COLOR_NAMES[face] + "面朝" + (group === "front" ? "前" : "上");
      });
    }

    function syncFaceButtons() {
      $$(".face-btn").forEach(function (btn) {
        var letter = btn.getAttribute("data-face");
        btn.style.setProperty("--c", FACE_COLOR[letterFace[letter]]);
      });
    }

    function syncNotationList() {
      $$(".notation-list li[data-letter]").forEach(function (li) {
        var dot = li.querySelector(".dot");
        if (!dot) return;
        dot.style.setProperty("--c", FACE_COLOR[letterFace[li.getAttribute("data-letter")]]);
      });
    }

    function highlight(canonicalFace) {
      $$(".rubik-glow", host).forEach(function (g) {
        g.classList.toggle("is-active", g.getAttribute("data-face") === canonicalFace);
      });
    }

    function readout() {
      var mark = state.dir === "cw" ? "" : state.dir === "ccw" ? "\u2032" : "2";
      var dirText =
        state.dir === "cw" ? "顺时针旋转 90°" : state.dir === "ccw" ? "逆时针旋转 90°" : "旋转 180°";
      var canonical = letterFace[state.face];
      if (formulaEl) formulaEl.textContent = state.face + mark;
      if (meaningEl) meaningEl.textContent = NAMES[state.face] + "面（" + COLOR_NAMES[canonical] + "）" + dirText;
    }

    /* ---------------- cube build / turn ---------------- */
    function render(c) {
      c.el.style.setProperty("--px", c.pos[0]);
      c.el.style.setProperty("--py", -c.pos[1]);
      c.el.style.setProperty("--pz", c.pos[2]);
      c.el.style.setProperty("--m", toCss(c.orient));
    }

    function build() {
      host.innerHTML = "";
      inner = document.createElement("div");
      inner.className = "rubik-inner";
      host.appendChild(inner);
      cubies = [];

      for (var x = -1; x <= 1; x++) {
        for (var y = -1; y <= 1; y++) {
          for (var z = -1; z <= 1; z++) {
            if (x === 0 && y === 0 && z === 0) continue;
            var c = {
              pos: [x, y, z],
              orient: IDENTITY.map(function (row) { return row.slice(); }),
              el: document.createElement("div"),
            };
            c.el.className = "cubie";
            [
              ["px", x === 1], ["nx", x === -1],
              ["py", y === 1], ["ny", y === -1],
              ["pz", z === 1], ["nz", z === -1],
            ].forEach(function (f) {
              var d = document.createElement("span");
              d.className = "cubie-face " + f[0];
              if (f[1]) d.style.setProperty("--c", FACE_COLOR[CLASS_FACE[f[0]]]);
              c.el.appendChild(d);
            });
            render(c);
            inner.appendChild(c.el);
            cubies.push(c);
          }
        }
      }

      Object.keys(FACES).forEach(function (key) {
        var g = document.createElement("span");
        g.className = "rubik-glow " + GLOW[key];
        g.setAttribute("data-face", key);
        inner.appendChild(g);
      });
    }

    function turn(letter, dirMode, done) {
      var canonical = letterFace[letter];
      var spec = FACES[canonical];
      if (!spec || busy) return;
      busy = true;

      var mathAngle = dirMode === "cw" ? -90 : dirMode === "ccw" ? 90 : 180;
      var aboutAxis = mathAngle * spec.sign;
      var R = rot(spec.axis, aboutAxis);

      var members = cubies.filter(function (c) { return c.pos[spec.axis] === spec.sign; });
      var group = document.createElement("div");
      group.className = "turn-group";
      inner.appendChild(group);
      members.forEach(function (c) { group.appendChild(c.el); });
      void group.offsetWidth;

      var axisCss = [spec.axis === 0 ? 1 : 0, spec.axis === 1 ? -1 : 0, spec.axis === 2 ? 1 : 0];
      var angleCss = -aboutAxis;
      group.style.transform = "rotate3d(" + axisCss.join(",") + "," + angleCss + "deg)";

      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        group.style.transition = "none";
        members.forEach(function (c) {
          c.pos = apply(R, c.pos).map(Math.round);
          c.orient = mul(R, c.orient);
          render(c);
          inner.appendChild(c.el);
        });
        group.remove();
        busy = false;
        if (done) done();
      }
      group.addEventListener("transitionend", finish);
      window.setTimeout(finish, 720);
    }

    function reset() {
      queue.length = 0;
      busy = false;
      clearSpotlight();
      build();
      highlight(letterFace[state.face]);
    }

    function requestTurn(letter, dirMode) {
      queue.push([letter, dirMode]);
      if (!busy) nextTurn();
    }
    function nextTurn() {
      if (busy || !queue.length) return;
      var item = queue.shift();
      turn(item[0], item[1], nextTurn);
    }

    /* ---------------- spotlight ---------------- */
    function clearSpotlight() {
      window.clearTimeout(spotTimer);
      host.classList.remove("is-focusing");
      $$(".cubie-face.is-spot", host).forEach(function (el) { el.classList.remove("is-spot"); });
    }

    /* keep the whole selected layer readable: the 9 stickers of the chosen
       face plus the 3-sticker strip on each of its four sides. Everything in
       the other two layers fades out and back in. */
    function spotlight(letter) {
      var canonical = letterFace[letter];
      var spec = FACES[canonical];
      if (!spec) return;

      $$(".cubie-face.is-spot", host).forEach(function (el) { el.classList.remove("is-spot"); });

      cubies.forEach(function (c) {
        if (c.pos[spec.axis] !== spec.sign) return; /* not part of this layer */
        Object.keys(LOCAL_NORMALS).forEach(function (cls) {
          var n = apply(c.orient, LOCAL_NORMALS[cls]); /* world normal of this local side */
          var axis = Math.abs(n[0]) > 0.5 ? 0 : Math.abs(n[1]) > 0.5 ? 1 : 2;
          var sign = n[axis] > 0 ? 1 : -1;
          if (c.pos[axis] !== sign) return; /* that side points into the cube */
          var face = c.el.querySelector(".cubie-face." + cls);
          if (face) face.classList.add("is-spot");
        });
      });

      host.classList.remove("is-focusing");
      void host.offsetWidth; /* restart the 1s fade */
      host.classList.add("is-focusing");
      window.clearTimeout(spotTimer);
      spotTimer = window.setTimeout(clearSpotlight, 1080);
    }

    /* ---------------- pointer / keyboard orbit ---------------- */
    var drag = null;

    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, ox: orbit.x, oy: orbit.y };
      host.classList.add("is-dragging");
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      try { stage.focus({ preventScroll: true }); } catch (err) { /* noop */ }
      e.preventDefault();
    });

    stage.addEventListener("pointermove", function (e) {
      if (!drag) return;
      orbit.y = drag.oy + (e.clientX - drag.x) * 0.45;
      orbit.x = clamp(drag.ox + (e.clientY - drag.y) * 0.45, -85, 85);
      applyView();
      updateOffAxis();
    });

    function endDrag(e) {
      if (!drag) return;
      drag = null;
      host.classList.remove("is-dragging");
      if (e && e.pointerId !== undefined) {
        try { stage.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
      }
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", endDrag);

    stage.addEventListener("keydown", function (e) {
      var step = 8, handled = true;
      switch (e.key) {
        case "ArrowLeft": orbit.y -= step; break;
        case "ArrowRight": orbit.y += step; break;
        case "ArrowUp": orbit.x = clamp(orbit.x - step, -85, 85); break;
        case "ArrowDown": orbit.x = clamp(orbit.x + step, -85, 85); break;
        default: handled = false;
      }
      if (!handled) return;
      e.preventDefault();
      applyView();
      updateOffAxis();
    });

    if (viewBtn) {
      viewBtn.addEventListener("click", function () {
        orbit.x = DEFAULT_ORBIT.x;
        orbit.y = DEFAULT_ORBIT.y;
        applyView();
        updateOffAxis();
      });
    }

    /* ---------------- wiring ---------------- */
    $$(".hold-dot").forEach(function (dot) {
      dot.addEventListener("click", function () {
        if (dot.disabled) return;
        setHold(dot.closest(".hold-group").getAttribute("data-hold"), dot.getAttribute("data-face"));
      });
    });

    $$(".face-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.face = btn.getAttribute("data-face");
        $$(".face-btn").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        highlight(letterFace[state.face]);
        readout();
        spotlight(state.face);
      });
    });

    $$(".dir-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.dir = btn.getAttribute("data-dir");
        $$(".dir-btn").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        readout();
        requestTurn(state.face, state.dir);
      });
    });

    var resetBtn = $("#demoReset");
    if (resetBtn) resetBtn.addEventListener("click", reset);

    if (formulaEl) {
      formulaEl.style.cursor = "pointer";
      formulaEl.title = "再转一次";
      formulaEl.addEventListener("click", function () { requestTurn(state.face, state.dir); });
    }

    /* ---------------- boot ---------------- */
    build();
    updateLetterFaces();
    syncHold();
    syncFaceButtons();
    syncNotationList();
    highlight(letterFace[state.face]);
    readout();
    applyView();
    updateOffAxis();
    window.requestAnimationFrame(function () { host.classList.add("is-ready"); });

    /* test hook */
    host.__api = {
      turn: requestTurn,
      reset: reset,
      setHold: setHold,
      hold: function () { return hold; },
      orbit: function () { return orbit; },
      letterFace: function () { return letterFace; },
      cubies: function () { return cubies; },
    };
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
    initRubikDemo();
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
