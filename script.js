const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

function setMenuState(isOpen) {
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  navLinks.classList.toggle("open", isOpen);
}

menuToggle?.addEventListener("click", () => {
  setMenuState(menuToggle.getAttribute("aria-expanded") !== "true");
});
navLinks?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuState(false)));

function updateHeaderState() {
  header?.classList.toggle("scrolled", window.scrollY > 12);
}
window.addEventListener("scroll", updateHeaderState, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const faqButtons = document.querySelectorAll(".faq-question");
faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const isOpen = item.classList.contains("active");
    faqButtons.forEach((faqButton) => {
      faqButton.closest(".faq-item").classList.remove("active");
      faqButton.setAttribute("aria-expanded", "false");
    });
    if (!isOpen) {
      item.classList.add("active");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting || entry.target.dataset.animated === "true") return;
    const target = Number(entry.target.dataset.target);
    const suffix = entry.target.dataset.suffix || "";
    const startTime = performance.now();
    function tick(time) {
      const progress = Math.min((time - startTime) / 900, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      entry.target.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
      else {
        entry.target.dataset.animated = "true";
        entry.target.textContent = `${target}${suffix}`;
      }
    }
    requestAnimationFrame(tick);
  });
}, { threshold: 0.5 });
document.querySelectorAll(".stat-number[data-target]").forEach((number) => statObserver.observe(number));

const newsletterForm = document.querySelector(".newsletter-form");
newsletterForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = newsletterForm.querySelector("input");
  const message = newsletterForm.querySelector(".form-message");
  if (message) message.textContent = email.value ? "Thanks. We will keep you updated." : "Enter your email to subscribe.";
  if (email.value) newsletterForm.reset();
});

const slider = document.querySelector("[data-slider]");
if (slider) {
  const slides = [...slider.querySelectorAll("[data-slide]")];
  const dots = [...slider.querySelectorAll("[data-slide-to]")];
  const previousButton = slider.querySelector(".slider-prev");
  const nextButton = slider.querySelector(".slider-next");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeSlide = 0;
  let rotationTimer;

  function showSlide(index) {
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === activeSlide));
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeSlide;
      dot.classList.toggle("active", isActive);
      dot.setAttribute("aria-selected", String(isActive));
    });
  }

  function startRotation() {
    if (reduceMotion) return;
    window.clearInterval(rotationTimer);
    rotationTimer = window.setInterval(() => showSlide(activeSlide + 1), 7000);
  }

  previousButton.addEventListener("click", () => { showSlide(activeSlide - 1); startRotation(); });
  nextButton.addEventListener("click", () => { showSlide(activeSlide + 1); startRotation(); });
  dots.forEach((dot) => dot.addEventListener("click", () => { showSlide(Number(dot.dataset.slideTo)); startRotation(); }));
  slider.addEventListener("mouseenter", () => window.clearInterval(rotationTimer));
  slider.addEventListener("mouseleave", startRotation);
  slider.addEventListener("focusin", () => window.clearInterval(rotationTimer));
  slider.addEventListener("focusout", startRotation);
  showSlide(0);
  startRotation();
}

if (menuToggle && navLinks) setMenuState(false);
updateHeaderState();
