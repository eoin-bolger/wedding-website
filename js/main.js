/* ============================================================
   WEDDING WEBSITE — Ashley & Eoin
   Main JavaScript
   ============================================================ */


/* ------------------------------------------------------------
   Lenis smooth scroll
   Adds momentum/inertia to wheel scrolling so the page glides
   past where the user stops. The RAF loop must tick every frame.
   Nav links use lenis.scrollTo() so they also get smooth travel.
   ------------------------------------------------------------ */

(function initLenis() {
  if (typeof Lenis === 'undefined') return;

  const lenis = new Lenis({
    duration: 1.2,
    easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true,
  });

  window.lenis = lenis;

  /* Keep ScrollTrigger's scroll position in sync with Lenis.
     Without this, ScrollTrigger reads stale scroll values during
     Lenis's smooth interpolation and triggers fire at wrong times. */
  lenis.on('scroll', function() {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}());


/* ------------------------------------------------------------
   Hero — Dashed oval dot ring
   Places individual <circle> elements along the ellipse path.
   Each circle uses a radial gradient to simulate the Figma
   inset box-shadow (light top-left, dark bottom-right).
   ------------------------------------------------------------ */

(function drawHeroDots() {
  const svg   = document.querySelector('.hero__oval--dashed');
  const group = document.getElementById('hero-dots');
  if (!svg || !group) return;

  /* Read the actual rendered size from the browser after CSS calc() has run.
     This means the dots always match the real SVG dimensions — responsive for free. */
  const w = svg.clientWidth;
  const h = svg.clientHeight;

  /* Set the viewBox to match exactly, so our coordinate maths maps 1:1 to pixels */
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const cx = w / 2;
  const cy = h / 2;
  /* Placing dot centres at w/2 + dotRadius means the inner edge of each dot
     sits exactly at the SVG boundary. The gap to the outer ring = --hero-gap-outer.
     overflow: visible on the SVG lets the outer half of each dot render outside. */
  const dotRadius = 2.5;
  const rx = w / 2 + dotRadius;
  const ry = h / 2 + dotRadius;

  const gap = 3; /* Space between dot centres */

  /* Ramanujan's approximation of ellipse circumference */
  const hVal = Math.pow((rx - ry) / (rx + ry), 2);
  const circumference = Math.PI * (rx + ry) * (1 + (3 * hVal) / (10 + Math.sqrt(4 - 3 * hVal)));

  const dotCount = Math.floor(circumference / (dotRadius * 2 + gap));
  const svgNS = 'http://www.w3.org/2000/svg';

  for (let i = 0; i < dotCount; i++) {
    const t = (i / dotCount) * 2 * Math.PI;
    const x = cx + rx * Math.cos(t);
    const y = cy + ry * Math.sin(t);

    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', x.toFixed(2));
    circle.setAttribute('cy', y.toFixed(2));
    circle.setAttribute('r', dotRadius);
    circle.setAttribute('fill', 'url(#hero-dot-gradient)');
    group.appendChild(circle);
  }
}());


/* ------------------------------------------------------------
   FAQ accordion
   Toggles aria-expanded on the button and hidden on the answer panel.
   Only one panel can be open at a time.
   ------------------------------------------------------------ */

(function initFaqAccordion() {
  const buttons = document.querySelectorAll('.faq__question');
  if (!buttons.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function openAnswer(answer) {
    const inner = answer.querySelector('.faq__answer-inner');
    gsap.killTweensOf([answer, inner]);
    if (prefersReduced) {
      gsap.set(answer, { height: 'auto' });
      gsap.set(inner,  { y: '0%' });
      return;
    }
    gsap.to(answer, { height: 'auto', duration: 0.45, ease: 'power2.out' });
    gsap.to(inner,  { y: '0%',        duration: 0.45, ease: 'power2.out' });
  }

  function closeAnswer(answer) {
    const inner = answer.querySelector('.faq__answer-inner');
    gsap.killTweensOf([answer, inner]);
    if (prefersReduced) {
      gsap.set(answer, { height: 0 });
      gsap.set(inner,  { y: '-100%' });
      return;
    }
    gsap.to(answer, { height: 0,      duration: 0.35, ease: 'power2.in' });
    gsap.to(inner,  { y: '-100%',     duration: 0.35, ease: 'power2.in' });
  }

  buttons.forEach(function(button) {
    button.addEventListener('click', function() {
      const isOpen   = this.getAttribute('aria-expanded') === 'true';
      const answerId = this.getAttribute('aria-controls');
      const answer   = document.getElementById(answerId);

      /* Toggle this item */
      this.setAttribute('aria-expanded', String(!isOpen));
      if (isOpen) {
        closeAnswer(answer);
      } else {
        openAnswer(answer);
      }
    });
  });
}());


/* ------------------------------------------------------------
   Countdown timer — per-field width locking
   Target: August 21, 2026, 2:00 PM IST = 2026-08-21T13:00:00Z

   Each number field (days / hours / minutes / seconds) is locked
   to N × widestDigitWidth. This prevents layout shifts without
   the per-digit padding that made narrow glyphs like "1" look
   artificially spaced apart.
   ------------------------------------------------------------ */

(function initCountdown() {
  const display   = document.querySelector('.countdown__display');
  const daysEl    = document.getElementById('countdown-days');
  const hoursEl   = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');

  if (!display || !daysEl) return;

  const TARGET = new Date('2026-08-21T13:00:00Z');


  /* ── Digit measurement ──────────────────────────────────────
     Probe each digit 0–9 off-screen at the real computed font-size.
     Returns the widest measured width + 1px safety margin. */

  let digitWidth = 0;

  function measureWidestDigit() {
    const cs = getComputedStyle(daysEl);
    const probe = document.createElement('span');
    probe.style.cssText = [
      'position:absolute',
      'top:-9999px',
      'left:-9999px',
      'visibility:hidden',
      'white-space:nowrap',
      'font-family:' + cs.fontFamily,
      'font-size:'   + cs.fontSize,
      'line-height:1'
    ].join(';');
    document.body.appendChild(probe);

    let max = 0;
    for (let i = 0; i <= 9; i++) {
      probe.textContent = String(i);
      max = Math.max(max, probe.getBoundingClientRect().width);
    }
    document.body.removeChild(probe);
    return Math.ceil(max) + 1;
  }

  /* Lock each field to its maximum possible digit count × widest digit.
     The number renders naturally inside — "1" keeps its own narrow
     advance width rather than being padded to an oversized box. */
  function applyFieldWidths() {
    daysEl.style.width    = (3 * digitWidth) + 'px'; /* max days = 999 */
    hoursEl.style.width   = (2 * digitWidth) + 'px'; /* max hours = 23 */
    minutesEl.style.width = (2 * digitWidth) + 'px';
    secondsEl.style.width = (2 * digitWidth) + 'px';
  }


  /* ── Tick ───────────────────────────────────────────────── */

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  let timer;

  function tick() {
    const diff = TARGET - Date.now();

    if (diff <= 0) {
      display.innerHTML = '<p class="countdown__married">We\'re married!</p>';
      clearInterval(timer);
      return;
    }

    const total   = Math.floor(diff / 1000);
    const days    = Math.floor(total / 86400);
    const hours   = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    daysEl.textContent    = String(days);
    hoursEl.textContent   = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }


  /* ── Init ───────────────────────────────────────────────────
     document.fonts.ready ensures TheSecretLibrary is loaded
     before we measure digit widths. */

  function init() {
    digitWidth = measureWidestDigit();
    applyFieldWidths();
    tick();
    timer = setInterval(tick, 1000);
  }

  document.fonts.ready.then(init);


  /* ── Resize handler ─────────────────────────────────────────
     Fluid font-size changes on resize — re-measure after 150ms
     of inactivity and reapply field widths. */

  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      digitWidth = measureWidestDigit();
      applyFieldWidths();
    }, 150);
  });
}());


