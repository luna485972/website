const images = document.querySelectorAll('.gallery img', '.gallery video');

let scrollingStarted = false;
let observer;

window.addEventListener(
  "scroll",
  () => {
    if (scrollingStarted) return;

    scrollingStarted = true;

    observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            entry.target.classList.remove("is-hidden");
          } else {
            entry.target.classList.remove("is-visible");
            entry.target.classList.add("is-hidden");
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -7% 0px"
      }
    );

    images.forEach((img) => {
      observer.observe(img);
    });
  },
  { once: true }
);

/* ---------- Filter ---------- */

const gallery = document.querySelector('.gallery');
const galleryItems = Array.from(document.querySelectorAll('.gallery__item'));
const filterButtons = document.querySelectorAll('.filter-btn');

// Show/hide items whose data-type matches the chosen filter.
// 'all' clears the filter and shows everything again.
function filterGallery(type) {
  galleryItems.forEach((item) => {
    const matches = type === 'all' ||
    item.dataset.type.split(' ').includes(type);
    
    item.classList.toggle('is-filtered-out', !matches);
    item.setAttribute('aria-hidden', String(!matches));
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => {
      b.classList.remove('is-active');
      b.setAttribute('aria-pressed', 'false');
    });

    btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', 'true');

    filterGallery(btn.dataset.filter);
  });
});

/* ---------- Hover: tint the page background per image ---------- */

galleryItems.forEach((item) => {
  item.addEventListener('mouseenter', () => {
    const color = getComputedStyle(item).getPropertyValue('--tile-color').trim();
    if (color) document.body.style.backgroundColor = color;
  });

  item.addEventListener('mouseleave', () => {
    document.body.style.backgroundColor = ''; // falls back to the CSS default (--paper)
  });
});

/* ---------- Cursor letter trail ---------- */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const canvas = document.getElementById('pixel-trail');
  const ctx = canvas.getContext('2d');

  const LIFESPAN = 3000;
  const MAX_PARTICLES = 400;

  // Characters used in the trail
  const LETTERS = 'SCROLL   FOR  THE PROJECTS  ↓   ↓   ↓   ↓'.split('');
  let letterIndex = 0;

  let particles = [];
  let lastX = null;
  let lastY = null;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function isTooClose(x, y, minDistance = 24) {
  return particles.some((p) => {
    const dx = p.x - x;
    const dy = p.y - y;

    return Math.hypot(dx, dy) < minDistance;
  });
}

  function spawnParticle(x, y) {
    if (isTooClose(x, y)) return;
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: Math.random() * 0.3 + 0.1,

      letter: LETTERS[letterIndex % LETTERS.length],
      
      size: 20,
      rotation: 0,

      born: performance.now(),
    });
    letterIndex++;

    if (particles.length > MAX_PARTICLES) {
      particles.shift();
    }
  }

  function inTriggerZone() {
    return window.scrollY < window.innerHeight*0.1;
  }

function spawnAlongPath(x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const spacing = 24; // matches isTooClose's minDistance
  const steps = Math.min(Math.max(1, Math.floor(dist / spacing)), 40);

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    spawnParticle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
  }
}

function handlePointerActivity(e) {
  if (!inTriggerZone()) {
    lastX = null;
    lastY = null;
    return;
  }

  const { clientX: x, clientY: y } = e;

  if (lastX === null) {
    spawnParticle(x, y);
  } else {
    spawnAlongPath(lastX, lastY, x, y);
  }

  lastX = x;
  lastY = y;
}

function resetTrail() {
  lastX = null;
  lastY = null;
}

window.addEventListener('pointerdown', handlePointerActivity, { passive: true });
window.addEventListener('pointermove', handlePointerActivity, { passive: true });
window.addEventListener('pointerup', resetTrail, { passive: true });
window.addEventListener('pointercancel', resetTrail, { passive: true });

  function animateTrail(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter((p) => now - p.born <= LIFESPAN);

    particles.forEach((p) => {
      const lifeRatio = (now - p.born) / LIFESPAN;

      const ground = window.innerHeight*0.9;

      p.vy += 0.009;
      p.x += p.vx;
      p.y += p.vy;

      // ground collision
      if (p.y >= ground) {
        p.y = ground;

        p.vy = 0;
        p.vx *= 0.92;
      }

      const alpha =
        lifeRatio < 0.7
          ? 1
          : Math.max(0, 1 - (lifeRatio - 0.7) / 0.3);

      ctx.save();

      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);

      ctx.font = `${p.size}px "Space Grotesk", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha})`;

      ctx.fillText(p.letter, 0, 0);

      ctx.restore();
    });

    requestAnimationFrame(animateTrail);
  }

  requestAnimationFrame(animateTrail);
}