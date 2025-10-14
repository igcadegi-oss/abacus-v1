import { createScreenShell, createButton, createStepIndicator } from "./helper.js";
import { resetResults, state } from "../core/state.js";

function formatDuration(ms, t) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return formatTemplate(t("results.stats.timeValue"), {
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0")
  });
}

function formatTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return String(values[key]);
    }
    return match;
  });
}

function selectLeoPhrase(percent, t) {
  if (percent >= 90) {
    return t("results.leo.excellent");
  }
  if (percent >= 70) {
    return t("results.leo.good");
  }
  if (percent >= 50) {
    return t("results.leo.keepGoing");
  }
  return t("results.leo.tryAgain");
}

export function renderResults(container, { t, navigate }) {
  const { section, body, heading, paragraph } = createScreenShell({
    title: t("results.title"),
    description: t("results.description"),
    className: "results-screen"
  });

  const indicator = createStepIndicator("results", t);
  section.insertBefore(indicator, section.firstChild);

  heading.textContent = t("results.title");
  paragraph.textContent = t("results.description");

  const total = Math.max(state.results.total || 0, 0);
  const success = Math.min(state.results.success || 0, total);
  const mistakes = Math.max(total - success, 0);
  const percent = total ? Math.round((success / total) * 100) : 0;
  const duration = formatDuration(state.results.durationMs || 0, t);
  const bestStreak = state.results.bestStreak || 0;

  const summaryCard = document.createElement("div");
  summaryCard.className = "results-card";

  const statsList = document.createElement("dl");
  statsList.className = "results-card__stats";

  const stats = [
    { label: t("results.stats.correct"), value: `${success} / ${total}` },
    { label: t("results.stats.accuracy"), value: `${percent}%` },
    { label: t("results.stats.time"), value: duration },
    { label: t("results.stats.streak"), value: String(bestStreak) }
  ];

  stats.forEach(({ label, value }) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    statsList.append(term, description);
  });

  summaryCard.appendChild(statsList);

  const leoCard = document.createElement("div");
  leoCard.className = "results-card results-card--leo";

  const leoHeading = document.createElement("h3");
  leoHeading.className = "results-card__title";
  leoHeading.textContent = t("results.leo.title");

  const leoMessage = document.createElement("p");
  leoMessage.className = "results-card__message";
  leoMessage.textContent = selectLeoPhrase(percent, t);

  const mistakesNote = document.createElement("p");
  mistakesNote.className = "results-card__note";
  mistakesNote.textContent = formatTemplate(t("results.leo.summary"), {
    success,
    total,
    mistakes
  });

  leoCard.append(leoHeading, leoMessage, mistakesNote);

  const actions = document.createElement("div");
  actions.className = "form__actions";

  const repeatButton = createButton({
    label: t("results.cta"),
    onClick: () => {
      resetResults();
      navigate("settings");
    }
  });

  actions.appendChild(repeatButton);

  body.append(summaryCard, leoCard, actions);
  container.appendChild(section);
}
