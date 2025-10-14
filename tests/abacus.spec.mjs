import assert from 'node:assert/strict';
import { Digit, Abacus } from '../core/abacus.js';
import { buildSteps } from '../core/steps.js';

function testDigitTransitions() {
  const digit = new Digit(4);
  assert.equal(digit.value, 4);
  assert.ok(digit.plus1(), '4 + 1 should engage the upper bead');
  assert.equal(digit.value, 5);
  assert.ok(digit.minus1(), '5 - 1 should release the upper bead');
  assert.equal(digit.value, 4);

  digit.set(0);
  assert.equal(digit.value, 0);
  assert.equal(digit.minus1(), false, 'cannot go below zero');

  digit.set(9);
  assert.equal(digit.value, 9);
  assert.equal(digit.plus1(), false, 'cannot exceed nine');
}

function testBuildSteps() {
  const ops = [
    { col: 0, delta: 1 },
    { col: 0, delta: 4 },
    { col: 0, delta: -3 }
  ];
  const steps = buildSteps(ops, 1);
  assert.equal(steps.length, 8);

  const playback = new Abacus(1);
  steps.forEach((step) => {
    assert.ok(playback.applyStep(step));
  });
  assert.equal(playback.cols[0].value, 2);
}

function run() {
  testDigitTransitions();
  testBuildSteps();
  console.log('Abacus model tests passed');
}

run();
