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

function drawHeroDots() {
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
}


/* ------------------------------------------------------------
   Hero — Page-load entrance animation
   7-step sequence: portrait appears large → colours cycle
   (placeholder for burst photos) → pause → portrait scales
   down → names fade in → rings + flanking fade in.
   ------------------------------------------------------------ */

(function initHeroEntrance() {
  /* 1. Grab DOM elements */
  var portrait  = document.querySelector('.hero__portrait');
  var names     = document.querySelector('.hero__names');
  var flankL    = document.querySelector('.hero__flanking--left');
  var flankR    = document.querySelector('.hero__flanking--right');
  var ovalOuter = document.querySelector('.hero__oval--outer');
  var ovalMid   = document.querySelector('.hero__oval--middle');
  var ovalInner = document.querySelector('.hero__oval--inner');
  var dashed    = document.querySelector('.hero__oval--dashed');
  var navToggle = document.querySelector('.site-nav__toggle');

  /* Convenience array — every element that starts hidden */
  var allEls = [portrait, names, flankL, flankR, ovalOuter, ovalMid, ovalInner, dashed, navToggle];

  /* Grab photo elements for burst animation */
  var flashPhotos = document.querySelectorAll('.hero__photo--flash');
  var mainPhoto   = document.querySelector('.hero__photo--main');

  /* 2. Guard: if critical elements missing or GSAP not loaded, show everything */
  if (!portrait || !names || typeof gsap === 'undefined') {
    allEls.forEach(function(el) { if (el) el.style.opacity = '1'; });
    if (mainPhoto) mainPhoto.style.opacity = '1';
    drawHeroDots();
    return;
  }

  /* 3. Reduced-motion check — show everything instantly, no animation */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(allEls, { opacity: 1 });
    if (mainPhoto) gsap.set(mainPhoto, { opacity: 1 });
    drawHeroDots();
    return;
  }

  /* 4. Calculate scale factor
     portrait has opacity:0 from CSS but still occupies layout space,
     so offsetHeight returns its rendered height. We want the portrait
     to fill ~85% of the viewport height when scaled up. */
  var heightScale = (window.innerHeight * 0.85) / portrait.offsetHeight;
  var widthScale  = (window.innerWidth  * 0.85) / portrait.offsetWidth;
  var scaleFactor = Math.min(heightScale, widthScale);

  /* 5. Set initial GSAP states
     Portrait appears immediately at large scale (opacity 1, scaled up).
     Everything else stays hidden (opacity 0 from CSS). */
  gsap.set(portrait, { opacity: 1, scale: scaleFactor });
  gsap.set(names,    { opacity: 0 }); /* Explicit — stays hidden */

  /* 6. Photo burst — rapid-fire flash photos, then settle on main portrait.
     Each flash shows for ~0.75s with a fast 0.15s crossfade between them,
     mimicking a camera shutter sequence. ~3s total. */
  var burstTl = gsap.timeline({
    onComplete: function() {
      /* 500ms pause after main photo lands — let the eye settle */
      setTimeout(buildTimeline, 500);
    },
  });

  /* Show first flash photo immediately as starting frame */
  if (flashPhotos.length > 0) {
    gsap.set(flashPhotos[0], { opacity: 1 });
  }

  /* Cycle through flash photos: fade out current, fade in next */
  for (var i = 0; i < flashPhotos.length; i++) {
    var isLast = i === flashPhotos.length - 1;
    var nextEl = isLast ? mainPhoto : flashPhotos[i + 1];
    /* Hold current photo visible, then quick crossfade to next */
    burstTl.to(flashPhotos[i], {
      opacity: 0,
      duration: 0.15,
      ease: 'power1.inOut',
    }, '+=' + (0.75 - 0.15)); /* 0.6s hold + 0.15s fade = 0.75s per photo */
    burstTl.to(nextEl, {
      opacity: 1,
      duration: 0.15,
      ease: 'power1.inOut',
    }, '<'); /* Simultaneous crossfade */
  }

  /* 7. Build GSAP timeline — runs after colour cycling + pause */
  function buildTimeline() {
    var tl = gsap.timeline();

    /* a. Portrait scales down to natural size */
    tl.to(portrait, {
      scale: 1,
      duration: 0.7,
      ease: 'power3.out',
    }, 'scale');

    /* b. Draw dots while SVG is still invisible (opacity:0) */
    tl.call(drawHeroDots, null, '+=0.1');

    /* c. Names + rings + dashed SVG + flanking text + nav toggle fade in together */
    tl.to(names, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
    }, 'rings');
    tl.to([ovalOuter, ovalMid, ovalInner, dashed], {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
    }, 'rings');

    tl.to(flankL, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
    }, 'rings');

    tl.to(flankR, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
    }, 'rings');

    if (navToggle) {
      tl.to(navToggle, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
      }, 'rings');
    }
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

  /* ── Page transition overlay — created once, reused for nav link jumps ── */
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.appendChild(overlay);


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

    /* Panel: single tween from corner — starts immediately on click.
       filter + opacity reset in case a previous close was interrupted mid-blur. */
    gsap.to(panel, {
      clipPath: 'inset(0% 0% 0% 0%)',
      filter: 'blur(0px)',
      opacity: 1,
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

    /* Close panel — clip-path shrinks, content blurs + fades for a soft dissolve.
       blur(6px) + opacity 0.85 softens the mechanical clip-path slide. */
    gsap.to(panel, {
      clipPath: 'inset(0% 0% 100% 100%)',
      filter: 'blur(6px)',
      opacity: 0.85,
      duration: 0.5,
      ease: 'power3.in',
      onComplete: function() {
        panel.setAttribute('hidden', '');
        panel.style.clipPath = 'inset(0% 0% 100% 100%)'; /* reset for next open */
        gsap.set(panel, { filter: 'blur(0px)', opacity: 1 }); /* reset blur for next open */
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


  /* ── Close on nav link click — fade transition to section ──
     Instead of smooth-scrolling past every animation, we:
     1. Close the panel (with blur dissolve)
     2. Fade a cream overlay in (300ms)
     3. Instant-jump to the target section
     4. Fade the overlay back out (300ms)
     This avoids the "animation storm" of scrolling past many
     ScrollTrigger-driven sections at high speed. */

  links.forEach(function(link) {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        closeNav();

        const target = document.querySelector(href);
        if (!target) return;

        if (prefersReduced) {
          /* Reduced motion: instant jump, no fade */
          target.scrollIntoView();
          return;
        }

        /* Wait for panel close to mostly finish, then fade→jump→unfade */
        setTimeout(function() {
          /* Fade overlay in */
          gsap.to(overlay, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.inOut',
            onComplete: function() {
              /* ── Measure position at scroll 0 ───────────────────────
                 offsetTop is broken for sticky elements — it returns
                 the current stuck/unstuck position, not the natural
                 flow position. The value changes with scroll position.
                 Fix: scroll to 0 (overlay hides the page), then read
                 getBoundingClientRect().top which gives the true
                 document position when scrollY is 0. */

              /* 1. Stop Lenis so it can't fight any scroll changes */
              if (window.lenis) window.lenis.stop();

              /* 2. Scroll to top, measure target's natural position */
              window.scrollTo(0, 0);
              var scrollTarget = target.getBoundingClientRect().top;

              /* DEBUG — check in browser console */
              console.log('[nav-jump] target:', href, 'scrollTarget:', scrollTarget);

              /* 3. Jump to the target section */
              window.scrollTo(0, scrollTarget);

              /* 4. Sync Lenis internal state to the new position */
              if (window.lenis) {
                window.lenis.animatedScroll = scrollTarget;
                window.lenis.targetScroll = scrollTarget;
              }

              /* 5. Force ScrollTrigger to recalculate and snap all animations.
                 refresh() recalculates trigger positions and target progress.
                 Then we force-snap every scrubbed animation to its correct
                 progress immediately — without this, scrub: 1 would take
                 1 second to interpolate, and the user would see stale
                 animation states (e.g. letters still visible).
                 .progress() also fires .call() callbacks the playhead
                 crosses, which triggers resetLetter() for the envelopes. */
              if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
                ScrollTrigger.getAll().forEach(function(st) {
                  if (st.animation) {
                    st.animation.progress(st.progress);
                  }
                });
              }

              /* 6. Wait one frame for the browser to paint, then restart */
              requestAnimationFrame(function() {
                if (window.lenis) window.lenis.start();

                gsap.to(overlay, {
                  opacity: 0,
                  duration: 0.3,
                  ease: 'power2.inOut',
                });
              });
            },
          });
        }, 500);
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
      start: 'top 60%',   /* begins when section top is 60% down the screen */
      end: 'top 5%',      /* completes when section top is 5% from the top */
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
  var heading           = document.getElementById('our-story-heading');
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
     +20px ensures no sub-pixel bleed at the envelope top edge. */

  function getStartY(envEl, letterEl) {
    return letterEl.offsetHeight / 2 - envEl.offsetHeight / 2 + 20;
  }


  /* ── Helper: extraction target Y ───────────────────────────────────
     The y value where the folded letter's visible bottom edge barely
     clears the envelope's top edge.

     Visible bottom of folded letter = y - letterH/6  (top 1/3 shown).
     Envelope top = -(envH/2).
     Solve for: y - letterH/6 = -(envH/2) - 15px clearance. */

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
     Heading starts oversized (GSAP will scrub scale 2.5 → 1).
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
    autoAlpha: 0, /* Hidden until extraction begins — avoids z-index paint-order issues on mobile */
  });
  gsap.set(eoinLetter, {
    xPercent: -50, yPercent: -50,
    y: getStartY(eoinCard, eoinLetter),
    clipPath: 'inset(0 0 66.66% 0)',
    zIndex: 0,
    autoAlpha: 0,
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
      /* Reveal letter — was autoAlpha: 0 to avoid z-index paint issues */
      .set(letterEl, { autoAlpha: 1 })

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
      autoAlpha: 0, /* Re-hide for same z-index paint-order reason */
    });
    gsap.set(cardEl, { clipPath: 'none' });
    gsap.set([foldUpper, foldLower], { opacity: 0 });
  }


  /* ── Scrubbed timeline ─────────────────────────────────────────────
     Controls title shrink, entrance, and flap via scroll.
     Letter extraction/unfold is triggered at a position via .call()
     but plays independently at real-time speed. Dead space after
     each trigger (~1.6 units) gives the standalone ~1.55s to finish.

     Title shrink runs on a SEPARATE ScrollTrigger (no pin) from
     'top bottom' → 'top top' so it plays while the section scrolls
     into view, finishing exactly when the pin takes over.

     Timeline positions (pinned timeline):
     0.6–1.2  Ashley entrance
     1.3–1.6  Ashley flap
     1.6      Ashley letter trigger → 2.0 unit reading gap
     3.6–4.2  Eoin entrance
     4.3–4.6  Eoin flap
     4.6      Eoin letter trigger → 2.0 unit reading gap
     4.6–6.6  End hold */

  /* ── Title shrink — separate scroll range, before the pin ────── */
  gsap.fromTo(heading, { scale: 5 }, {
    scale: 1,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'top -50%',
      scrub: 1,
    },
  });

  var spacer = document.querySelector('.story-scroll-spacer');

  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: spacer,
      start: 'top bottom',   // spacer top at viewport bottom = Our Story at viewport top
      end: 'bottom bottom',  // spacer bottom at viewport bottom
      scrub: window.innerWidth <= 640 ? 0.3 : 1,  // Less smoothing on mobile — prevents momentum lag
      invalidateOnRefresh: true,
    },
  });

  tl
    /* ── 0.6–1.2: Ashley entrance ────────────────────────────────── */
    .to(ashley,     { x: 0, ease: 'power2.out', duration: 0.6 }, 0.6)
    .to(ashleyCard, { z: 0, rotateY: 0, ease: 'power2.out', duration: 0.6 }, 0.6)

    /* ── 1.3–1.6: Ashley flap ────────────────────────────────────── */
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

    /* ── 3.6–4.2: Eoin entrance ──────────────────────────────────── */
    .to(eoin,     { x: 0, ease: 'power2.out', duration: 0.6 }, 3.6)
    .to(eoinCard, { z: 0, rotateY: 0, ease: 'power2.out', duration: 0.6 }, 3.6)

    /* ── 4.3–4.6: Eoin flap ──────────────────────────────────────── */
    .to(eoinFlap, { rotateX: 180, ease: 'power2.inOut', duration: 0.3 }, 4.3)

    /* ── 4.6: Trigger Eoin letter sequence ────────────────────────── */
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
    }, null, 4.6)

    /* ── 4.6–6.6: End hold ───────────────────────────────────────── */
    .to({}, { duration: 2.0 }, 4.6);
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



