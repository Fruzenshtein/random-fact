(function () {
  const plan = window.PLAN || { days: [], ongoing: [] };
  const days = plan.days || [];
  const ongoing = plan.ongoing || [];
  const MONTHS = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
  const SHORT_WEEKDAYS = { "Понеділок": "Пн", "Вівторок": "Вт", "Середа": "Ср", "Четвер": "Чт", "Пʼятниця": "Пт", "Субота": "Сб", "Неділя": "Нд" };

  const titleEl = document.getElementById("plan-title");
  const subtitleEl = document.getElementById("plan-subtitle");
  const navEl = document.getElementById("day-nav");
  const daysEl = document.getElementById("plan-days");

  if (plan.title) {
    titleEl.textContent = plan.title;
    document.title = plan.title;
  }
  subtitleEl.textContent = plan.subtitle || "";

  const todayKey = (() => {
    const override = new URLSearchParams(location.search).get("today");
    if (/^\d{4}-\d{2}-\d{2}$/.test(override || "")) return override;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  })();

  const parts = (iso) => iso.split("-").map(Number);
  const longDate = (iso) => {
    const [, month, day] = parts(iso);
    return `${day} ${MONTHS[month - 1]}`;
  };
  const dayNumber = (iso) => String(parts(iso)[2]);

  const el = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content) node.textContent = content;
    return node;
  };

  const renderEvent = (event) => {
    const row = el("li", "event");
    row.appendChild(el("p", "event-title", event.title));
    if (event.note) row.appendChild(el("p", "event-note", event.note));
    const meta = el("div", "event-meta");
    if (event.classes) meta.appendChild(el("span", "event-classes", event.classes));
    if (event.owner) meta.appendChild(el("span", "event-owner", event.owner));
    if (meta.childNodes.length) row.appendChild(meta);
    return row;
  };

  const renderEvents = (events) => {
    const list = el("ul", "events");
    events.forEach((event) => list.appendChild(renderEvent(event)));
    return list;
  };

  const renderDay = (day, index) => {
    const card = el("article", "day-card");
    card.id = `day-${index}`;
    const isToday = day.date === todayKey;
    if (isToday) card.classList.add("is-today");
    const head = el("header", "day-head");
    const heading = el("div", "day-heading");
    heading.appendChild(el("h2", "day-name", day.weekday));
    heading.appendChild(el("span", "day-date", longDate(day.date)));
    head.appendChild(heading);
    if (isToday) head.appendChild(el("span", "today-badge", "Сьогодні"));
    card.appendChild(head);
    card.appendChild(renderEvents(day.events || []));
    return card;
  };

  const renderOngoing = () => {
    const card = el("article", "day-card day-card-ongoing");
    card.id = "day-ongoing";
    const head = el("header", "day-head");
    const heading = el("div", "day-heading");
    heading.appendChild(el("h2", "day-name", "Протягом усієї декади"));
    heading.appendChild(el("span", "day-date", "16–27 листопада"));
    head.appendChild(heading);
    card.appendChild(head);
    card.appendChild(renderEvents(ongoing));
    return card;
  };

  const scrollToCard = (id, behavior) => {
    const target = document.getElementById(id);
    if (!target) return;
    const offset = navEl.getBoundingClientRect().height + 12;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: behavior || "smooth" });
  };

  const renderNav = () => {
    const fragment = document.createDocumentFragment();
    days.forEach((day, index) => {
      const chip = el("button", "day-chip");
      chip.type = "button";
      chip.setAttribute("aria-label", `${day.weekday}, ${longDate(day.date)}`);
      if (day.date === todayKey) chip.classList.add("is-today");
      chip.appendChild(el("span", "chip-weekday", SHORT_WEEKDAYS[day.weekday] || day.weekday.slice(0, 2)));
      chip.appendChild(el("span", "chip-day", dayNumber(day.date)));
      chip.addEventListener("click", () => scrollToCard(`day-${index}`));
      fragment.appendChild(chip);
    });
    if (ongoing.length) {
      const chip = el("button", "day-chip day-chip-wide");
      chip.type = "button";
      chip.appendChild(el("span", "chip-weekday", "Весь"));
      chip.appendChild(el("span", "chip-day", "період"));
      chip.addEventListener("click", () => scrollToCard("day-ongoing"));
      fragment.appendChild(chip);
    }
    navEl.appendChild(fragment);
  };

  const fragment = document.createDocumentFragment();
  if (days.length === 0 && ongoing.length === 0) {
    fragment.appendChild(el("p", "plan-empty", "Розклад декади зʼявиться тут найближчим часом."));
  } else {
    days.forEach((day, index) => fragment.appendChild(renderDay(day, index)));
    if (ongoing.length) fragment.appendChild(renderOngoing());
  }
  daysEl.appendChild(fragment);
  renderNav();

  const todayIndex = days.findIndex((day) => day.date === todayKey);
  if (todayIndex > 0) {
    scrollToCard(`day-${todayIndex}`, "auto");
    const chip = navEl.querySelector(".day-chip.is-today");
    if (chip) chip.scrollIntoView({ inline: "center", block: "nearest" });
  }
})();
