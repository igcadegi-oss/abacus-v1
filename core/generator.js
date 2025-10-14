const LOWER_STEPS = [1, 2, 3, 4];
const MAX_ATTEMPTS = 5000;
const DEFAULT_TOGGLE_LIMIT = 2;
const PRIMARY_COLUMN = 0;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(list) {
  return list[randomInt(0, list.length - 1)];
}

function createStep(delta, source) {
  return {
    op: delta >= 0 ? "+" : "-",
    val: Math.abs(delta),
    source
  };
}

function stepsToOperations(steps, column = PRIMARY_COLUMN) {
  return steps.map((step) => ({
    col: column,
    delta: step.op === "+" ? step.val : -step.val
  }));
}

function attachOperations(task, column = PRIMARY_COLUMN) {
  task.operations = stepsToOperations(task.steps, column);
  return task;
}

function enumerateLowerSteps(state, hasUpper) {
  const deltas = [];
  LOWER_STEPS.forEach((step) => {
    const positiveTarget = state + step;
    const negativeTarget = state - step;

    if (!hasUpper) {
      if (positiveTarget <= 4) {
        deltas.push(step);
      }
    } else if (positiveTarget <= 9 && positiveTarget - 5 <= 4) {
      deltas.push(step);
    }

    if (!hasUpper) {
      if (negativeTarget >= 0) {
        deltas.push(-step);
      }
    } else {
      const lowerValue = state - 5;
      if (lowerValue >= step) {
        deltas.push(-step);
      }
    }
  });

  return deltas;
}

function buildTrace(start, steps) {
  const trace = [start];
  let current = start;
  steps.forEach((step) => {
    const delta = step.op === "+" ? step.val : -step.val;
    current += delta;
    trace.push(current);
  });
  return trace;
}

function generateProsto({ chainLength = 1, display = "column" }) {
  const length = Math.max(1, Number.isFinite(chainLength) ? Math.floor(chainLength) : 1);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const start = randomInt(0, 4);
    const steps = [];
    let state = start;

    for (let index = 0; index < length; index += 1) {
      const candidates = [];
      LOWER_STEPS.forEach((step) => {
        if (state + step <= 4) {
          candidates.push(step);
        }
        if (state - step >= 0) {
          candidates.push(-step);
        }
      });

      if (candidates.length === 0) {
        break;
      }

      const delta = randomItem(candidates);
      steps.push(createStep(delta, "lower"));
      state += delta;
    }

    if (steps.length !== length) {
      continue;
    }

    return attachOperations({
      mode: "prosto",
      start,
      steps,
      answer: state,
      constraints: {
        range: [0, 4],
        allowUpper: false,
        requireUpperUse: false
      },
      display
    });
  }

  // deterministic fallback (0 +1 -1 ...)
  const fallbackSteps = Array.from({ length: Math.max(1, chainLength) }, (_, idx) =>
    createStep(idx % 2 === 0 ? 1 : -1, "lower")
  );
  const fallbackTrace = buildTrace(0, fallbackSteps);
  return attachOperations({
    mode: "prosto",
    start: 0,
    steps: fallbackSteps,
    answer: fallbackTrace[fallbackTrace.length - 1],
    constraints: {
      range: [0, 4],
      allowUpper: false,
      requireUpperUse: false
    },
    display
  });
}

