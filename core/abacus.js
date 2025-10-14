// core/abacus.js
// Модель одного разряда соробана и всей рамки.
// S = 5*U + L, где U ∈ {0,1}, L ∈ [0..4]

export class Digit {
  constructor(value = 0) {
    this.U = 0; // верхняя кость прислонена (1) / отведена (0)
    this.L = 0; // число нижних косточек у перекладины [0..4]
    this.set(value);
  }

  get value() {
    return 5 * this.U + this.L;
  }

  set(v) {
    if (v < 0 || v > 9) throw new Error('digit out of range');
    this.U = v >= 5 ? 1 : 0;
    this.L = v % 5;
  }

  // атомарные операции — с проверками выполнимости:
  plus1() {
    if (this.L < 4) {
      this.L += 1;
      return true;
    }
    if (this.U === 0) {
      this.U = 1;
      this.L = 0;
      return true;
    }
    return false;
  }

  minus1() {
    if (this.L > 0) {
      this.L -= 1;
      return true;
    }
    if (this.U === 1) {
      this.U = 0;
      this.L = 4;
      return true;
    }
    return false;
  }

  plusN(n) {
    for (let i = 0; i < n; i += 1) {
      if (!this.plus1()) return false;
    }
    return true;
  }

  minusN(n) {
    for (let i = 0; i < n; i += 1) {
      if (!this.minus1()) return false;
    }
    return true;
  }

  plus5() {
    if (this.U === 0) {
      this.U = 1;
      return true;
    }
    return false;
  }

  minus5() {
    if (this.U === 1) {
      this.U = 0;
      return true;
    }
    return false;
  }
}

export class Abacus {
  constructor(columns = 3) {
    this.cols = Array.from({ length: columns }, () => new Digit(0)); // младший разряд справа
  }

  // чтение как числа (для отладки)
  toNumber() {
    return this.cols.reduceRight((acc, digit, index, arr) => acc * 10 + arr[arr.length - 1 - index].value, 0);
  }

  // Применение атомарного шага: {col, type:'U+'|'U-'|'L+'|'L-'}
  applyStep(step) {
    const digit = this.cols[step.col];
    if (!digit) throw new Error('bad column');
    switch (step.type) {
      case 'U+':
        return digit.plus5();
      case 'U-':
        return digit.minus5();
      case 'L+':
        return digit.plus1();
      case 'L-':
        return digit.minus1();
      default:
        throw new Error('bad step');
    }
  }
}