/* ------------------------------------------------------------
   Order of Events entrance
   Staggered fade-up: heading → paragraph. Plays once.
   ------------------------------------------------------------ */

(function initOrderOfEventsEntrance() {
  var section = document.querySelector('#order-of-events');
  if (!section) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  var heading = section.querySelector('h2');
  var body    = section.querySelector('.order-of-events__body');
  if (!heading || !body) return;

  gsap.set([heading, body], { autoAlpha: 0, y: 30 });

  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
      once: true,
    },
  })
  .to(heading, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' })
  .to(body,    { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.2);
}());


/* ------------------------------------------------------------
   Event section entrances (sections 5, 6, 8)
   Staggered fade-up: header → left column → right column.
   Plays once when section scrolls into view. Wedding Day
   (section 7) is excluded — handled separately.
   ------------------------------------------------------------ */

(function initEventSectionEntrances() {
  var sections = document.querySelectorAll('#welcome-dublin, #night-before, #day-two');
  if (!sections.length) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  sections.forEach(function(section) {
    var header = section.querySelector('.event-section__header');
    var cols   = section.querySelectorAll('.event-section__col');
    if (!header || !cols.length) return;

    /* Initial state: hidden and shifted down */
    gsap.set(header, { autoAlpha: 0, y: 30 });
    gsap.set(cols,   { autoAlpha: 0, y: 30 });

    /* Staggered entrance: header → left col → right col */
    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        once: true,
      },
    })
    .to(header, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' })
    .to(cols,   { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.2 }, 0.2);
  });
}());


