import { createScreenShell, createButton, createStepIndicator } from "./helper.js";
import { state } from "../core/state.js";

function createField(labelText) {
  const wrapper = document.createElement("div");
  wrapper.className = "settings-field";

  const label = document.createElement("span");
  label.className = "settings-field__label";
  label.textContent = labelText;

  const control = document.createElement("div");
  control.className = "settings-field__control";

  wrapper.append(label, control);
  return { wrapper, control };
}

function createNumberInput({ value, min, max, step = 1, onChange }) {
  const input = document.createElement("input");
  input.type = "number";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener("change", () => {
    const parsed = parseInt(input.value, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    input.value = String(clamped);
    onChange(clamped);
  });
  return input;
}

function clampInputValue(input) {
  const min = Number(input.min ?? 1);
  const max = Number(input.max ?? min);
  const parsed = parseInt(input.value, 10);
  if (Number.isNaN(parsed)) {
    return min;
  }
  return Math.min(max, Math.max(min, parsed));
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
    const label = document.createElement("label");
    label.className = "radio-chip";
    label.setAttribute("for", id);

    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.id = id;
    input.value = option.value;
    input.checked = option.value === value;

    input.addEventListener("change", () => {
      if (input.checked) {
        onChange(option.value);
        updateActive();
      }
    });

    const text = document.createElement("span");
    text.textContent = option.label;

    label.append(input, text);
    group.appendChild(label);
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

  // Mode selector
  const modeField = createField(t("settings.mode.label"));
  const modeSelect = document.createElement("select");
  const modeOptions = t("settings.mode.options");
  modeOptions.forEach((option) => {
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
  modeField.control.appendChild(modeSelect);
  form.appendChild(modeField.wrapper);

  // Chain length input
  const chainField = createField(t("settings.chain.label"));
  const chainInput = createNumberInput({
    value: state.settings.chainLength,
    min: t("settings.chain.min"),
    max: t("settings.chain.max"),
    onChange: (value) => updateSettings({ chainLength: value })
  });
  chainField.control.appendChild(chainInput);
  form.appendChild(chainField.wrapper);

  // Examples input
  const examplesField = createField(t("settings.examples.label"));
  const examplesInput = createNumberInput({
    value: state.settings.examples,
    min: t("settings.examples.min"),
    max: t("settings.examples.max"),
    onChange: (value) => updateSettings({ examples: value })
  });
  examplesField.control.appendChild(examplesInput);
  form.appendChild(examplesField.wrapper);

  // Display mode radios
  const displayField = createField(t("settings.display.label"));
  const displayOptions = t("settings.display.options");
  const displayGroup = createRadioGroup({
    name: "display",
    options: displayOptions,
    value: state.settings.display,
    onChange: (value) => updateSettings({ display: value })
  });
  displayField.control.appendChild(displayGroup);
  form.appendChild(displayField.wrapper);

  // Answer mode radios
  const answerField = createField(t("settings.answerMode.label"));
  const answerOptions = t("settings.answerMode.options");
  const answerGroup = createRadioGroup({
    name: "answerMode",
    options: answerOptions,
    value: state.settings.answerMode,
    onChange: (value) => updateSettings({ answerMode: value })
  });
  answerField.control.appendChild(answerGroup);
  form.appendChild(answerField.wrapper);

  const actions = document.createElement("div");
  actions.className = "form__actions";

  const continueButton = createButton({
    label: t("buttons.continue"),
    onClick: (event) => {
      event.preventDefault();
      updateSettings({
        mode: modeSelect.value,
        chainLength: clampInputValue(chainInput),
        examples: clampInputValue(examplesInput),
        display: state.settings.display,
        answerMode: state.settings.answerMode
      });
      navigate("confirmation");
    }
  });

  actions.appendChild(continueButton);
  form.appendChild(actions);

  body.appendChild(form);
  container.appendChild(section);
}
