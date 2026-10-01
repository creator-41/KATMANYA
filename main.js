const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const steps = [...document.querySelectorAll(".step")];
const stageWord = document.querySelector("#stage-word");
const stageIndex = document.querySelector(".stage-index");
const stageCube = document.querySelector(".stage-cube");
const words = ["FİKRİNİ ANLAT", "BİRLİKTE NETLEŞTİR", "ÜRETİME GEÇ"];
if ("IntersectionObserver" in window && steps.length) {
  const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const index = Number(entry.target.dataset.step);
      steps.forEach((step) => step.classList.toggle("is-active", step === entry.target));
      stageWord.textContent = words[index];
      stageIndex.textContent = `0${index + 1}`;
      stageCube.style.transform = ["rotateX(-27deg) rotateY(-38deg)", "rotateX(28deg) rotateY(52deg)", "rotateX(-20deg) rotateY(142deg)"][index];
    });
  }, { rootMargin: "-35% 0px -35% 0px", threshold: 0 });
  steps.forEach((step) => stepObserver.observe(step));
}

const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".topbar nav");
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  nav.classList.toggle("is-open", !open);
});
nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  nav.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
}));
document.querySelector("#year").textContent = new Date().getFullYear();