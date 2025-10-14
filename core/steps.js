// core/steps.js
// Преобразуем арифметический пример в последовательность атомарных шагов соробана.
// На вход: массив операций по разрядам, например: [{col:0, delta:+1}, {col:0, delta:+4}, {col:0, delta:-3}]

import { Abacus } from './abacus.js';

export function buildSteps(ops, columns = 1) {
  const model = new Abacus(columns);
  const steps = [];

  function pushStep(col, type) {
    const ok = model.applyStep({ col, type });
    if (!ok) throw new Error(`illegal move ${type} at col ${col}`);
    const digit = model.cols[col];
    steps.push({ col, type, after: { U: digit.U, L: digit.L } });
  }

  for (const { col, delta } of ops) {
    let rest = Math.abs(delta);
    const sign = Math.sign(delta);

    while (rest >= 5) {
      pushStep(col, sign > 0 ? 'U+' : 'U-');
      rest -= 5;
    }
    while (rest > 0) {
      pushStep(col, sign > 0 ? 'L+' : 'L-');
      rest -= 1;
    }
  }

  return steps;
}
