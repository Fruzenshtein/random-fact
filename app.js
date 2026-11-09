(function () {
  const facts = window.FACTS;
  const stage = document.getElementById("stage");
  const factEl = document.getElementById("fact");

  const MIN_FONT = 18;
  const MAX_FONT = 220;
  const STORAGE_KEY = "random-fact:last";

  function readLastIndex() {
    try {
      const value = Number(localStorage.getItem(STORAGE_KEY));
      return Number.isInteger(value) ? value : -1;
    } catch (_) {
      return -1;
    }
  }

  function writeLastIndex(index) {
    try {
      localStorage.setItem(STORAGE_KEY, String(index));
    } catch (_) {}
  }

  function pickIndex() {
    const last = readLastIndex();
    if (facts.length < 2) return 0;
    let index = Math.floor(Math.random() * (facts.length - 1));
    if (index >= last) index += 1;
    return index;
  }

  function contentBox() {
    const cs = getComputedStyle(stage);
    return {
      width: stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
      height: stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
    };
  }

  function fits(size, box) {
    factEl.style.fontSize = size + "px";
    return factEl.scrollWidth <= box.width && factEl.scrollHeight <= box.height;
  }

  function fitText() {
    const box = contentBox();
    let lo = MIN_FONT;
    let hi = MAX_FONT;
    if (!fits(lo, box)) {
      factEl.style.fontSize = lo + "px";
      return;
    }
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      if (fits(mid, box)) lo = mid;
      else hi = mid;
    }
    factEl.style.fontSize = lo + "px";
  }

  function showFact() {
    const index = pickIndex();
    writeLastIndex(index);
    factEl.classList.add("is-hidden");
    factEl.textContent = facts[index];
    fitText();
    void factEl.offsetWidth;
    factEl.classList.remove("is-hidden");
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(fitText).observe(stage);
  }
  window.addEventListener("resize", fitText);
  window.addEventListener("orientationchange", fitText);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fitText);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitText);
  }

  showFact();
})();