/* ------------------------------------------------------------
   Section 7 — Wedding Day animations
   Four zones, each with distinct treatment:
   1. Upper (dark green): staggered entrance + fountain parallax
   2. Timeline (cream): events scrub in from sides + centre line draws
   3. Venue photo: parallax within container
   4. Venue info: fade-in (same pattern as event sections)
   ------------------------------------------------------------ */

(function initWeddingDayAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);


  /* ── Timeline stagger offset ───────────────────────────────────
     The right column needs padding-top = half an event's height +
     half the gap, so right events sit centred between left events.
     Calculated from the DOM so it stays correct at every viewport. */

  var rightCol    = document.querySelector('.timeline__col--right');
  var firstEvent  = document.querySelector('.timeline__col--left .timeline__event');

  function setTimelineOffset() {
    if (!rightCol || !firstEvent) return;
    var leftCol     = document.querySelector('.timeline__col--left');
    var gap         = parseFloat(getComputedStyle(leftCol).gap) || 0;
    var eventHeight = firstEvent.offsetHeight;
    rightCol.style.paddingTop = (eventHeight + gap) / 2 + 'px';
  }

  setTimelineOffset();

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setTimelineOffset, 150);
  });


  /* ── Zone 1: Upper section — staggered entrance ──────────────
     Each group fades up (autoAlpha 0→1, y 30→0) in sequence.
     Plays once when the section scrolls into view. */

  var wdHeader   = document.querySelector('.wedding-day__header');
  var threeCol   = document.querySelector('.wedding-day__three-col');
  var dividers   = document.querySelectorAll('.wedding-day__divider');
  var attire     = document.querySelector('.wedding-day__attire');

  if (wdHeader && threeCol && attire && dividers.length >= 2) {
    /* Build array in visual reading order */
    var zone1Items = [wdHeader, threeCol, dividers[0], attire, dividers[1]];

    /* Initial state: hidden and shifted down */
    gsap.set(zone1Items, { autoAlpha: 0, y: 30 });

    /* Staggered entrance — each beat offset from the previous */
    var zone1Tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.wedding-day__upper',
        start: 'top 80%',
        once: true,
      },
    });

    /* Beat 1: header */
    zone1Tl.to(wdHeader, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' });
    /* Beat 2: 3-col grid (0.2s after header starts) */
    zone1Tl.to(threeCol, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.2);
    /* Beat 3: first divider */
    zone1Tl.to(dividers[0], { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '+=0.15');
    /* Beat 4: second divider (follows first divider, not attire) */
    zone1Tl.to(dividers[1], { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '+=0.15');
  }

  /* Attire gets its own ScrollTrigger — fires when it enters the viewport */
  if (attire) {
    gsap.set(attire, { autoAlpha: 0, y: 30 });
    gsap.to(attire, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: attire,
        start: 'top 85%',
        once: true,
      },
    });
  }


  /* ── Zone 1: Fountain photo parallax ─────────────────────────
     Image is 120% tall (CSS). GSAP shifts it from yPercent: -10
     (top cropped) to 0 (bottom cropped) as you scroll past. */

  var fountainWrap  = document.querySelector('.wedding-day__fountain-wrap');
  var fountainPhoto = document.querySelector('.wedding-day__fountain-photo');

  if (fountainWrap && fountainPhoto) {
    gsap.fromTo(fountainPhoto,
      { yPercent: -10 },
      {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: fountainWrap,
          start: 'top bottom',   /* photo enters viewport */
          end: 'bottom top',     /* photo leaves viewport */
          scrub: true,
        },
      }
    );
  }


  /* ── Zone 2: Timeline events — scrub from sides ──────────────
     Left column events slide in from left (x: -30 → 0).
     Right column events slide in from right (x: 30 → 0).
     Each event has its own ScrollTrigger for individual timing. */

  var leftEvents  = document.querySelectorAll('.timeline__col--left .timeline__event');
  var rightEvents = document.querySelectorAll('.timeline__col--right .timeline__event');

  leftEvents.forEach(function(event) {
    gsap.set(event, { autoAlpha: 0, x: -30 });
    gsap.to(event, {
      autoAlpha: 1, x: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: event,
        start: 'top 90%',
        end: 'top 60%',
        scrub: true,
      },
    });
  });

  rightEvents.forEach(function(event) {
    gsap.set(event, { autoAlpha: 0, x: 30 });
    gsap.to(event, {
      autoAlpha: 1, x: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: event,
        start: 'top 90%',
        end: 'top 60%',
        scrub: true,
      },
    });
  });


  /* ── Zone 2: Centre line draws on scroll ─────────────────────
     GSAP animates the --line-progress CSS variable on the
     timeline section. The ::before pseudo-element reads it via
     scaleY(var(--line-progress)), drawing top-to-bottom. */

  var timelineSection = document.querySelector('.wedding-day__timeline-section');

  var timelineGrid = document.querySelector('.wedding-day__timeline');

  if (timelineSection && timelineGrid) {
    gsap.to(timelineSection, {
      '--line-progress': 1,
      ease: 'none',
      scrollTrigger: {
        trigger: timelineGrid,       /* Content area, not the padded section */
        start: 'top 90%',            /* Same as first event's start */
        end: 'bottom 60%',           /* When last event's top hits 60% */
        scrub: true,
      },
    });
  }


  /* ── Zone 3: Venue photo parallax ────────────────────────────
     Same technique as fountain: image is 120% tall (CSS),
     GSAP drifts it from yPercent: -10 to 0 on scroll. */

  var venuePhotoWrap = document.querySelector('.wedding-day__venue-photo-wrap');
  var venuePhoto     = document.querySelector('.wedding-day__venue-photo');

  if (venuePhotoWrap && venuePhoto) {
    gsap.fromTo(venuePhoto,
      { yPercent: -10 },
      {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: venuePhotoWrap,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  }


  /* ── Zone 4: Venue info — staggered fade-in ──────────────────
     Same pattern as event sections: left column first,
     right column 0.2s later. Plays once. */

  var venueLeft  = document.querySelector('.venue__left');
  var venueRight = document.querySelector('.venue__right');

  if (venueLeft && venueRight) {
    gsap.set([venueLeft, venueRight], { autoAlpha: 0, y: 30 });

    gsap.timeline({
      scrollTrigger: {
        trigger: '#the-venue',
        start: 'top 80%',
        once: true,
      },
    })
    .to(venueLeft,  { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' })
    .to(venueRight, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.2);
  }

}());


/* ------------------------------------------------------------
   Section 9 — How to Get There animations
   Three layers:
   1. Heading + text + map — fade-in (play-once, event-section pattern)
   2. Polaroids — slide up from below (play-once, staggered)
   3. Route dot — draws Dublin → Ballintubbert on scrub
   ------------------------------------------------------------ */

(function initGettingThereAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  var section       = document.getElementById('getting-there');
  if (!section) return;

  var heading       = document.getElementById('getting-there-heading');
  var textCol       = section.querySelector('.getting-there__text');
  var map           = section.querySelector('.getting-there__map');
  var backPolaroid  = section.querySelector('.getting-there__polaroid--back');
  var frontPolaroid = section.querySelector('.getting-there__polaroid--front');
  var routeSvg      = section.querySelector('.getting-there__route');


  /* ── Fade in: heading, text, map (play-once) ──────────────── */

  if (heading && textCol && map) {
    gsap.set([heading, textCol, map], { autoAlpha: 0, y: 30 });

    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        once: true,
      },
    })
    .to(heading, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' })
    .to(textCol, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.2)
    .to(map,     { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.2);
  }


  /* ── Polaroids: scrub up from below viewport ─────────────────
     Both start a full viewport height below their CSS position.
     A scrubbed timeline sequences them: back rises first across
     timeline 0–1, front rises across 0.6–1.6. The overlap means
     the front starts while the back is still finishing. */

  if (backPolaroid && frontPolaroid) {
    var offScreenY = window.innerHeight;
    gsap.set(backPolaroid,  { autoAlpha: 0, y: offScreenY, rotation: 13.308 });
    gsap.set(frontPolaroid, { autoAlpha: 0, y: offScreenY, rotation: 8.62 });

    var polaroidTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 30%',
        end: 'top -40%',
        scrub: true,
      },
    });

    /* Back polaroid: timeline positions 0–1 */
    polaroidTl.to(backPolaroid, { autoAlpha: 1, y: 0, rotation: 13.308, duration: 1, ease: 'power2.out' }, 0);
    /* Front polaroid: timeline positions 0.6–1.6 (starts when back is 60% done) */
    polaroidTl.to(frontPolaroid, { autoAlpha: 1, y: 0, rotation: 8.62, duration: 1, ease: 'power2.out' }, 0.6);
  }


  /* ── Route: dot traces Dublin → Ballintubbert (scrub) ───────
     Creates a path + circle inside the existing overlay SVG.
     Stroke-dashoffset draws the line; getPointAtLength() moves
     the dot to the leading edge on each scroll update. */

  if (routeSvg) {
    var svgNS = 'http://www.w3.org/2000/svg';

    /* Approximate coordinates within viewBox 0 0 273 343.
       Tweak these if the dot doesn't land on the right spot. */
    var dublinX = 205, dublinY = 165;
    var ballinX = 165, ballinY = 200;
    /* Quadratic bezier control point — gentle southwest arc */
    var cpX = 195, cpY = 190;

    /* Route path */
    var routePath = document.createElementNS(svgNS, 'path');
    routePath.setAttribute('d',
      'M ' + dublinX + ' ' + dublinY +
      ' Q ' + cpX + ' ' + cpY +
      ' ' + ballinX + ' ' + ballinY
    );
    routePath.setAttribute('stroke', '#43461f');
    routePath.setAttribute('stroke-width', '2');
    routePath.setAttribute('fill', 'none');
    routePath.setAttribute('stroke-linecap', 'round');
    routeSvg.appendChild(routePath);

    /* Travelling dot */
    var dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', dublinX);
    dot.setAttribute('cy', dublinY);
    dot.setAttribute('r', '5');
    dot.setAttribute('fill', '#43461f');
    routeSvg.appendChild(dot);

    /* Stroke-dasharray setup — fully hidden at start */
    var totalLength = routePath.getTotalLength();
    routePath.style.strokeDasharray = totalLength;
    routePath.style.strokeDashoffset = totalLength;

    /* Scrub: draw path + move dot to leading edge */
    ScrollTrigger.create({
      trigger: section,
      start: 'top 30%',
      end: 'top -40%',
      scrub: true,
      onUpdate: function(self) {
        var progress = self.progress;
        /* Draw the line from Dublin toward Ballintubbert */
        routePath.style.strokeDashoffset = totalLength * (1 - progress);
        /* Position dot at the leading edge of the drawn line */
        var point = routePath.getPointAtLength(progress * totalLength);
        dot.setAttribute('cx', point.x);
        dot.setAttribute('cy', point.y);
      },
    });
  }

}());


