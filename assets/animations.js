/**
 * BioAge Premium Animations
 * Vanilla JS — no React, no Framer Motion, no Tailwind.
 *
 * 1. Word Rotate   — hero h1 cycles through phrases with slide + gradient
 * 2. Number Ticker — stats counters count up on scroll (IntersectionObserver)
 * 3. Blur Fade     — elements fade + unblur as they enter the viewport
 * 4. Card Tilt     — feature cards tilt toward the cursor in 3-D
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     1. WORD ROTATE
     Cycles through phrases in the hero h1 with a smooth
     slide-down-out / slide-up-in transition and animated
     gradient colour (teal → violet → amber).
  ───────────────────────────────────────────────────────── */
  var WORDS = [
    'measured by science',
    'backed by evidence',
    'powered by AI',
    'built for longevity'
  ];

  var wordEl = document.getElementById('hero-word-rotate');

  if (wordEl) {
    var wordIndex = 0;
    var wordBusy  = false;

    function rotateWord() {
      if (wordBusy) return;
      wordBusy = true;

      // Exit: slide down + fade
      wordEl.classList.add('word-exit');

      setTimeout(function () {
        wordIndex = (wordIndex + 1) % WORDS.length;
        wordEl.textContent = WORDS[wordIndex];
        wordEl.classList.remove('word-exit');
        wordEl.classList.add('word-enter');

        setTimeout(function () {
          wordEl.classList.remove('word-enter');
          wordBusy = false;
        }, 450);
      }, 350);
    }

    setInterval(rotateWord, 3200);
  }


  /* ─────────────────────────────────────────────────────────
     2. NUMBER TICKER
     Counts up to data-target when the element enters the
     viewport. Uses easeOutCubic for a natural deceleration.
  ───────────────────────────────────────────────────────── */
  var TICKER_DURATION = 2200; // ms

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateTicker(el) {
    var target  = parseInt(el.dataset.target, 10);
    var suffix  = el.dataset.suffix || '';
    var start   = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / TICKER_DURATION, 1);
      var value    = Math.round(easeOutCubic(progress) * target);
      el.textContent = value.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  var tickerEls = document.querySelectorAll('.stat-num');
  if (tickerEls.length && 'IntersectionObserver' in window) {
    var tickerObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateTicker(entry.target);
          tickerObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    tickerEls.forEach(function (el) { tickerObs.observe(el); });
  }


  /* ─────────────────────────────────────────────────────────
     3. BLUR FADE — scroll-triggered reveal
     Elements with class "blur-fade" start invisible+blurred
     and transition in when they enter the viewport.
     Children of .features-grid are staggered automatically.
  ───────────────────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    // Stagger feature cards
    var featureCards = document.querySelectorAll('.features-grid .feature-card');
    featureCards.forEach(function (card, i) {
      card.classList.add('blur-fade');
      card.style.transitionDelay = (i * 0.07) + 's';
    });

    var fadeEls = document.querySelectorAll('.blur-fade');
    var fadeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('blur-fade--in');
          fadeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(function (el) { fadeObs.observe(el); });
  }


  /* ─────────────────────────────────────────────────────────
     4. CARD TILT
     Feature cards tilt up to 8° toward the cursor on hover,
     creating a subtle 3-D depth effect. Resets on mouse-out.
  ───────────────────────────────────────────────────────── */
  var MAX_TILT = 8; // degrees

  function applyTilt(card, e) {
    var rect    = card.getBoundingClientRect();
    var cx      = rect.left + rect.width  / 2;
    var cy      = rect.top  + rect.height / 2;
    var dx      = (e.clientX - cx) / (rect.width  / 2);
    var dy      = (e.clientY - cy) / (rect.height / 2);
    var rotX    = -dy * MAX_TILT;
    var rotY    =  dx * MAX_TILT;
    card.style.transform =
      'perspective(600px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale(1.03)';
  }

  function resetTilt(card) {
    card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
    setTimeout(function () { card.style.transform = ''; }, 350);
  }

  var shineCards = document.querySelectorAll('.shine-card');
  shineCards.forEach(function (card) {
    card.addEventListener('mousemove', function (e) { applyTilt(card, e); });
    card.addEventListener('mouseleave', function ()  { resetTilt(card);   });
    // Add tilt transition
    card.style.transition = 'transform 0.15s ease, box-shadow 0.25s ease';
  });


  /* ─────────────────────────────────────────────────────────
     5. NAV SCROLL GLASSMORPHISM
     Nav gains a blurred dark background once the user
     scrolls past the hero, so it remains readable over
     every section's content.
  ───────────────────────────────────────────────────────── */
  var nav = document.querySelector('.nav');
  if (nav) {
    function onScroll() {
      if (window.scrollY > 60) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

})();