function generateProsto5({
  chainLength = 1,
  display = "column",
  toggleLimit = DEFAULT_TOGGLE_LIMIT
}) {
  const length = Math.max(1, Number.isFinite(chainLength) ? Math.floor(chainLength) : 1);
  const toggleCap = Math.max(1, toggleLimit);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const start = randomInt(0, 5);
    let state = start;
    const steps = [];
    let toggles = 0;
    let usedUpper = false;

    for (let index = 0; index < length; index += 1) {
      const isLast = index === length - 1;
      const hasUpper = state >= 5;
      const lowerDeltas = enumerateLowerSteps(state, hasUpper);
      const candidates = lowerDeltas.map((delta) => ({ delta, source: "lower" }));

      if (state <= 4 && toggles < toggleCap) {
        candidates.push({ delta: 5, source: "upper" });
      }
      if (state >= 5 && toggles < toggleCap) {
        candidates.push({ delta: -5, source: "upper" });
      }

      const filtered = candidates.filter(({ delta, source }) => {
        const target = state + delta;
        if (source === "upper") {
          if (delta === 5 && state > 4) {
            return false;
          }
          if (delta === -5 && state < 5) {
            return false;
          }
          if (isLast && target > 5) {
            return false;
          }
          return true;
        }

        if (!hasUpper) {
          if (target < 0 || target > 4) {
            return false;
          }
        } else {
          if (target < 5 || target > 9) {
            return false;
          }
        }

        if (isLast && target > 5) {
          return false;
        }

        return true;
      });

      let pool = filtered;
      if (!usedUpper && index === length - 1) {
        pool = filtered.filter(({ source }) => source === "upper");
        if (pool.length === 0) {
          break;
        }
      }

      if (pool.length === 0) {
        break;
      }

      const choice = randomItem(pool);
      const step = createStep(choice.delta, choice.source);
      steps.push(step);
      state += choice.delta;
      if (choice.source === "upper") {
        toggles += 1;
        usedUpper = true;
      }

      if (state < 0 || state > 9) {
        break;
      }
    }

    if (steps.length !== length) {
      continue;
    }

    if (state < 0 || state > 5) {
      continue;
    }

    if (!usedUpper) {
      continue;
    }

    return attachOperations({
      mode: "prosto5",
      start,
      steps,
      answer: state,
      constraints: {
        range: [0, 5],
        allowUpper: true,
        requireUpperUse: true,
        toggleLimit: toggleCap
      },
      display
    });
  }

  // fallback sequence toggling upper bead at least once
  const fallbackSteps = [];
  let current = 0;
  for (let index = 0; index < Math.max(1, chainLength); index += 1) {
    if (index === 0) {
      fallbackSteps.push(createStep(5, "upper"));
      current = 5;
    } else if (index === 1) {
      fallbackSteps.push(createStep(-5, "upper"));
      current = 0;
    } else if (current === 0) {
      fallbackSteps.push(createStep(1, "lower"));
      current = 1;
    } else {
      fallbackSteps.push(createStep(-1, "lower"));
      current = Math.max(0, current - 1);
    }
  }
  const finalAnswer = Math.min(Math.max(current, 0), 5);

  return attachOperations({
    mode: "prosto5",
    start: 0,
    steps: fallbackSteps,
    answer: finalAnswer,
    constraints: {
      range: [0, 5],
      allowUpper: true,
      requireUpperUse: true,
      toggleLimit: toggleCap
    },
    display
  });
}

export function generateTask({ mode = "prosto", chainLength = 1, display = "column" } = {}) {
  if (mode === "prosto5") {
    return generateProsto5({ chainLength, display });
  }
  return generateProsto({ chainLength, display });
}

export function replayTask(task) {
  return buildTrace(task.start, task.steps);
}

export function usesUpperBead(step) {
  return step.source === "upper" || step.val === 5;
}

export function taskToOperations(task, column = PRIMARY_COLUMN) {
  if (Array.isArray(task?.operations) && task.operations.every((item) => typeof item === "object")) {
    return task.operations;
  }
  return stepsToOperations(task.steps || [], column);
}

export function generateAnswerOptions(answer, totalOptions, range = [0, 9]) {
  const size = Math.max(2, totalOptions);
  const [min, max] = range;
  const pool = new Set([answer]);
  const offsets = [
    1,
    -1,
    2,
    -2,
    3,
    -3,
    4,
    -4,
    5,
    -5,
    6,
    -6,
    7,
    -7,
    8,
    -8,
    9,
    -9
  ];

  for (const offset of offsets) {
    if (pool.size >= size) {
      break;
    }
    const candidate = answer + offset;
    if (candidate < min || candidate > max) {
      continue;
    }
    pool.add(candidate);
  }

  while (pool.size < size) {
    const candidate = randomInt(min, max);
    if (candidate === answer) {
      continue;
    }
    pool.add(candidate);
  }

  const options = Array.from(pool);
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options.slice(0, size);
}

export { generateProsto, generateProsto5 };
