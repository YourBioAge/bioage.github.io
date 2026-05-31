/**
 * BioAge Radial Orbital Timeline
 * Ported from jatin-yadav05's radial-orbital-timeline (21st.dev).
 * Pure vanilla JS — no React, no Tailwind, no dependencies.
 *
 * The 8 BioAge pillars orbit a central "BioAge" sphere.
 * Click any node to pause rotation and show pillar details.
 */
(function () {
  'use strict';

  // ── Pillar data ───────────────────────────────────────────
  var PILLARS = [
    {
      id: 1, icon: '🩸', title: 'Blood Markers', weight: '35%',
      desc: '15 supported markers — glucose, HbA1c, CRP, cholesterol, and more — compared to evidence-based optimal ranges.',
      relatedIds: [2, 3]
    },
    {
      id: 2, icon: '😴', title: 'Sleep', weight: '25%',
      desc: 'Duration and quality scored using a 7–9h optimal window. Deep sleep and REM percentages contribute bonus points.',
      relatedIds: [1, 4]
    },
    {
      id: 3, icon: '💓', title: 'HRV', weight: '25%',
      desc: 'Your RMSSD compared to age- and sex-matched population norms (Nunan et al.). Higher HRV = biologically younger.',
      relatedIds: [1, 5]
    },
    {
      id: 4, icon: '🧘', title: 'Stress', weight: '15%',
      desc: 'Levels 1–4 are protective. Chronic high stress (5–10) adds years to your score. Self-reported and factored directly in.',
      relatedIds: [2, 5]
    },
    {
      id: 5, icon: '🫀', title: 'Cardiovascular', weight: 'bonus',
      desc: 'Resting heart rate compared to age norms. Blood pressure optionally provides additional refinement.',
      relatedIds: [3, 4]
    },
    {
      id: 6, icon: '⚡', title: 'Reaction Time', weight: '12%',
      desc: 'Measured via the iPhone screen. Compared against Welford age-adjusted norms — a sensitive marker of neural aging.',
      relatedIds: [7, 8]
    },
    {
      id: 7, icon: '✊', title: 'Grip Strength', weight: '9%',
      desc: 'Peak force, stability, and duration — each weighted. Grip strength is one of the strongest predictors of all-cause mortality.',
      relatedIds: [6, 8]
    },
    {
      id: 8, icon: '🚶', title: 'Gait', weight: '2%',
      desc: 'Step cadence and regularity measured via the accelerometer. Optimal cadence is 100–130 steps per minute.',
      relatedIds: [6, 7]
    }
  ];

  // ── Layout constants ──────────────────────────────────────
  var SIZE   = 560;   // container px (CSS must match)
  var RADIUS = 200;   // orbit radius px
  var CENTER = SIZE / 2;

  // ── State ─────────────────────────────────────────────────
  var rotationAngle = 0;
  var autoRotate    = true;
  var activeId      = null;
  var lastTs        = null;

  // ── DOM refs ──────────────────────────────────────────────
  var container = document.getElementById('orbital-timeline');
  if (!container) return;

  var nodeEls = {}; // id → element
  var cardEl  = null;

  // ── Build DOM ─────────────────────────────────────────────
  function build() {
    // Orbit track ring
    var ring = el('div', 'orb-ring');
    container.appendChild(ring);

    // Centre sphere
    var centre = el('div', 'orb-centre');
    centre.innerHTML =
      '<div class="orb-ping orb-ping-1"></div>' +
      '<div class="orb-ping orb-ping-2"></div>' +
      '<div class="orb-core">' +
        '<span class="orb-core-text">BioAge</span>' +
      '</div>';
    container.appendChild(centre);

    // Nodes
    PILLARS.forEach(function (p) {
      var node = el('div', 'orb-node');
      node.setAttribute('aria-label', p.title + ' – ' + p.weight);
      node.innerHTML =
        '<div class="orb-node-bubble"><span class="orb-node-icon">' + p.icon + '</span></div>' +
        '<div class="orb-node-label">' +
          '<span class="orb-node-name">' + p.title + '</span>' +
          '<span class="orb-node-wt">' + p.weight + '</span>' +
        '</div>';
      node.addEventListener('click', function () { toggle(p.id); });
      container.appendChild(node);
      nodeEls[p.id] = node;
    });

    // Info card (hidden until a node is clicked)
    cardEl = el('div', 'orb-card');
    cardEl.style.display = 'none';
    container.appendChild(cardEl);
  }

  // ── Position math (mirrors the original component) ────────
  function calcPos(index, total, rotation) {
    var angle  = ((index / total) * 360 + rotation) % 360;
    var rad    = (angle * Math.PI) / 180;
    var x      = CENTER + RADIUS * Math.cos(rad);
    var y      = CENTER + RADIUS * Math.sin(rad);
    var zIndex = Math.round(100 + 50 * Math.cos(rad));
    var opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(rad)) / 2)));
    return { x: x, y: y, zIndex: zIndex, opacity: opacity };
  }

  // ── Render loop ───────────────────────────────────────────
  function render(ts) {
    if (autoRotate) {
      if (lastTs !== null) {
        rotationAngle = (rotationAngle + 0.3 * ((ts - lastTs) / 50)) % 360;
      }
      lastTs = ts;
    } else {
      lastTs = null;
    }

    PILLARS.forEach(function (p, i) {
      var pos  = calcPos(i, PILLARS.length, rotationAngle);
      var node = nodeEls[p.id];
      node.style.left    = pos.x + 'px';
      node.style.top     = pos.y + 'px';
      node.style.zIndex  = pos.zIndex;
      node.style.opacity = activeId
        ? (p.id === activeId ? '1' : '0.25')
        : String(pos.opacity);
    });

    requestAnimationFrame(render);
  }

  // ── Interaction ───────────────────────────────────────────
  function toggle(id) {
    if (activeId === id) {
      collapse();
    } else {
      expand(id);
    }
  }

  function expand(id) {
    activeId    = id;
    autoRotate  = false;

    var p       = pillarById(id);
    var related = p ? p.relatedIds : [];

    Object.keys(nodeEls).forEach(function (nid) {
      var node = nodeEls[nid];
      node.classList.remove('orb-node--active', 'orb-node--related');
      if (parseInt(nid) === id) {
        node.classList.add('orb-node--active');
      } else if (related.indexOf(parseInt(nid)) !== -1) {
        node.classList.add('orb-node--related');
      }
    });

    showCard(p, related);
  }

  function collapse() {
    activeId   = null;
    autoRotate = true;
    cardEl.style.display = 'none';
    Object.keys(nodeEls).forEach(function (nid) {
      nodeEls[nid].classList.remove('orb-node--active', 'orb-node--related');
    });
  }

  function showCard(p, relatedIds) {
    var relatedHtml = relatedIds.map(function (rid) {
      var rp = pillarById(rid);
      return rp
        ? '<span class="orb-tag">' + rp.icon + ' ' + rp.title + '</span>'
        : '';
    }).join('');

    cardEl.innerHTML =
      '<button class="orb-card-close" aria-label="Close">✕</button>' +
      '<div class="orb-card-icon">' + p.icon + '</div>' +
      '<div class="orb-card-weight">' + p.weight + '</div>' +
      '<h4 class="orb-card-title">' + p.title + '</h4>' +
      '<p class="orb-card-desc">' + p.desc + '</p>' +
      (relatedHtml
        ? '<div class="orb-card-related"><span class="orb-related-label">Connected</span>' + relatedHtml + '</div>'
        : '');

    cardEl.style.display = 'block';

    cardEl.querySelector('.orb-card-close').addEventListener('click', function (e) {
      e.stopPropagation();
      collapse();
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function pillarById(id) {
    for (var i = 0; i < PILLARS.length; i++) {
      if (PILLARS[i].id === id) return PILLARS[i];
    }
    return null;
  }

  // Collapse on outside click
  document.addEventListener('click', function (e) {
    if (activeId && !container.contains(e.target)) collapse();
  });

  // ── Go ────────────────────────────────────────────────────
  build();
  requestAnimationFrame(render);
})();