/* ------------------------------------------------------------
   Site nav
   Toggle button (top-right) opens/closes the panel.

   Open animation — two phases via GSAP:
   1. Width expands: clip-path right inset 100% → 0  (~350ms)
   2. Short pause, then height expands: clip-path bottom inset 100% → 0 (~500ms)
   3. Nav items rise into view: clip-path stagger on each .site-nav__item

   Close animation: reversed.
   Mobile (≤640px): scroll locked while panel is open.
   ------------------------------------------------------------ */

(function initSiteNav() {
  const toggle = document.querySelector('.site-nav__toggle');
  const panel  = document.getElementById('site-nav__panel');
  const toggleClose = toggle.querySelector('.site-nav__toggle-close');
  const links     = panel.querySelectorAll('.site-nav__link');
  const rsvpEl    = panel.querySelector('.site-nav__rsvp');
  const contactEl = panel.querySelector('.site-nav__contact');

  if (!toggle || !panel) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ease-in-quint — offbrand's exact cubic-bezier for item reveals */
  const ITEM_EASE = 'cubic-bezier(0.755, 0.05, 0.855, 0.06)';

  let isOpen = false;


  /* ── Open ──────────────────────────────────────────────── */

  function openNav() {
    isOpen = true;
    toggle.setAttribute('aria-expanded', 'true');

    /* Fade "CLOSE" in — "MENU" is a separate static element and never animates */
    gsap.killTweensOf(toggleClose);
    if (prefersReduced) {
      gsap.set(toggleClose, { opacity: 1 });
    } else {
      gsap.to(toggleClose, { opacity: 1, duration: 0.4, ease: 'power1.in' });
    }

    panel.removeAttribute('hidden');

    /* Switch button to dark green immediately — panel is cream */
    if (window.updateNavColor) window.updateNavColor();

    /* Lock scroll on mobile */
    if (window.innerWidth <= 640) {
      document.body.style.overflow = 'hidden';
    }

    if (prefersReduced) {
      panel.style.clipPath = 'inset(0 0 0 0)';
      gsap.set(Array.from(links).concat([rsvpEl, contactEl]), { y: '0%' });
      return;
    }

    /* All animated children in one array — links cascade first, then RSVP, then contact */
    const allItems = Array.from(links).concat([rsvpEl, contactEl]);

    /* Kill any in-flight tweens on all animated elements */
    gsap.killTweensOf(allItems);
    gsap.killTweensOf(panel);

    /* Panel: single tween from corner — starts immediately on click */
    gsap.to(panel, {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 0.55,
      ease: 'expo.out',
    });

    /* Every element slides from above into its overflow:hidden parent (the mask).
       Links → their .site-nav__item parent.
       RSVP → .site-nav__rsvp-wrap.
       Contact → .site-nav__contact-wrap.
       One stagger sequence, all 13 elements flowing together. */
    gsap.fromTo(allItems,
      { y: '-101%' },
      { y: '0%', duration: 0.25, stagger: 0.03, delay: 0.5, ease: ITEM_EASE }
    );
  }


  /* ── Close ─────────────────────────────────────────────── */

  function closeNav() {
    isOpen = false;
    toggle.setAttribute('aria-expanded', 'false');

    /* Fade "CLOSE" out — "MENU" stays put, no animation */
    gsap.killTweensOf(toggleClose);
    if (prefersReduced) {
      gsap.set(toggleClose, { opacity: 0 });
    } else {
      gsap.to(toggleClose, { opacity: 0, duration: 0.2, ease: 'power1.out' });
    }

    document.body.style.overflow = '';

    if (prefersReduced) {
      panel.setAttribute('hidden', '');
      panel.style.clipPath = 'inset(0 0 100% 100%)';
      return;
    }

    /* Kill any in-flight tweens on all animated elements */
    gsap.killTweensOf(links);
    gsap.killTweensOf([panel, rsvpEl, contactEl]);

    /* Close panel — power3.in accelerates smoothly into closure.
       Panel clip-path handles hiding all content inside; no need to animate children. */
    gsap.to(panel, {
      clipPath: 'inset(0% 0% 100% 100%)',
      duration: 0.5,
      ease: 'power3.in',
      onComplete: function() {
        panel.setAttribute('hidden', '');
        panel.style.clipPath = 'inset(0% 0% 100% 100%)'; /* reset for next open */
        /* Panel is now fully hidden — restore cream if still over a dark section */
        if (window.updateNavColor) window.updateNavColor();
      },
    });
  }


  /* ── Toggle ─────────────────────────────────────────────── */

  toggle.addEventListener('click', function() {
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });


  /* ── Close on nav link click — scroll to section via Lenis ─ */

  links.forEach(function(link) {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (window.lenis && href && href.startsWith('#')) {
        e.preventDefault();
        closeNav();
        /* Wait for the panel close animation (0.5s) to fully finish before scrolling */
        setTimeout(function() {
          const target = document.querySelector(href);
          const distance = target ? Math.abs(target.getBoundingClientRect().top) : 3000;
          /* Constant speed: duration scales with distance so every section
             travels at the same pace. Clamped so very short/long scrolls
             don't feel too snappy or too slow. */
          const duration = Math.min(4, Math.max(1, distance / 2500));
          window.lenis.scrollTo(href, { duration: duration });
        }, 1000);
      } else {
        closeNav();
      }
    });
  });


  /* ── Close on outside click ─────────────────────────────── */

  document.addEventListener('click', function(e) {
    if (!isOpen) return;
    /* If click is outside the panel AND not on the toggle, close */
    if (!panel.contains(e.target) && !toggle.contains(e.target)) {
      closeNav();
    }
  });


  /* ── Restore scroll lock on resize ─────────────────────── */

  /* If user opens on mobile then resizes to desktop, unlock scroll */
  window.addEventListener('resize', function() {
    if (isOpen && window.innerWidth > 640) {
      document.body.style.overflow = '';
    }
  });

}());


