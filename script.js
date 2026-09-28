const canvas = document.getElementById("scroll-canvas");
const ctx = canvas.getContext("2d");
const frameCount = 243;
const frameImages = new Array(frameCount);
let currentProgress = 0;
let lastProgress = 0;
let firstFrameReady = false;
let loadedCount = 0;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function framePath(index) {
  return `frames/frame_${String(index + 1).padStart(6, "0")}.png`;
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderFrame(currentProgress);
}

function drawCoverImage(image, x = 0, y = 0, width = canvas.width, height = canvas.height) {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let drawX = x;
  let drawY = y;

  if (imageRatio > targetRatio) {
    drawHeight = height;
    drawWidth = height * imageRatio;
    drawX = (width - drawWidth) / 2;
  } else {
    drawWidth = width;
    drawHeight = width / imageRatio;
    drawY = (height - drawHeight) / 2;
  }

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function renderFrame(progress) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  ctx.clearRect(0, 0, width, height);

  const baseFrame = Math.min(frameCount - 1, Math.max(0, Math.floor(progress * (frameCount - 1))));
  const nextFrame = Math.min(frameCount - 1, baseFrame + 1);
  const fractional = progress * (frameCount - 1) - baseFrame;

  const firstImage = frameImages[baseFrame];
  const secondImage = frameImages[nextFrame];

  if (firstImage && firstImage.complete) {
    if (secondImage && secondImage.complete && fractional > 0) {
      ctx.save();
      ctx.globalAlpha = 1 - fractional;
      drawCoverImage(firstImage, 0, 0, width, height);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = fractional;
      drawCoverImage(secondImage, 0, 0, width, height);
      ctx.restore();
    } else {
      drawCoverImage(firstImage, 0, 0, width, height);
    }
  } else {
    ctx.fillStyle = "#05070b";
    ctx.fillRect(0, 0, width, height);
  }
}

function preloadImages() {
  const totalToLoad = 16;

  for (let i = 1; i < totalToLoad; i += 1) {
    const img = new Image();
    img.src = framePath(i);
    img.onload = () => {
      frameImages[i] = img;
      loadedCount += 1;
      if (i === 1 && !firstFrameReady) {
        firstFrameReady = true;
        renderFrame(0);
      }
    };
    frameImages[i] = img;
  }

  for (let i = totalToLoad; i < frameCount; i += 1) {
    const img = new Image();
    img.onload = () => {
      frameImages[i] = img;
      loadedCount += 1;
    };
    img.src = framePath(i);
    frameImages[i] = img;
  }
}

const firstImage = new Image();
firstImage.onload = () => {
  frameImages[0] = firstImage;
  firstFrameReady = true;
  renderFrame(0);
};
firstImage.src = framePath(0);

preloadImages();

function updateScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const target = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  currentProgress = prefersReducedMotion ? target : currentProgress + (target - currentProgress) * 0.08;
  lastProgress = currentProgress;
  renderFrame(currentProgress);
}

window.addEventListener("scroll", () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const target = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  currentProgress = target;
  renderFrame(currentProgress);
}, { passive: true });

window.addEventListener("resize", resizeCanvas);

const header = document.querySelector(".site-header");
function updateHeaderState() {
  header.classList.toggle("scrolled", window.scrollY > 12);
}
window.addEventListener("scroll", updateHeaderState, { passive: true });

const revealItems = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.12 }
);
revealItems.forEach((item) => observer.observe(item));

const faqButtons = document.querySelectorAll(".faq-question");
faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.parentElement;
    const isOpen = item.classList.contains("active");

    faqButtons.forEach((btn) => {
      btn.parentElement.classList.remove("active");
    });

    if (!isOpen) {
      item.classList.add("active");
    }
  });
});

const statNumbers = document.querySelectorAll(".stat-number");
const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.animated === "true") return;

      const target = Number(entry.target.dataset.target || 0);
      const suffix = entry.target.dataset.suffix || "";
      const duration = 1200;
      const startTime = performance.now();

      function tick(time) {
        const progress = Math.min((time - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        entry.target.textContent = `${value}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          entry.target.dataset.animated = "true";
          entry.target.textContent = `${target}${suffix}`;
        }
      }

      requestAnimationFrame(tick);
    });
  },
  { threshold: 0.5 }
);

statNumbers.forEach((number) => statObserver.observe(number));

resizeCanvas();
updateHeaderState();
renderFrame(0);

if (prefersReducedMotion) {
  currentProgress = 0;
  renderFrame(0);
} else {
  let rafId = null;
  function animate() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const target = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    currentProgress += (target - currentProgress) * 0.08;
    if (Math.abs(target - currentProgress) < 0.0005) {
      currentProgress = target;
    }
    renderFrame(currentProgress);
    rafId = requestAnimationFrame(animate);
  }
  rafId = requestAnimationFrame(animate);
}

window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(rafId || 0);
});
