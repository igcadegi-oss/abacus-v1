import { createScreenShell, createButton, createStepIndicator } from "./helper.js";
import { setResults } from "../core/state.js";
import {
  generateTask,
  generateAnswerOptions,
  replayTask,
  taskToOperations
} from "../core/generator.js";
import { buildSteps } from "../core/steps.js";
import { AbacusView } from "./abacusView.js";

function formatMessage(template, replacements) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(replacements, key)) {
      return String(replacements[key]);
    }
    return match;
  });
}

function getTimestamp() {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

const CHOICE_SIZE = {
  choice2: 2,
  choice3: 3
};

export function renderGame(container, { t, state, navigate }) {
  const settings = state.settings;
  const totalExamples = Math.max(1, Math.floor(settings.examples || 1));
  const choiceCount = CHOICE_SIZE[settings.answerMode] || 0;

  const { section, body, heading, paragraph } = createScreenShell({
    title: t("game.title"),
    description: t("game.description"),
    className: "game-screen"
  });

  const indicator = createStepIndicator("game", t);
  section.insertBefore(indicator, section.firstChild);

  heading.textContent = t("game.title");
  paragraph.textContent = t("game.description");

  const progress = document.createElement("p");
  progress.className = "game-progress";

  const abacusControls = document.createElement("div");
  abacusControls.className = "abacus-controls";

  const speedLabel = document.createElement("label");
  speedLabel.className = "abacus-controls__speed";
  speedLabel.textContent = `${t("game.controls.speed")}:`;

  const speedInput = document.createElement("input");
  speedInput.type = "range";
  speedInput.min = "80";
  speedInput.max = "800";
  speedInput.step = "20";
  speedInput.value = "400";
  speedInput.className = "abacus-controls__range";
  speedLabel.appendChild(speedInput);

  const showLabel = document.createElement("label");
  showLabel.className = "abacus-controls__toggle";

  const showInput = document.createElement("input");
  showInput.type = "checkbox";
  showInput.className = "abacus-controls__checkbox";
  showLabel.append(showInput, document.createTextNode(` ${t("game.controls.showSolution")}`));

  abacusControls.append(speedLabel, showLabel);

  const abacusHost = document.createElement("div");
  abacusHost.className = "abacus-host";

  const exampleContainer = document.createElement("div");
  exampleContainer.className = "example-card";

  const answerContainer = document.createElement("div");
  answerContainer.className = "answer-area";

  const feedback = document.createElement("div");
  feedback.className = "answer-feedback";

  const actions = document.createElement("div");
  actions.className = "form__actions form__actions--stack";

  const actionButton = createButton({
    label: t("game.actions.check"),
    onClick: () => {}
  });

  const finishButton = createButton({
    label: t("game.actions.finish"),
    variant: "secondary"
  });

  finishButton.disabled = true;

  actions.append(actionButton, finishButton);

  body.append(progress, abacusControls, abacusHost, exampleContainer, answerContainer, feedback, actions);
  container.appendChild(section);

  let currentTask = null;
  let currentIndex = 0;
  let correctCount = 0;
  let streak = 0;
  let bestStreak = 0;
  let answered = false;
  let questionStart = getTimestamp();
  const history = [];
  const sessionStart = questionStart;

  let answerInput = null;
  let currentSteps = [];
  let animationToken = 0;
  let generationFailed = false;

  const abacusView = new AbacusView(abacusHost, 1, { speed: Number(speedInput.value) });

  function handleGenerationError(error) {
    console.error("Failed to prepare training task", error);
    generationFailed = true;
    currentTask = null;
    currentSteps = [];
    animationToken += 1;
    progress.textContent = "";
    exampleContainer.innerHTML = "";
    answerContainer.innerHTML = "";
    abacusView.model.cols[0].set(0);
    abacusView.render();
    setFeedback(t("game.feedback.error"));
    disableAnswerControls();
    actionButton.textContent = t("game.actions.check");
    actionButton.disabled = true;
    finishButton.disabled = false;
    finishButton.textContent = t("buttons.back");
  }

  function applyInstantSteps(steps) {
    steps.forEach((step) => {
      const ok = abacusView.model.applyStep(step);
      if (!ok) {
        throw new Error(`illegal step ${step.type} at column ${step.col}`);
      }
    });
    abacusView.render();
  }

  function playAbacus(steps, animate) {
    if (!currentTask) {
      return;
    }
    animationToken += 1;
    const token = animationToken;

    abacusView.model.cols[0].set(currentTask.start);
    abacusView.render();

    if (!animate) {
      try {
        applyInstantSteps(steps);
      } catch (error) {
        console.error("Failed to apply abacus state", error);
      }
      return;
    }

    (async () => {
      for (const step of steps) {
        if (token !== animationToken) {
          return;
        }
        await abacusView.playStep(step);
      }
    })().catch((error) => {
      console.error("Failed to play abacus sequence", error);
    });
  }

  function updateProgress() {
    progress.textContent = formatMessage(t("game.progress"), {
      current: Math.min(currentIndex + 1, totalExamples),
      total: totalExamples
    });
  }

  function setFeedback(message, isSuccess = false) {
    feedback.textContent = message;
    feedback.classList.toggle("answer-feedback--success", Boolean(isSuccess));
    feedback.classList.toggle("answer-feedback--error", !isSuccess && message.length > 0);
  }

  function disableAnswerControls() {
    if (answerInput) {
      answerInput.disabled = true;
    }
    answerContainer.querySelectorAll("button").forEach((btn) => {
      btn.disabled = true;
    });
  }

  function handleAnswer(value) {
    if (!currentTask || answered) {
      return;
    }

    const duration = getTimestamp() - questionStart;
    const isCorrect = Number(value) === currentTask.answer;
    answered = true;

    if (isCorrect) {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      setFeedback(t("game.feedback.correct"), true);
      correctCount += 1;
    } else {
      streak = 0;
      setFeedback(formatMessage(t("game.feedback.incorrect"), { answer: currentTask.answer }));
    }

    disableAnswerControls();

    history.push({
      task: currentTask,
      answer: Number(value),
      correct: isCorrect,
      timeMs: Math.round(duration),
      trace: replayTask(currentTask),
      operations: taskToOperations(currentTask),
      abacus: currentSteps.map((step) => ({
        col: step.col,
        type: step.type,
        after: { ...step.after }
      }))
    });

    currentIndex += 1;

    const hasMore = currentIndex < totalExamples;
    actionButton.textContent = hasMore ? t("game.actions.next") : t("game.actions.finish");
    finishButton.disabled = !answered || hasMore;
    actionButton.disabled = false;
  }

  function renderMultipleChoice(task) {
    answerContainer.innerHTML = "";
    answerInput = null;
    const options = generateAnswerOptions(task.answer, choiceCount, task.constraints.range);
    const grid = document.createElement("div");
    grid.className = "choice-grid";

    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-grid__btn";
      button.textContent = String(option);
      button.addEventListener("click", () => {
        handleAnswer(option);
      });
      grid.appendChild(button);
    });

    answerContainer.appendChild(grid);
    actionButton.textContent = t("game.actions.next");
    actionButton.disabled = true;
  }

  function renderInput(task) {
    answerContainer.innerHTML = "";

    const label = document.createElement("label");
    label.className = "answer-input";

    const span = document.createElement("span");
    span.className = "answer-input__label";
    span.textContent = t("game.answer.label");

    answerInput = document.createElement("input");
    answerInput.type = "number";
    answerInput.className = "answer-input__control";
    answerInput.placeholder = t("game.answer.placeholder");
    answerInput.value = "";

    answerInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (!answered) {
          submitAnswer();
        }
      }
    });

    label.append(span, answerInput);
    answerContainer.appendChild(label);
    actionButton.textContent = t("game.actions.check");
    actionButton.disabled = false;
    answerInput.focus();
  }

  function renderTask(task) {
    exampleContainer.innerHTML = "";
    const startLabel = document.createElement("div");
    startLabel.className = "example-card__start";
    startLabel.textContent = formatMessage(t("game.example.start"), { value: task.start });
    exampleContainer.appendChild(startLabel);

    if (task.display === "inline") {
      const inline = document.createElement("div");
      inline.className = "example-card__inline";
      const expression = [task.start, ...task.steps.map((step) => `${step.op}${step.val}`)].join(" ");
      inline.textContent = `${expression} ${t("game.example.inlineSuffix")}`;
      exampleContainer.appendChild(inline);
    } else {
      const list = document.createElement("ul");
      list.className = "example-card__list";
      task.steps.forEach((step) => {
        const item = document.createElement("li");
        item.className = "example-card__item";
        item.textContent = `${step.op}${step.val}`;
        list.appendChild(item);
      });
      exampleContainer.appendChild(list);

      const question = document.createElement("div");
      question.className = "example-card__question";
      question.textContent = t("game.example.question");
      exampleContainer.appendChild(question);
    }
  }

  function loadTask() {
    try {
      currentTask = generateTask({
        mode: settings.mode,
        chainLength: settings.chainLength,
        display: settings.display
      });
    } catch (error) {
      handleGenerationError(error);
      return;
    }

    if (!currentTask) {
      handleGenerationError(new Error("empty task"));
      return;
    }

    answered = false;
    generationFailed = false;
    finishButton.textContent = t("game.actions.finish");
    finishButton.disabled = true;
    actionButton.disabled = false;
    questionStart = getTimestamp();
    updateProgress();
    setFeedback("");
    renderTask(currentTask);

    let ops;
    try {
      ops = taskToOperations(currentTask);
      currentSteps = buildSteps(ops, 1);
    } catch (error) {
      handleGenerationError(error);
      return;
    }

    abacusView.setSpeed(Number(speedInput.value));
    abacusView.model.cols[0].set(currentTask.start);
    abacusView.render();
    playAbacus(currentSteps, showInput.checked);
    if (choiceCount > 0) {
      renderMultipleChoice(currentTask);
    } else {
      renderInput(currentTask);
    }
  }

  function submitAnswer() {
    if (choiceCount > 0 || !answerInput) {
      return;
    }
    const value = parseInt(answerInput.value, 10);
    if (Number.isNaN(value)) {
      setFeedback(t("game.feedback.invalid"));
      return;
    }
    handleAnswer(value);
  }

  function goNext() {
    if (currentIndex >= totalExamples) {
      completeSession();
      return;
    }
    loadTask();
  }

  function completeSession() {
    const duration = Math.max(0, Math.round(getTimestamp() - sessionStart));
    setResults({
      success: correctCount,
      total: totalExamples,
      durationMs: duration,
      bestStreak,
      history
    });
    navigate("results");
  }

  actionButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (generationFailed) {
      navigate("settings");
      return;
    }
    if (!answered) {
      if (choiceCount === 0) {
        submitAnswer();
      }
    } else if (currentIndex >= totalExamples) {
      completeSession();
    } else {
      goNext();
    }
  });

  speedInput.addEventListener("input", () => {
    abacusView.setSpeed(Number(speedInput.value));
    if (currentTask) {
      playAbacus(currentSteps, showInput.checked);
    }
  });

  showInput.addEventListener("change", () => {
    if (currentTask) {
      playAbacus(currentSteps, showInput.checked);
    }
  });

  finishButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (generationFailed) {
      navigate("settings");
      return;
    }
    if (currentIndex >= totalExamples) {
      completeSession();
    }
  });

  loadTask();
}
