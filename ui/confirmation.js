import { createScreenShell, createButton, createStepIndicator, formatOptionLabel } from "./helper.js";

export function renderConfirmation(container, { t, state, navigate }) {
  const { section, body, heading, paragraph } = createScreenShell({
    title: t("confirmation.title"),
    description: t("confirmation.description"),
    className: "confirmation-screen"
  });

  const indicator = createStepIndicator("confirmation", t);
  section.insertBefore(indicator, section.firstChild);

  heading.textContent = t("confirmation.title");
  paragraph.textContent = t("confirmation.description");

  const summaryCard = document.createElement("div");
  summaryCard.className = "summary-card";

  const list = document.createElement("dl");
  list.className = "summary-card__list";

  const labels = t("confirmation.list");
  const settings = state.settings;

  const mode = formatOptionLabel(t("settings.modeOptions"), settings.mode);
  const digits = formatOptionLabel(t("settings.digitsOptions"), settings.digits);
  const speed = formatOptionLabel(t("settings.speedOptions"), settings.speed);
  const dictation = settings.dictation ? t("confirmation.dictation.on") : t("confirmation.dictation.off");

  const entries = [
    { label: labels.mode, value: mode },
    { label: labels.digits, value: digits },
    { label: labels.speed, value: speed },
    { label: labels.rounds, value: settings.rounds.toString() },
    { label: labels.dictation, value: dictation }
  ];

  entries.forEach(({ label, value }) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    list.append(term, description);
  });

  summaryCard.appendChild(list);

  const actions = document.createElement("div");
  actions.className = "form__actions";

  const backButton = createButton({
    label: t("buttons.back"),
    variant: "secondary",
    onClick: () => navigate("settings")
  });

  const continueButton = createButton({
    label: t("buttons.continue"),
    onClick: () => navigate("game")
  });

  actions.append(backButton, continueButton);

  body.append(summaryCard, actions);
  container.appendChild(section);
}