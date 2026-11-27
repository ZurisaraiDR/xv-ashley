// Canvas 2D:        https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
// rAF:              https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
// IntersectionObs.: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
import { createBurst, createConfettiCannon, stepParticles } from './particles.js';

// Deeper tones of the invitation's palette: the light pastels would vanish on the pastel sky.
const FIREWORK_COLORS = ['#c9a14a', '#e48aa0', '#6f9fd6', '#e9a86f', '#d98aa6'];
const CONFETTI_COLORS = ['#c9a14a', '#e48aa0', '#6f9fd6', '#a9c8ea', '#f2c46b'];
const SPARKS_PER_BURST = 46;
const CONFETTI_PER_CANNON = 70;
const MAX_PARTICLES = 900;               // keeps older phones smooth
const SHOW_EVERY_MS = 1500;              // a new firework while the finale is on screen
const MAX_PIXEL_RATIO = 2;               // sharp on retina screens without overworking the GPU
const MAX_FRAME_SECONDS = 0.05;          // a long pause (tab switch) never makes particles jump

/**
 * The finale's fireworks: a grand opening (two confetti cannons and a volley of bursts) the first
 * time the closing section appears, a firework every 1.5 s while it stays on screen, and one more
 * wherever the guest taps. The loop only runs while the section is visible.
 */
export function setupFinale(section) {
  const canvas = section.querySelector('[data-finale-canvas]');
  const show = { section, canvas, context: canvas.getContext('2d'), particles: [], frameId: 0, timerId: 0, lastTime: 0, hasOpened: false };

  fitCanvasToSection(show);
  window.addEventListener('resize', () => fitCanvasToSection(show));
  section.addEventListener('pointerdown', (event) => launchAtPointer(show, event));
  new IntersectionObserver(([entry]) => (entry.isIntersecting ? startShow(show) : stopShow(show)), { threshold: 0.35 })
    .observe(section);
}

function fitCanvasToSection(show) {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const { width, height } = show.section.getBoundingClientRect();
  show.canvas.width = Math.round(width * ratio);
  show.canvas.height = Math.round(height * ratio);
  show.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  show.width = width;
  show.height = height;
}

function startShow(show) {
  if (!show.hasOpened) {
    show.hasOpened = true;
    grandOpening(show);
  }
  show.timerId = window.setInterval(() => launchRandomFirework(show), SHOW_EVERY_MS);
  show.lastTime = performance.now();
  show.frameId = requestAnimationFrame((time) => renderFrame(show, time));
}

function stopShow(show) {
  window.clearInterval(show.timerId);
  cancelAnimationFrame(show.frameId);
}

function grandOpening(show) {
  const floor = show.height;
  addParticles(show, createConfettiCannon({ x: 0, y: floor, side: 'left', count: CONFETTI_PER_CANNON, colors: CONFETTI_COLORS, random: Math.random }));
  addParticles(show, createConfettiCannon({ x: show.width, y: floor, side: 'right', count: CONFETTI_PER_CANNON, colors: CONFETTI_COLORS, random: Math.random }));
  [0, 350, 700, 1050].forEach((delay) => window.setTimeout(() => launchRandomFirework(show), delay));
}

function launchRandomFirework(show) {
  const x = show.width * (0.15 + Math.random() * 0.7);
  const y = show.height * (0.12 + Math.random() * 0.4);
  launchFirework(show, x, y);
}

function launchAtPointer(show, event) {
  const box = show.section.getBoundingClientRect();
  launchFirework(show, event.clientX - box.left, event.clientY - box.top);
}

function launchFirework(show, x, y) {
  addParticles(show, createBurst({ x, y, count: SPARKS_PER_BURST, colors: FIREWORK_COLORS, random: Math.random }));
}

function addParticles(show, newParticles) {
  show.particles = show.particles.concat(newParticles).slice(-MAX_PARTICLES);
}

function renderFrame(show, time) {
  const dt = Math.min((time - show.lastTime) / 1000, MAX_FRAME_SECONDS);
  show.lastTime = time;
  show.particles = stepParticles(show.particles, dt);
  draw(show);
  show.frameId = requestAnimationFrame((next) => renderFrame(show, next));
}

function draw({ context, width, height, particles }) {
  context.clearRect(0, 0, width, height);
  for (const particle of particles) {
    context.globalAlpha = Math.max(0, particle.life);
    context.fillStyle = particle.color;
    if (particle.kind === 'confetti') drawConfetti(context, particle);
    else drawSpark(context, particle);
  }
  context.globalAlpha = 1;
}

function drawSpark(context, spark) {
  context.beginPath();
  context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
  context.fill();
  // A faint halo reads as glow on the dark sky, without the cost of canvas shadows.
  context.globalAlpha *= 0.25;
  context.beginPath();
  context.arc(spark.x, spark.y, spark.size * 3, 0, Math.PI * 2);
  context.fill();
}

function drawConfetti(context, piece) {
  context.save();
  context.translate(piece.x, piece.y);
  context.rotate(piece.rotation);
  context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
  context.restore();
}
