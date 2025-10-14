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

  const settings = state.settings;
  const modeOptions = t("settings.mode.options");
  const displayOptions = t("settings.display.options");
  const answerOptions = t("settings.answerMode.options");

  const entries = [
    {
      label: t("confirmation.items.mode"),
      value: formatOptionLabel(modeOptions, settings.mode)
    },
    {
      label: t("confirmation.items.chain"),
      value: String(settings.chainLength)
    },
    {
      label: t("confirmation.items.examples"),
      value: String(settings.examples)
    },
    {
      label: t("confirmation.items.display"),
      value: formatOptionLabel(displayOptions, settings.display)
    },
    {
      label: t("confirmation.items.answerMode"),
      value: formatOptionLabel(answerOptions, settings.answerMode)
    }
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
    label: t("buttons.start"),
    onClick: () => navigate("game")
  });

  actions.append(backButton, continueButton);

  body.append(summaryCard, actions);
  container.appendChild(section);
}
