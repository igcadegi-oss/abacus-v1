import assert from 'node:assert/strict';
import {
  generateProsto,
  generateProsto5,
  generateTask,
  replayTask,
  generateAnswerOptions
} from '../core/generator.js';

function withinRange(value, [min, max]) {
  return value >= min && value <= max;
}

function testProsto() {
  for (let i = 0; i < 1000; i += 1) {
    const task = generateProsto({ chainLength: 3, display: 'column' });
    assert.equal(task.mode, 'prosto');
    assert.equal(task.steps.length, 3);
    assert.equal(task.operations.length, task.steps.length);
    assert.ok(withinRange(task.start, [0, 4]));
    assert.ok(withinRange(task.answer, [0, 4]));
    assert.equal(task.display, 'column');
    const trace = replayTask(task);
    trace.forEach((value) => {
      assert.ok(withinRange(value, [0, 4]), `trace out of range: ${trace.join(',')}`);
    });
    task.steps.forEach((step, index) => {
      assert.equal(step.source, 'lower');
      assert.notEqual(step.val, 5);
      const op = task.operations[index];
      assert.equal(op.col, 0);
      const expectedDelta = step.op === '+' ? step.val : -step.val;
      assert.equal(op.delta, expectedDelta);
    });
  }
}

function testProsto5() {
  for (let i = 0; i < 1000; i += 1) {
    const task = generateProsto5({ chainLength: 4, display: 'inline' });
    assert.equal(task.mode, 'prosto5');
    assert.equal(task.steps.length, 4);
    assert.equal(task.operations.length, task.steps.length);
    assert.equal(task.display, 'inline');
    assert.ok(withinRange(task.start, [0, 5]));
    assert.ok(withinRange(task.answer, [0, 5]));

    const trace = replayTask(task);
    let usedUpper = false;
    for (let index = 0; index < task.steps.length; index += 1) {
      const prev = trace[index];
      const current = trace[index + 1];
      const step = task.steps[index];
      const op = task.operations[index];
      const expectedDelta = step.op === '+' ? step.val : -step.val;
      assert.equal(op.col, 0);
      assert.equal(op.delta, expectedDelta);
      if (step.source === 'upper') {
        usedUpper = true;
        if (step.op === '+') {
          assert.ok(prev <= 4, 'upper +5 from invalid state');
        } else {
          assert.ok(prev >= 5, 'upper -5 from invalid state');
        }
      } else {
        if (prev <= 4) {
          assert.ok(current <= 4, 'lower step moved above 4 without +5');
          assert.ok(current >= 0, 'lower step dropped below 0');
        } else {
          assert.ok(current >= 5, 'lower step dropped below 5 with upper active');
          assert.ok(current <= 9, 'lower step exceeded 9 with upper active');
        }
      }
    }
    assert.ok(usedUpper, 'prosto5 sequence must toggle upper bead');
  }
}

function testTaskDisplay() {
  const inlineTask = generateTask({ mode: 'prosto', chainLength: 2, display: 'inline' });
  assert.equal(inlineTask.display, 'inline');
}

function testAnswerOptions() {
  const answer = 3;
  const range = [0, 5];
  const options = generateAnswerOptions(answer, 3, range);
  assert.equal(options.length, 3);
  const unique = new Set(options);
  assert.equal(unique.size, 3);
  assert.ok(options.includes(answer));
  options.forEach((value) => {
    assert.ok(withinRange(value, range));
  });
}

function run() {
  testProsto();
  testProsto5();
  testTaskDisplay();
  testAnswerOptions();
  console.log('Generator tests passed');
}

run();
