import { createScreenShell, createButton, createStepIndicator } from "./helper.js";
import { setResults } from "../core/state.js";
import {
  generateTask,
  generateAnswerOptions,
  replayTask
} from "../core/generator.js";

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
    variant: "secondary",
    onClick: () => {
      completeSession();
    }
  });

  finishButton.disabled = true;

  actions.append(actionButton, finishButton);

  body.append(progress, exampleContainer, answerContainer, feedback, actions);
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
      trace: replayTask(currentTask)
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
    currentTask = generateTask({
      mode: settings.mode,
      chainLength: settings.chainLength,
      display: settings.display
    });
    answered = false;
    questionStart = getTimestamp();
    updateProgress();
    setFeedback("");
    renderTask(currentTask);
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

  finishButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (currentIndex >= totalExamples) {
      completeSession();
    }
  });

  loadTask();
}
