/* ============================================================
   WEDDING WEBSITE — Ashley & Eoin
   Main JavaScript
   ============================================================ */


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

  buttons.forEach(function(button) {
    button.addEventListener('click', function() {
      const isOpen   = this.getAttribute('aria-expanded') === 'true';
      const answerId = this.getAttribute('aria-controls');
      const answer   = document.getElementById(answerId);

      /* Close all other open items first */
      buttons.forEach(function(otherButton) {
        if (otherButton !== button) {
          otherButton.setAttribute('aria-expanded', 'false');
          const otherId     = otherButton.getAttribute('aria-controls');
          const otherAnswer = document.getElementById(otherId);
          if (otherAnswer) otherAnswer.hidden = true;
        }
      });

      /* Toggle this item */
      this.setAttribute('aria-expanded', String(!isOpen));
      answer.hidden = isOpen;
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