/* ------------------------------------------------------------
   Nav toggle colour shift
   When the toggle button scrolls over a [data-nav-light] section
   (dark green background) it flips to cream, then back when it
   leaves. Skipped while the panel is open — panel is cream so
   the button is always readable against it.
   ------------------------------------------------------------ */

(function initNavColorShift() {
  const toggle       = document.querySelector('.site-nav__toggle');
  const darkSections = document.querySelectorAll('[data-nav-light]');
  if (!toggle || !darkSections.length) return;

  function update() {
    const btnMidY   = toggle.getBoundingClientRect().top + toggle.offsetHeight / 2;
    const panelOpen = toggle.getAttribute('aria-expanded') === 'true';
    let overDark    = false;

    darkSections.forEach(function(section) {
      const r = section.getBoundingClientRect();
      if (r.top <= btnMidY && r.bottom >= btnMidY) overDark = true;
    });

    /* Cream only when: over a dark section AND panel is closed.
       When panel is open it is cream, so button must be dark green to be readable. */
    toggle.classList.toggle('site-nav__toggle--light', overDark && !panelOpen);
  }

  /* Expose so initSiteNav can trigger colour updates at open/close moments */
  window.updateNavColor = update;

  window.addEventListener('scroll', update, { passive: true });
  update();
}());