/* ------------------------------------------------------------
   Section 10 — Where to Stay entrance
   Staggered fade-up: heading → intro → two columns.
   ------------------------------------------------------------ */

(function initWhereToStayEntrance() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  var section = document.getElementById('where-to-stay');
  if (!section) return;

  var heading = document.getElementById('where-to-stay-heading');
  var intro   = section.querySelector('.where-to-stay__intro');
  var cols    = section.querySelectorAll('.where-to-stay__col');

  if (!heading || !intro || !cols.length) return;

  gsap.set([heading, intro], { autoAlpha: 0, y: 30 });
  gsap.set(cols, { autoAlpha: 0, y: 30 });

  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
      once: true,
    },
  })
  .to(heading, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' })
  .to(intro,   { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.2)
  .to(cols,    { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.2 }, 0.4);
}());


/* ------------------------------------------------------------
   Section 11 — Common Questions entrance
   Staggered fade-up: heading → each FAQ item one by one.
   ------------------------------------------------------------ */

(function initFaqEntrance() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  var section = document.getElementById('common-questions');
  if (!section) return;

  var heading  = section.querySelector('h2');
  var faqItems = section.querySelectorAll('.faq__item');

  if (!heading || !faqItems.length) return;

  gsap.set(heading, { autoAlpha: 0, y: 30 });
  gsap.set(faqItems, { autoAlpha: 0, y: 30 });

  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
      once: true,
    },
  })
  .to(heading,  { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' })
  .to(faqItems, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1 }, 0.2);
}());


/* ------------------------------------------------------------
   Section 12 — Gifts entrance
   Staggered fade-up: header row → three cards.
   ------------------------------------------------------------ */

(function initGiftsEntrance() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  var section = document.getElementById('gifts');
  if (!section) return;

  var header = section.querySelector('.gifts__header');
  var cards  = section.querySelectorAll('.gifts__card');

  if (!header || !cards.length) return;

  gsap.set(header, { autoAlpha: 0, y: 30 });
  gsap.set(cards, { autoAlpha: 0, y: 30 });

  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
      once: true,
    },
  })
  .to(header, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' })
  .to(cards,  { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.15 }, 0.2);
}());
