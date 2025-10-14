import { createScreenShell, createButton, createStepIndicator } from "./helper.js";
import { state } from "../core/state.js";

function clamp(value, min, max) {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function createRadioGroup({ name, options, value, onChange }) {
  const group = document.createElement("div");
  group.className = "radio-group";

  const updateActive = () => {
    group.querySelectorAll(".radio-chip").forEach((chip) => {
      const input = chip.querySelector("input[type='radio']");
      chip.classList.toggle("radio-chip--active", Boolean(input?.checked));
    });
  };

  options.forEach((option) => {
    const id = `${name}-${option.value}`;
    const chip = document.createElement("label");
    chip.className = "radio-chip";
    chip.setAttribute("for", id);

    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.id = id;
    input.value = option.value;
    input.checked = option.value === value;

    input.addEventListener("change", () => {
      if (!input.checked) {
        return;
      }
      onChange(option.value);
      updateActive();
    });

    const text = document.createElement("span");
    text.textContent = option.label;

    chip.append(input, text);
    group.appendChild(chip);
  });

  updateActive();
  return group;
}

export function renderSettings(container, { t, updateSettings, navigate }) {
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
  form.className = "settings-form";

  const modeField = document.createElement("label");
  modeField.className = "form__field";
  modeField.textContent = t("settings.mode.label");

  const modeSelect = document.createElement("select");
  t("settings.mode.options").forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    if (option.value === state.settings.mode) {
      opt.selected = true;
    }
    modeSelect.appendChild(opt);
  });
  modeSelect.value = state.settings.mode;
  modeSelect.addEventListener("change", () => {
    updateSettings({ mode: modeSelect.value });
  });
  modeField.appendChild(modeSelect);

  const chainField = document.createElement("label");
  chainField.className = "form__field";
  chainField.textContent = t("settings.chain.label");

  const chainInput = document.createElement("input");
  chainInput.type = "number";
  const chainMin = Number(t("settings.chain.min"));
  const chainMax = Number(t("settings.chain.max"));
  chainInput.min = String(chainMin);
  chainInput.max = String(chainMax);
  chainInput.value = String(state.settings.chainLength);
  chainInput.addEventListener("change", () => {
    const next = clamp(Number(chainInput.value), chainMin, chainMax);
    chainInput.value = String(next);
    updateSettings({ chainLength: next });
  });

  chainField.appendChild(chainInput);

  const examplesField = document.createElement("label");
  examplesField.className = "form__field";
  examplesField.textContent = t("settings.examples.label");

  const examplesInput = document.createElement("input");
  examplesInput.type = "number";
  const examplesMin = Number(t("settings.examples.min"));
  const examplesMax = Number(t("settings.examples.max"));
  examplesInput.min = String(examplesMin);
  examplesInput.max = String(examplesMax);
  examplesInput.value = String(state.settings.examples);
  examplesInput.addEventListener("change", () => {
    const next = clamp(Number(examplesInput.value), examplesMin, examplesMax);
    examplesInput.value = String(next);
    updateSettings({ examples: next });
  });

  examplesField.appendChild(examplesInput);

  const displayField = document.createElement("div");
  displayField.className = "form__field";
  const displayLabel = document.createElement("span");
  displayLabel.textContent = t("settings.display.label");
  displayField.appendChild(displayLabel);

  const displayGroup = createRadioGroup({
    name: "display",
    options: t("settings.display.options"),
    value: state.settings.display,
    onChange: (value) => updateSettings({ display: value })
  });
  displayField.appendChild(displayGroup);

  const answerField = document.createElement("div");
  answerField.className = "form__field";
  const answerLabel = document.createElement("span");
  answerLabel.textContent = t("settings.answerMode.label");
  answerField.appendChild(answerLabel);

  const answerGroup = createRadioGroup({
    name: "answerMode",
    options: t("settings.answerMode.options"),
    value: state.settings.answerMode,
    onChange: (value) => updateSettings({ answerMode: value })
  });
  answerField.appendChild(answerGroup);

  const actions = document.createElement("div");
  actions.className = "form__actions";

  const continueButton = createButton({
    label: t("buttons.continue"),
    onClick: () => {
      form.requestSubmit();
    }
  });

  actions.appendChild(continueButton);

  form.append(modeField, chainField, examplesField, displayField, answerField, actions);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateSettings({
      mode: modeSelect.value,
      chainLength: clamp(Number(chainInput.value), chainMin, chainMax),
      examples: clamp(Number(examplesInput.value), examplesMin, examplesMax),
      display: state.settings.display,
      answerMode: state.settings.answerMode
    });
    navigate("confirmation");
  });

  body.appendChild(form);
  container.appendChild(section);
}