/* ------------------------------------------------------------
   Section 2 — Intro word fill
   Splits the heading and body paragraphs into individual word
   <span>s, then animates their colour from a ghost tone to the
   final dark green as the section scrolls into view.

   scrub: true ties the animation directly to scroll position —
   scroll forward = words fill, scroll back = words unfill.
   ------------------------------------------------------------ */

(function initIntroFill() {
  const section = document.getElementById('intro');
  if (!section) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Split text into word spans ──────────────────────────────
     Each text element's content is split on whitespace.
     Words are wrapped in <span class="intro__word"> and joined
     back with a space so line-wrapping still works normally. */

  const textEls = section.querySelectorAll('#intro-heading, .intro__body');
  const allWords = [];

  textEls.forEach(function(el) {
    const text = el.textContent.trim();
    el.innerHTML = text.split(/\s+/).map(function(word) {
      return '<span class="intro__word">' + word + '</span>';
    }).join(' ');
    Array.prototype.push.apply(allWords, Array.from(el.querySelectorAll('.intro__word')));
  });

  /* If reduced motion is preferred, words inherit the final dark
     color from their parent — no ghost state, no animation. */
  if (prefersReduced) return;

  /* Set ghost color synchronously so it's already in place before
     the browser paints — avoids a flash of the full dark color. */
  allWords.forEach(function(w) { w.style.color = '#c0c2aa'; });

  /* ── Scroll-driven fill ──────────────────────────────────────
     scrub: true maps the entire GSAP timeline to the scroll range.
     stagger spaces each word's animation evenly across that range,
     so the first word fills as the section enters and the last
     word fills just before it exits. */

  gsap.to(allWords, {
    color: '#43461f',   /* --color-green-dark */
    stagger: 0.1,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',   /* begins when section top is 75% down the screen */
      end: 'top -25%',    /* completes when section top is 25% past the top of screen */
      scrub: true,
    },
  });
}());



