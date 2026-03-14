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
