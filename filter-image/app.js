(function () {
  const LEVELS = [32, 48, 72, 108, 160];
  const FINAL = LEVELS.length;
  const MAX_DPR = 2;

  const images = Array.isArray(window.IMAGES) ? window.IMAGES.filter(Boolean) : [];

  const stage = document.getElementById("stage");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const counterEl = document.getElementById("counter");
  const stepEls = Array.from(document.querySelectorAll("#steps .step"));
  const enhanceBtn = document.getElementById("enhance");
  const revealBtn = document.getElementById("reveal");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");

  const loads = new Map();
  const mosaics = new WeakMap();

  let index = 0;
  let level = 0;
  let current = null;
  let token = 0;

  function loadImage(src) {
    if (loads.has(src)) return loads.get(src);
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(src));
      img.src = src;
    });
    promise.catch(() => loads.delete(src));
    loads.set(src, promise);
    return promise;
  }

  function makeCanvas(width, height) {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    return c;
  }

  function smoothContext(c) {
    const cx = c.getContext("2d");
    cx.imageSmoothingEnabled = true;
    cx.imageSmoothingQuality = "high";
    return cx;
  }

  function mosaicFor(img, blocksX) {
    let perImage = mosaics.get(img);
    if (!perImage) {
      perImage = new Map();
      mosaics.set(img, perImage);
    }
    if (perImage.has(blocksX)) return perImage.get(blocksX);

    const blocksY = Math.max(1, Math.round(blocksX * img.naturalHeight / img.naturalWidth));
    let source = img;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    while (sw / 2 >= blocksX && sh / 2 >= blocksY) {
      const half = makeCanvas(Math.ceil(sw / 2), Math.ceil(sh / 2));
      smoothContext(half).drawImage(source, 0, 0, sw, sh, 0, 0, half.width, half.height);
      source = half;
      sw = half.width;
      sh = half.height;
    }
    const small = makeCanvas(blocksX, blocksY);
    smoothContext(small).drawImage(source, 0, 0, sw, sh, 0, 0, blocksX, blocksY);
    perImage.set(blocksX, small);
    return small;
  }

  function fitCanvas() {
    const boxW = stage.clientWidth;
    const boxH = stage.clientHeight;
    const ratio = current ? current.naturalWidth / current.naturalHeight : 1;
    let cssW = Math.min(boxW, boxH * ratio);
    let cssH = cssW / ratio;
    cssW = Math.max(0, Math.floor(cssW));
    cssH = Math.max(0, Math.floor(cssH));
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const pxW = Math.max(1, Math.round(cssW * dpr));
    const pxH = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
    }
  }

  function draw() {
    fitCanvas();
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!current) return;
    if (level >= FINAL) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(current, 0, 0, w, h);
      return;
    }
    const small = mosaicFor(current, LEVELS[level]);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, small.width, small.height, 0, 0, w, h);
  }

  function setStatus(text) {
    statusEl.textContent = text || "";
    statusEl.hidden = !text;
  }

  function updateUi() {
    const ready = Boolean(current);
    const done = level >= FINAL;
    stepEls.forEach((el, i) => el.classList.toggle("is-on", i < level));
    enhanceBtn.disabled = !ready || done;
    revealBtn.disabled = !ready || done;
    prevBtn.disabled = images.length < 2;
    nextBtn.disabled = images.length < 2;
    counterEl.textContent = images.length ? `${index + 1} / ${images.length}` : "";
  }

  function preloadNeighbours() {
    if (images.length < 2) return;
    loadImage(images[(index + 1) % images.length]).catch(() => {});
    loadImage(images[(index - 1 + images.length) % images.length]).catch(() => {});
  }

  function show(i) {
    if (!images.length) {
      setStatus("Додайте фото у теку images та перелічіть їх у файлі images.js");
      updateUi();
      return;
    }
    index = (i + images.length) % images.length;
    level = 0;
    current = null;
    const my = ++token;
    setStatus("Завантаження…");
    updateUi();
    draw();
    loadImage(images[index])
      .then((img) => {
        if (my !== token) return;
        current = img;
        setStatus(null);
        draw();
        updateUi();
        preloadNeighbours();
      })
      .catch(() => {
        if (my !== token) return;
        setStatus(`Не вдалося завантажити ${images[index]}`);
        updateUi();
      });
  }

  function enhance() {
    if (!current || level >= FINAL) return;
    level += 1;
    draw();
    updateUi();
  }

  function reveal() {
    if (!current || level >= FINAL) return;
    level = FINAL;
    draw();
    updateUi();
  }

  enhanceBtn.addEventListener("click", enhance);
  revealBtn.addEventListener("click", reveal);
  prevBtn.addEventListener("click", () => show(index - 1));
  nextBtn.addEventListener("click", () => show(index + 1));

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const onButton = event.target instanceof HTMLButtonElement;
    switch (event.code) {
      case "ArrowLeft":
        event.preventDefault();
        show(index - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        show(index + 1);
        break;
      case "Space":
      case "Enter":
        if (onButton) return;
        event.preventDefault();
        enhance();
        break;
      case "KeyR":
        event.preventDefault();
        reveal();
        break;
      default:
        break;
    }
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(draw).observe(stage);
  }
  window.addEventListener("resize", draw);

  show(0);
})();
