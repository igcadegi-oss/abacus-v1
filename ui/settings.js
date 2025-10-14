import { createScreenShell, createButton, createStepIndicator } from "./helper.js";

export function renderSettings(container, { t, state, updateSettings, navigate }) {
  const { section, body, heading, paragraph } = createScreenShell({
    title: t("settings.title"),
    description: t("settings.description"),
    className: "settings-screen"
  });

  const indicator = createStepIndicator("settings", t);
  section.insertBefore(indicator, section.firstChild);

  heading.textContent = t("settings.title");
  paragraph.textContent = t("settings.description");

  const form = document.createElement("form");
  form.className = "form";

  // Mode select
  const modeField = document.createElement("label");
  modeField.className = "form__field";
  modeField.textContent = t("settings.modeLabel");
  const modeSelect = document.createElement("select");
  t("settings.modeOptions").forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    modeSelect.appendChild(opt);
  });
  modeSelect.value = state.settings.mode;
  modeSelect.addEventListener("change", () => {
    updateSettings({ mode: modeSelect.value });
  });
  modeField.appendChild(modeSelect);

  // Digits select
  const digitsField = document.createElement("label");
  digitsField.className = "form__field";
  digitsField.textContent = t("settings.digitsLabel");
  const digitsSelect = document.createElement("select");
  t("settings.digitsOptions").forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    digitsSelect.appendChild(opt);
  });
  digitsSelect.value = state.settings.digits;
  digitsSelect.addEventListener("change", () => {
    updateSettings({ digits: digitsSelect.value });
  });
  digitsField.appendChild(digitsSelect);

  // Speed select
  const speedField = document.createElement("label");
  speedField.className = "form__field";
  speedField.textContent = t("settings.speedLabel");
  const speedSelect = document.createElement("select");
  t("settings.speedOptions").forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    speedSelect.appendChild(opt);
  });
  speedSelect.value = state.settings.speed;
  speedSelect.addEventListener("change", () => {
    updateSettings({ speed: speedSelect.value });
  });
  speedField.appendChild(speedSelect);

  // Rounds input
  const roundsField = document.createElement("label");
  roundsField.className = "form__field";
  roundsField.textContent = t("settings.roundsLabel");
  const roundsInput = document.createElement("input");
  roundsInput.type = "number";
  roundsInput.min = "5";
  roundsInput.max = "50";
  roundsInput.step = "5";
  roundsInput.value = state.settings.rounds;
  roundsInput.addEventListener("change", () => {
    const value = Math.max(5, Math.min(50, Number(roundsInput.value) || 10));
    roundsInput.value = value;
    updateSettings({ rounds: value });
  });
  const roundsHint = document.createElement("span");
  roundsHint.className = "form__hint";
  roundsHint.textContent = t("settings.roundsHint");
  roundsField.append(roundsInput, roundsHint);

  // Dictation toggle
  const dictationField = document.createElement("label");
  dictationField.className = "form__switch";
  const dictationCheckbox = document.createElement("input");
  dictationCheckbox.type = "checkbox";
  dictationCheckbox.checked = Boolean(state.settings.dictation);
  dictationCheckbox.addEventListener("change", () => {
    updateSettings({ dictation: dictationCheckbox.checked });
  });
  const dictationTextWrap = document.createElement("span");
  dictationTextWrap.className = "form__switch-text";
  const dictationLabel = document.createElement("span");
  dictationLabel.className = "form__switch-title";
  dictationLabel.textContent = t("settings.dictationLabel");
  const dictationHint = document.createElement("span");
  dictationHint.className = "form__hint";
  dictationHint.textContent = t("settings.dictationHint");
  dictationTextWrap.append(dictationLabel, dictationHint);
  dictationField.append(dictationCheckbox, dictationTextWrap);

  const actions = document.createElement("div");
  actions.className = "form__actions";
  const submitButton = createButton({
    label: t("settings.submit"),
    onClick: () => {
      form.requestSubmit();
    }
  });
  actions.appendChild(submitButton);

  form.append(modeField, digitsField, speedField, roundsField, dictationField, actions);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateSettings({
      mode: modeSelect.value,
      digits: digitsSelect.value,
      speed: speedSelect.value,
      rounds: Number(roundsInput.value),
      dictation: dictationCheckbox.checked
    });
    navigate("confirmation");
  });

  body.appendChild(form);
  container.appendChild(section);
}