/* ------------------------------------------------------------
   Our Story — envelope scroll animation (Acts 2 + 3)
   Runs on the same ScrollTrigger pin as the section, so all
   three acts happen while the section is held at the top.

   Scroll budget: end: '+=800%' = 8× viewport height scroll.

   Act 2: envelopes slide in with Z rotation
   Act 3: flaps open → letter sequence fires (NOT scrub-controlled)

   Letter sequence (time-based, triggered by scroll position):
   1. Parent clip applied (letter can only emerge upward)
   2. Extraction — folded letter slides UP, barely clears envelope
   3. Z-switch — zIndex 0→2 while fully clear (no pop)
   4. Descent — letter returns to centre (now in front)
   5. Two-step unfold — clip opens from 1/3 → 2/3 → full
   ------------------------------------------------------------ */

(function initOurStoryEnvelopes() {
  var section           = document.getElementById('our-story');
  var ashley            = document.querySelector('.envelope-wrapper--ashley');
  var eoin              = document.querySelector('.envelope-wrapper--eoin');
  /* Inner .envelope card — this is what rotates (Ironhill two-level technique).
     The wrapper only translates; the card does the rotateY + z swing. */
  var ashleyCard        = ashley ? ashley.querySelector('.envelope')              : null;
  var eoinCard          = eoin   ? eoin.querySelector('.envelope')                : null;
  var ashleyFlap        = ashley ? ashley.querySelector('.envelope__flap')        : null;
  var eoinFlap          = eoin   ? eoin.querySelector('.envelope__flap')          : null;
  var ashleyLetter      = ashley ? ashley.querySelector('.envelope__letter')      : null;
  var eoinLetter        = eoin   ? eoin.querySelector('.envelope__letter')        : null;
  /* Inner scrolling div — GSAP slides it upward during reading pause */
  var ashleyLetterInner = ashley ? ashley.querySelector('.envelope__letter-inner') : null;
  /* Fold-line creases — revealed during unfold */
  var ashleyFoldUpper   = ashley ? ashley.querySelector('.envelope__fold-line--upper') : null;
  var ashleyFoldLower   = ashley ? ashley.querySelector('.envelope__fold-line--lower') : null;
  var eoinFoldUpper     = eoin   ? eoin.querySelector('.envelope__fold-line--upper')   : null;
  var eoinFoldLower     = eoin   ? eoin.querySelector('.envelope__fold-line--lower')   : null;

  if (!section || !ashley || !eoin) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);


  /* ── Helper: starting Y offset ─────────────────────────────────────
     Pushes the letter DOWN inside the envelope so the folded top 1/3
     is hidden behind the front face (zIndex: 1 covers zIndex: 0).

     Geometry: letter top edge = -(letterH/2) + y, relative to centre.
     Envelope top edge = -(envH/2).
     We need letter top ≥ envelope top → y ≥ letterH/2 - envH/2.
     +20px ensures no sub-pixel bleed at the envelope top edge.

     Desktop (620/2 - 360/2 + 20 = 150): letter top is 20px below
     the envelope's top edge, fully hidden behind the front face. */

  function getStartY(envEl, letterEl) {
    return letterEl.offsetHeight / 2 - envEl.offsetHeight / 2 + 20;
  }


  /* ── Helper: extraction target Y ───────────────────────────────────
     The y value where the folded letter's visible bottom edge barely
     clears the envelope's top edge.

     Visible bottom of folded letter = y - letterH/6  (top 1/3 shown).
     Envelope top = -(envH/2).
     Solve for: y - letterH/6 = -(envH/2) - 15px clearance.

     Desktop: 620/6 - 360/2 - 15 ≈ -92 (letter rises ~242px total). */

  function getExtractionY(envEl, letterEl) {
    return letterEl.offsetHeight / 6 - envEl.offsetHeight / 2 - 15;
  }


  /* ── Reduced-motion fallback ───────────────────────────────────────
     Show everything settled: fully unfolded, in front, no animation. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(ashley, { xPercent: -50, yPercent: -50, rotateZ: -8 });
    gsap.set(eoin,   { xPercent: -50, yPercent: -50, rotateZ: 6 });
    gsap.set(ashleyLetter, { clipPath: 'inset(0 0 0 0)', xPercent: -50, yPercent: -50, zIndex: 2 });
    gsap.set(eoinLetter,   { clipPath: 'inset(0 0 0 0)', xPercent: -50, yPercent: -50, zIndex: 2 });
    gsap.set(ashleyFlap, { rotateX: 180 });
    gsap.set(eoinFlap,   { rotateX: 180 });
    return;
  }


  /* ── Initial state ─────────────────────────────────────────────────
     Wrappers off-screen, cards edge-on (Ironhill technique).
     Letters: folded (clip shows top 1/3), pushed down inside envelope
     so folded portion is behind front face (zIndex: 0 < front's 1).
     No opacity tricks — geometry hides the letter. */
  gsap.set(ashley,       { xPercent: -50, yPercent: -50, x: '120vw',  rotateZ: -8 });
  gsap.set(eoin,         { xPercent: -50, yPercent: -50, x: '-120vw', rotateZ: 6  });
  gsap.set(ashleyCard,   { z: 400, rotateY: 90  });
  gsap.set(eoinCard,     { z: 400, rotateY: -90 });
  gsap.set(ashleyLetter, {
    xPercent: -50, yPercent: -50,
    y: getStartY(ashleyCard, ashleyLetter),
    clipPath: 'inset(0 0 66.66% 0)',
    zIndex: 0,
  });
  gsap.set(eoinLetter, {
    xPercent: -50, yPercent: -50,
    y: getStartY(eoinCard, eoinLetter),
    clipPath: 'inset(0 0 66.66% 0)',
    zIndex: 0,
  });
  gsap.set([ashleyFoldUpper, ashleyFoldLower, eoinFoldUpper, eoinFoldLower], { opacity: 0 });


  /* ── Standalone letter animation ───────────────────────────────────
     Triggered by scroll position via .call(), but plays at real-time
     speed — NOT scrub-controlled. The whole sequence (extraction →
     z-switch → descent → unfold) runs as one fluid motion.
     Total duration ≈ 1.55s. */

  var ashleyLetterTl = null;
  var eoinLetterTl   = null;

  function playLetterSequence(letterEl, cardEl, foldUpper, foldLower) {
    var extractY = getExtractionY(cardEl, letterEl);
    var ltl = gsap.timeline();

    ltl
      /* Parent clip — letter can only emerge upward from envelope */
      .set(cardEl, { clipPath: 'inset(-200% -200% 0 -200%)' })

      /* Extraction — folded letter slides up, barely clears envelope */
      .to(letterEl, { y: extractY, ease: 'power2.out', duration: 0.4 })

      /* Z-switch — letter fully clear of envelope, no overlap pop */
      .set(letterEl, { zIndex: 2 })
      /* Remove parent clip — letter is now free to paint anywhere */
      .set(cardEl, { clipPath: 'inset(-200% -200% -100% -200%)' })

      /* Descent — letter returns to centre (now in front) */
      .to(letterEl, { y: 0, ease: 'power2.inOut', duration: 0.45 })

      /* First unfold — middle third revealed */
      .to(letterEl, { clipPath: 'inset(0 0 33.33% 0)', ease: 'power2.out', duration: 0.3 }, '+=0.05')
      .to(foldUpper, { opacity: 1, ease: 'power1.out', duration: 0.3 }, '<')

      /* Second unfold — bottom third revealed */
      .to(letterEl, { clipPath: 'inset(0 0 0% 0)', ease: 'power2.out', duration: 0.3 }, '+=0.05')
      .to(foldLower, { opacity: 1, ease: 'power1.out', duration: 0.3 }, '<');

    return ltl;
  }

  /* Reset letter to its hidden-inside-envelope state (used on scroll-back) */
  function resetLetter(letterEl, cardEl, foldUpper, foldLower) {
    gsap.set(letterEl, {
      y: getStartY(cardEl, letterEl),
      clipPath: 'inset(0 0 66.66% 0)',
      zIndex: 0,
    });
    gsap.set(cardEl, { clipPath: 'none' });
    gsap.set([foldUpper, foldLower], { opacity: 0 });
  }


  /* ── Scrubbed timeline ─────────────────────────────────────────────
     Controls entrance, flap, and reading pause via scroll.
     Letter extraction/unfold is triggered at a position via .call()
     but plays independently at real-time speed. Dead space in the
     timeline (1.6 → 3.2) gives the standalone ~1.55s to finish
     before reading pause begins. */

  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=800%',
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  tl
    /* ── 0.6–1.2: Ashley entrance ───────────────────────────────── */
    .to(ashley,     { x: 0, ease: 'power2.out', duration: 0.6 }, 0.6)
    .to(ashleyCard, { z: 0, rotateY: 0, ease: 'power2.out', duration: 0.6 }, 0.6)

    /* ── 1.3–1.6: Ashley flap ───────────────────────────────────── */
    .to(ashleyFlap, { rotateX: 180, ease: 'power2.inOut', duration: 0.3 }, 1.3)

    /* ── 1.6: Trigger letter sequence (plays at real-time speed) ── */
    .call(function() {
      var dir = tl.scrollTrigger.direction;
      if (dir === 1) {
        /* Forward: play extraction → descent → unfold */
        if (ashleyLetterTl) ashleyLetterTl.kill();
        ashleyLetterTl = playLetterSequence(
          ashleyLetter, ashleyCard, ashleyFoldUpper, ashleyFoldLower
        );
      } else {
        /* Backward: reset letter to hidden-inside-envelope state */
        if (ashleyLetterTl) { ashleyLetterTl.kill(); ashleyLetterTl = null; }
        resetLetter(ashleyLetter, ashleyCard, ashleyFoldUpper, ashleyFoldLower);
      }
    }, null, 1.6)

    /* ── 3.2–4.8: Reading pause — inner div scrolls to show text ── */
    .to(ashleyLetterInner, {
      y: function() {
        var styles = getComputedStyle(ashleyLetter);
        var contentHeight = ashleyLetter.clientHeight
          - parseFloat(styles.paddingTop)
          - parseFloat(styles.paddingBottom);
        var overflow = ashleyLetterInner.scrollHeight - contentHeight;
        return overflow > 0 ? -overflow : 0;
      },
      ease: 'none',
      duration: 1.6,
    }, 3.2)

    /* ── 5.0–5.6: Eoin entrance ─────────────────────────────────── */
    .to(eoin,     { x: 0, ease: 'power2.out', duration: 0.6 }, 5.0)
    .to(eoinCard, { z: 0, rotateY: 0, ease: 'power2.out', duration: 0.6 }, 5.0)

    /* ── 5.7–6.0: Eoin flap ─────────────────────────────────────── */
    .to(eoinFlap, { rotateX: 180, ease: 'power2.inOut', duration: 0.3 }, 5.7)

    /* ── 6.0: Trigger Eoin letter sequence ──────────────────────── */
    .call(function() {
      var dir = tl.scrollTrigger.direction;
      if (dir === 1) {
        if (eoinLetterTl) eoinLetterTl.kill();
        eoinLetterTl = playLetterSequence(
          eoinLetter, eoinCard, eoinFoldUpper, eoinFoldLower
        );
      } else {
        if (eoinLetterTl) { eoinLetterTl.kill(); eoinLetterTl = null; }
        resetLetter(eoinLetter, eoinCard, eoinFoldUpper, eoinFoldLower);
      }
    }, null, 6.0)

    /* ── 7.5–8.0: End hold ──────────────────────────────────────── */
    .to({}, { duration: 0.5 }, 7.5);
}());


/* ------------------------------------------------------------
   Hero parallax
   The hero is position: sticky so it stays visible while
   section 2 slides over it. Without this, it freezes completely.
   This GSAP tween slowly translates the hero upward as you scroll
   through the stack, so it appears to move at ~15% scroll speed
   rather than 0%.
   ------------------------------------------------------------ */

(function initHeroParallax() {
  const hero  = document.getElementById('hero');
  const stack = document.querySelector('.hero-intro-stack');
  if (!hero || !stack) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  /* yPercent: -15 shifts the hero up by 15% of its own height
     over the full scroll distance of the stack. Combined with
     sticky, the hero content drifts slowly upward while section 2
     covers it at full scroll speed. */
  gsap.to(hero, {
    yPercent: -25,
    ease: 'none',
    scrollTrigger: {
      trigger: stack,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}());
