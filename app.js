// === MOBILE 100vh SUPER-FIX (iOS/Android) ============================
// Выставляет --app-vh = 1% от видимой высоты, учитывает адресную строку, повороты,
// возврат из bfcache, появление клавиатуры (VisualViewport).
(function () {
  const root = document.documentElement;

  function computeVH() {
    const vv = window.visualViewport;
    const h = Math.max(0, (vv?.height || window.innerHeight));
    return h * 0.01;
  }

  let raf = 0, timer = 0;
  function applyVH() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const vh = computeVH();
      root.style.setProperty('--app-vh', `${vh}px`);
      clearTimeout(timer);
      timer = setTimeout(() => {
        root.style.setProperty('--app-vh', `${computeVH()}px`);
      }, 200);
    });
  }

  applyVH();
  window.addEventListener('resize', applyVH, { passive: true });
  window.addEventListener('orientationchange', applyVH, { passive: true });
  window.addEventListener('pageshow', (e) => { if (e.persisted) applyVH(); setTimeout(applyVH, 50); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') applyVH(); }, { passive: true });

  if (window.visualViewport) {
    visualViewport.addEventListener('resize', applyVH, { passive: true });
    visualViewport.addEventListener('scroll', applyVH, { passive: true });
  }
})();

// === базовый fallback; не конфликтует, можно оставить ===
(function () {
  function setAppVH(){
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--app-vh', `${vh}px`);
  }
  setAppVH();
  window.addEventListener('resize', setAppVH);
  window.addEventListener('orientationchange', setAppVH);
  window.addEventListener('pageshow', setAppVH);
})();

/* ==== helpers ==== */
const qs  = (s, el=document)=>el.querySelector(s);
const qsa = (s, el=document)=>[...el.querySelectorAll(s)];
const r   = (min,max)=> Math.floor(Math.random()*(max-min+1)) + min;
const pick= arr => arr[Math.floor(Math.random()*arr.length)];

/* ==== sounds ==== */
const SND = {
  ok:   new Audio('assets/sounds/correct.mp3'),
  bad:  new Audio('assets/sounds/wrong.mp3'),
  click:new Audio('assets/sounds/click.mp3'),
  fanfare:new Audio('assets/sounds/fanfare.mp3'),
};
Object.values(SND).forEach(a=>{ try{ a.preload='auto'; a.volume=0.7; }catch(e){} });
const safePlay = a => { try{ if(a){ a.currentTime=0; a.play(); } }catch(e){} };

/* ==== i18n ==== */
const I18N = {
  ua: {
    title: "Множення та ділення",
    mode: "Режим",
    digitsToggle: "Обрати числа (на які множимо/ділимо)",
    series: "Серія",
    start: "Почати",
    confirmTitle: "Підтвердження налаштувань",
    back: "Повернутись",
    confirm: "Підтвердити",
    answerPlaceholder: "Відповідь",
    answer: "Відповісти",
    next: "Далі",
    reset: "Скинути",
    finish: "Завершити",
    total: "Всього",
    ok: "Вірно",
    bad: "Помилки",
    prog: "Серія",
    results: "Результати",
    retry: "Спробувати ще",
    toSettings: "Налаштування",
    acc: "Точність",
    modeMul: "Множення",
    modeDiv: "Ділення",
    modeMix: "Змішано (× і ÷)",
    all: "Усі",
  },
  en: {
    title: "Multiplication & Division",
    mode: "Mode",
    digitsToggle: "Choose numbers to multiply/divide",
    series: "Series",
    start: "Start",
    confirmTitle: "Confirm settings",
    back: "Back",
    confirm: "Confirm",
    answerPlaceholder: "Answer",
    answer: "Submit",
    next: "Next",
    reset: "Clear",
    finish: "Finish",
    total: "Total",
    ok: "Correct",
    bad: "Wrong",
    prog: "Progress",
    results: "Results",
    retry: "Try again",
    toSettings: "Settings",
    acc: "Accuracy",
    modeMul: "Multiplication",
    modeDiv: "Division",
    modeMix: "Mixed (× & ÷)",
    all: "All",
  },
  ru: {
    title: "Умножение и Деление",
    mode: "Режим",
    digitsToggle: "Выбрать числа (для умножения/деления)",
    series: "Серия",
    start: "Начать",
    confirmTitle: "Подтверждение настроек",
    back: "Вернуться",
    confirm: "Подтвердить",
    answerPlaceholder: "Ответ",
    answer: "Ответить",
    next: "Далее",
    reset: "Сброс",
    finish: "Завершить",
    total: "Всего",
    ok: "Верно",
    bad: "Ошибки",
    prog: "Серия",
    results: "Результаты",
    retry: "Попробовать ещё",
    toSettings: "Настройки",
    acc: "Точность",
    modeMul: "Умножение",
    modeDiv: "Деление",
    modeMix: "Смешано (× и ÷)",
    all: "Все",
  },
  es: {
    title: "Multiplicación y División",
    mode: "Modo",
    digitsToggle: "Elegir números para multiplicar/dividir",
    series: "Serie",
    start: "Comenzar",
    confirmTitle: "Confirmar ajustes",
    back: "Volver",
    confirm: "Confirmar",
    answerPlaceholder: "Respuesta",
    answer: "Responder",
    next: "Siguiente",
    reset: "Borrar",
    finish: "Terminar",
    total: "Total",
    ok: "Correctas",
    bad: "Incorrectas",
    prog: "Progreso",
    results: "Resultados",
    retry: "Intentar de nuevo",
    toSettings: "Ajustes",
    acc: "Precisión",
    modeMul: "Multiplicación",
    modeDiv: "División",
    modeMix: "Mixto (× y ÷)",
    all: "Todos",
  }
};

/* ==== end phrases by language & accuracy ==== */
const END_PHRASES = {
  ua: {
    perfect: ["Вау! 100% — чемпіон!", "Без жодної помилки! Так тримати!"],
    great:   ["Супер результат!", "Молодець!"],
    good:    ["Гарна робота!", "Йде чудово!"],
    try:     ["Ти на правильному шляху!", "Ще трішки практики — і буде топ!"]
  },
  en: {
    perfect: ["Wow! 100% — champion!", "Flawless! Keep it up!"],
    great:   ["Awesome result!", "Great job!"],
    good:    ["Nice work!", "You’re doing great!"],
    try:     ["You’re on the right track!", "A bit more practice and you’ll nail it!"]
  },
  ru: {
    perfect: ["Вау! 100% — чемпион!", "Без единой ошибки! Так держать!"],
    great:   ["Отличный результат!", "Молодец!"],
    good:    ["Хорошая работа!", "Здорово идёт!"],
    try:     ["Ты на верном пути!", "Еще чуть-чуть — и будет идеально!"]
  },
  es: {
    perfect: ["¡Guau! ¡100% — campeón!", "¡Sin errores! ¡Sigue así!"],
    great:   ["¡Resultado genial!", "¡Buen trabajo!"],
    good:    ["¡Bien hecho!", "¡Vas muy bien!"],
    try:     ["¡Vas por buen camino!", "¡Un poco más y lo bordas!"]
  }
};
function pickEndPhrase(lang, acc){
  const pack = END_PHRASES[lang] || END_PHRASES.ua;
  const set =
    acc === 100 ? pack.perfect :
    acc >= 80   ? pack.great   :
    acc >= 50   ? pack.good    : pack.try;
  return set[Math.floor(Math.random()*set.length)];
}

function T(key){ const t = I18N[state.lang] || I18N.ua; return t[key] ?? key; }
function applyLang(lang){
  const t = I18N[lang] || I18N.ua;
  document.documentElement.lang = lang;
  document.title = `MindWorld — ${t.title}`;

  qs('#pageTitle')?.replaceChildren(t.title);

  // settings
  qs('#lblMode')?.replaceChildren(t.mode);
  qs('#lblDigitsToggle')?.replaceChildren(t.digitsToggle);
  qs('#lblSeries')?.replaceChildren(t.series);
  const startBtn = qs('#startBtn'); if(startBtn) startBtn.textContent = t.start;

  // подписи опций селекта "Режим"
  if (modeSel) {
    const oMul = modeSel.querySelector('option[value="mul"]');
    const oDiv = modeSel.querySelector('option[value="div"]');
    const oMix = modeSel.querySelector('option[value="rnd"]');
    if (oMul) oMul.textContent = t.modeMul;
    if (oDiv) oDiv.textContent = t.modeDiv;
    if (oMix) oMix.textContent = t.modeMix;
  }
  const chipAll = document.querySelector('#digitsGroup .chip[data-digit="all"]');
  if (chipAll) chipAll.textContent = t.all;

  // confirm
  qs('#confirmTitle')?.replaceChildren(t.confirmTitle);
  const backBtn = qs('#backToSettings'); if(backBtn) backBtn.textContent = t.back;
  const confirmBtn = qs('#confirmStart'); if(confirmBtn) confirmBtn.textContent = t.confirm;

  // play captions
  const ansInput = qs('#ansInput'); ansInput?.setAttribute('placeholder', t.answerPlaceholder);
  const submitBtn = qs('#submitBtn'); if(submitBtn) submitBtn.textContent = t.answer;
  const nextBtn = qs('#nextBtn'); if(nextBtn) nextBtn.textContent = t.next;
  const resetBtn = qs('#resetBtn'); if(resetBtn) resetBtn.textContent = t.reset;
  const finishBtn = qs('#finishBtn'); if(finishBtn) finishBtn.textContent = t.finish;

  // score labels — исправлено: обновляем сам span, а не firstChild
  const lblTotal = qs('#lblTotal'); if(lblTotal) lblTotal.textContent = t.total + ':';
  const lblOk    = qs('#lblOk');    if(lblOk)    lblOk.textContent    = t.ok    + ':';
  const lblBad   = qs('#lblBad');   if(lblBad)   lblBad.textContent   = t.bad   + ':';
  const lblProg  = qs('#lblProg');  if(lblProg)  lblProg.textContent  = t.prog  + ':';

  // results screen
  qs('#resTitle')?.replaceChildren(t.results);
  qs('#resTotalLabel')?.replaceChildren(t.total);
  qs('#resOkLabel')?.replaceChildren(t.ok);
  qs('#resBadLabel')?.replaceChildren(t.bad);
  qs('#resAccLabel')?.replaceChildren(t.acc);
  const btnRetry = qs('#btnRetry'); if(btnRetry) btnRetry.textContent = t.retry;
  const btnToSettings = qs('#btnToSettings'); if(btnToSettings) btnToSettings.textContent = t.toSettings;

  // active lang capsule
  qsa(".lang-capsule button").forEach(b=> b.classList.toggle("active", b.dataset.lang===lang));
}

/* ==== state ==== */
const state = {
  lang:   localStorage.getItem("mw_lang")   || "ua",
  mode:   localStorage.getItem("mw_mode")   || "mul",  // mul|div|rnd
  series: Number(localStorage.getItem("mw_series") || 10),
  digitsEnabled: localStorage.getItem("mw_digits_enabled")==="1",
  digits: (localStorage.getItem("mw_digits") || "")
            .split(",").map(n=>Number(n)).filter(n=>!Number.isNaN(n)),
  // runtime
  n:0, ok:0, bad:0, q:null,
  revealed:false,
};

/* ==== screens ==== */
const scrSettings = qs('#screen-settings');
const scrConfirm  = qs('#screen-confirm');
const scrPlay     = qs('#screen-play');
const scrResults  = qs('#screen-results');
function showScreen(name){
  scrSettings.hidden = name!=='settings';
  scrConfirm.hidden  = name!=='confirm';
  scrPlay.hidden     = name!=='play';
  if(scrResults) scrResults.hidden = name!=='results';
  requestAnimationFrame(()=>window.scrollTo(0,0));
}

/* ==== language capsule ==== */
qsa(".lang-capsule button").forEach(b=>{
  b.classList.toggle("active", b.dataset.lang===state.lang);
  b.addEventListener("click", (e)=>{
    e.preventDefault();
    state.lang = b.dataset.lang;
    localStorage.setItem("mw_lang", state.lang);
    applyLang(state.lang);
    safePlay(SND.click);
  }, {capture:true});
});

/* ==== UI refs ==== */
const modeSel      = qs("#modeSel");
const seriesSel    = qs("#seriesSel");
const digitsEnable = qs("#digitsEnable");      // Чекбокс будем прятать
const digitsGroup  = qs("#digitsGroup");
const lblDigitsToggleEl = qs("#lblDigitsToggle"); // Подпись к чекбоксу

const startBtn     = qs("#startBtn");
const backBtn      = qs("#backToSettings");
const confirmBtn   = qs("#confirmStart");
const confirmList  = qs("#confirmList");

const qText        = qs("#qText");
const boardEl      = qs(".board");
const gameControls = qs("#gameControls");
const ansInput     = qs("#ansInput");
const submitBtn    = qs("#submitBtn");
const nextBtn      = qs("#nextBtn");
const resetBtn     = qs("#resetBtn");
const finishBtn    = qs("#finishBtn");
const okEl         = qs("#ok");
const badEl        = qs("#bad");
const totalEl      = qs("#total");
const progEl       = qs("#prog");

// progress bars
const miniProgress  = qs('#miniProgress');
const finalProgress = qs('#finalProgress');

// results refs
const resTotal = qs('#resTotal');
const resOk    = qs('#resOk');
const resBad   = qs('#resBad');
const resAcc   = qs('#resAcc');
const btnRetry = qs('#btnRetry');
const btnToSettings = qs('#btnToSettings');

/* ==== hide checkbox + label on UI ==== */
(function hideDigitsToggle(){
  const row = (lblDigitsToggleEl?.closest('.form-row')) || (digitsEnable?.closest('.form-row'));
  if (row) {
    row.style.display = 'none';
  } else {
    if (lblDigitsToggleEl) lblDigitsToggleEl.style.display = 'none';
    if (digitsEnable) digitsEnable.style.display = 'none';
  }
})();

/* ==== init controls ==== */
if (modeSel)   modeSel.value    = state.mode;
if (seriesSel) seriesSel.value  = String(state.series);

// чекбокс визуально синхронизируем, но он скрыт и не влияет
if (digitsEnable) digitsEnable.checked = (state.digits.length > 0) || state.digitsEnabled;

// чипы ВСЕГДА активны (не блокируем группу)
if (digitsGroup)  digitsGroup.classList.toggle("disabled", false);

// важно: Enter не сабмитит форму
if (submitBtn) submitBtn.type = "button";

// restore digits
if (state.digits.length && digitsGroup) {
  state.digits.forEach(d=>{
    const btn = qs(`.chip[data-digit="${d}"]`, digitsGroup);
    if (btn) btn.classList.add("active");
  });
}
syncAllChip();

// apply language on load
applyLang(state.lang);

/* ==== listeners (settings screen) ==== */
modeSel?.addEventListener("change", ()=>{
  state.mode = modeSel.value; localStorage.setItem("mw_mode", state.mode);
});
seriesSel?.addEventListener("change", ()=>{
  state.series = Number(seriesSel.value); localStorage.setItem("mw_series", state.series);
});

// Чекбокс больше не влияет ни на что — оставляем только сохранение состояния
digitsEnable?.addEventListener("change", ()=>{
  state.digitsEnabled = digitsEnable.checked;
  localStorage.setItem("mw_digits_enabled", state.digitsEnabled ? "1" : "0");
});

digitsGroup?.addEventListener("click", (e)=>{
  const b = e.target.closest(".chip"); if(!b) return;
  const v = b.dataset.digit;

  if (v === "all"){
    const chips = qsa('.chip[data-digit]:not([data-digit="all"])', digitsGroup);
    const allActive = chips.every(ch => ch.classList.contains("active"));
    chips.forEach(ch => ch.classList.toggle("active", !allActive));
    state.digits = !allActive ? chips.map(ch => Number(ch.dataset.digit)) : [];
  } else {
    b.classList.toggle("active");
    const d = Number(v);
    if (b.classList.contains("active")){
      if (!state.digits.includes(d)) state.digits.push(d);
    } else {
      state.digits = state.digits.filter(x=>x!==d);
    }
  }
  localStorage.setItem("mw_digits", state.digits.join(","));
  syncAllChip();

  // Для консистентности синхронизируем скрытый чекбокс
  if (digitsEnable) digitsEnable.checked = state.digits.length > 0;
});

/* ==== flow buttons ==== */
startBtn?.addEventListener("click", (e)=>{
  e.preventDefault();
  buildConfirm();
  showScreen('confirm'); // ← явный переход на экран подтверждения
  safePlay(SND.click);
});
backBtn ?.addEventListener("click", (e)=>{ e.preventDefault(); showScreen('settings'); safePlay(SND.click); });
confirmBtn?.addEventListener("click", (e)=>{ e.preventDefault(); startGame(); showScreen('play'); safePlay(SND.click); });

/* ==== confirm builder ==== */
function buildConfirm(){
  state.mode   = modeSel?.value ?? state.mode;
  state.series = Number(seriesSel?.value ?? state.series);

  const modeText =
    state.mode === 'mul' ? T('modeMul') :
    state.mode === 'div' ? T('modeDiv') :
                           T('modeMix');

  const digitsText = (state.digits.length
    ? state.digits.slice().sort((a,b)=>a-b).join(', ')
    : T('all'));

  if (confirmList){
    confirmList.innerHTML = `
      <li><b>${T('mode')}:</b> ${modeText}</li>
      <li><b>${T('series')}:</b> ${state.series}</li>
      <li style="grid-column:1 / -1;"><b>${T('digitsToggle')}:</b> ${digitsText}</li>
    `;
  }
}

/* ==== progress bars ==== */
function setProgressBars(ok, bad, total){
  const pOk  = total ? (ok/total)*100 : 0;
  const pBad = total ? (bad/total)*100 : 0;
  const pRest = Math.max(0, 100 - pOk - pBad);

  function apply(bar){
    if(!bar) return;
    const g    = bar.querySelector('.progress__green');
    const red  = bar.querySelector('.progress__red');
    const rest = bar.querySelector('.progress__rest');
    if (g)   g.style.width = pOk + '%';
    if (red){ red.style.left = pOk + '%'; red.style.width = pBad + '%'; }
    if (rest) rest.style.width = pRest + '%';
  }
  apply(miniProgress);
  apply(finalProgress);
}

/* ==== resize: пропорциональный размер цифр на доске ==== */
function resizeBoardText(){
  if (!boardEl || !qText) return;
  const rect = boardEl.getBoundingClientRect();
  // коэффициент подбирался под текущую рамку: 0.28 высоты хорошо заполняет
  const px = Math.max(24, Math.min(64, Math.round(rect.height * 0.28)));
  qText.style.fontSize = px + 'px';
}
window.addEventListener('resize', resizeBoardText, { passive: true });
window.addEventListener('orientationchange', resizeBoardText, { passive: true });
window.addEventListener('pageshow', ()=>setTimeout(resizeBoardText, 50), { passive:true });

/* ==== series builder (unique, capped, and mixed-run constraint) ==== */
function buildQuestionPoolsSplit(){
  const usePool = state.digits.length > 0;
  const sel = usePool ? [...state.digits] : null;

  const mkMul = (a,b)=>({a,b,ans:a*b,op:'×'});
  const mkDiv = (d,q)=>({a:d*q, b:d, ans:q, op:'÷'});

  let poolMul = [];
  let poolDiv = [];

  const A = sel ? sel : [...Array(10).keys()];
  for(const a of A){
    for(let b=0;b<=9;b++){
      poolMul.push(mkMul(a,b));
    }
  }
  const D = sel ? sel.filter(d=>d!==0) : [1,2,3,4,5,6,7,8,9];
  for(const d of D){
    for(let q=0;q<=9;q++){
      poolDiv.push(mkDiv(d,q));
    }
  }
  return {poolMul, poolDiv};
}
function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }
function keyOf(q){ return `${q.op}:${q.a}:${q.b}`; }
function opCode(q){ return q.op==='×' ? 'mul' : 'div'; }
function isZeroQuestion(q){
  if (q.op === '×') return q.a === 0 || q.b === 0;
  return q.a === 0;
}
function buildSeriesList(){
  const N = state.series;
  const { poolMul, poolDiv } = buildQuestionPoolsSplit();

  const allPool = (state.mode === 'mul') ? poolMul
               : (state.mode === 'div') ? poolDiv
               : [...poolMul, ...poolDiv];

  const uniqueCount = new Set(allPool.map(keyOf)).size;
  const capPerItem = (N <= uniqueCount) ? 1 : 2;

  const out = [];
  const used = new Map();
  let zeroCount = 0;

  function pickFrom(pool){
    for (let tries = 0; tries < 300; tries++){
      const q = pool[Math.floor(Math.random()*pool.length)];
      const k = keyOf(q);

      if ((used.get(k) || 0) >= capPerItem) continue;
      if (isZeroQuestion(q) && zeroCount >= 1) continue;
      if (state.mode === 'rnd' && out.length >= 2){
        const op = opCode(q);
        const p1 = opCode(out[out.length-1]);
        const p2 = opCode(out[out.length-2]);
        if (op === p1 && op === p2) continue;
      }
      return q;
    }
    return null;
  }

  if (state.mode === 'mul' || state.mode === 'div'){
    const base = (state.mode === 'mul') ? poolMul : poolDiv;
    while (out.length < N){
      const q = pickFrom(base);
      if (!q) break;
      const k = keyOf(q);
      used.set(k, (used.get(k)||0) + 1);
      if (isZeroQuestion(q)) zeroCount++;
      out.push(q);
    }
  } else {
    while (out.length < N){
      const last1 = out.length>=1 ? opCode(out[out.length-1]) : null;
      const last2 = out.length>=2 ? opCode(out[out.length-2]) : null;
      const prefer = (last1 && last2 && last1===last2)
        ? (last1==='mul' ? 'div' : 'mul')
        : (Math.random() < 0.5 ? 'mul' : 'div');

      const firstPool  = prefer==='mul' ? poolMul : poolDiv;
      const secondPool = prefer==='mul' ? poolDiv : poolMul;

      let q = pickFrom(firstPool);
      if (!q) q = pickFrom(secondPool);
      if (!q) break;

      const k = keyOf(q);
      used.set(k, (used.get(k)||0) + 1);
      if (isZeroQuestion(q)) zeroCount++;
      out.push(q);
    }
  }

  while (out.length < N){
    const q = allPool[Math.floor(Math.random()*allPool.length)];
    if (isZeroQuestion(q) && zeroCount >= 1) continue;
    const k = keyOf(q);
    used.set(k, (used.get(k)||0) + 1);
    if (isZeroQuestion(q)) zeroCount++;
    out.push(q);
  }

  return shuffle(out).slice(0, N);
}

/* ==== game flow ==== */
function startGame(){
  state.n=0; state.ok=0; state.bad=0; state.q=null; state.revealed=false;
  if (totalEl) totalEl.textContent = state.series;
  clearBoardHighlight();
  setProgressBars(0,0,state.series);
  state.queue = buildSeriesList();
  resizeBoardText(); // сразу подогнать размер цифр на доске
  next();
}

submitBtn?.addEventListener("click", (e)=>{ e.preventDefault(); check(); safePlay(SND.click); });
nextBtn  ?.addEventListener("click", (e)=>{ e.preventDefault(); next();  safePlay(SND.click); });
resetBtn ?.addEventListener("click", (e)=>{ e.preventDefault(); if(ansInput){ ansInput.value=''; ansInput.focus(); } safePlay(SND.click); });
finishBtn?.addEventListener("click", (e)=>{ e.preventDefault(); clearBoardHighlight(); showScreen('settings'); safePlay(SND.click); });

// Enter: сначала показать ответ, второй Enter — следующий пример
ansInput?.addEventListener("keydown", (e)=>{
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!state.revealed) check();
    else next();
  }
});

function next(){
  state.revealed = false;
  clearBoardHighlight();

  if (state.n >= state.series){
    const total = state.series;
    const ok = state.ok;
    const bad = state.bad;
    const acc = total ? Math.round((ok/total)*100) : 0;

    if (resTotal) resTotal.textContent = total;
    if (resOk)    resOk.textContent    = ok;
    if (resBad)   resBad.textContent   = bad;
    if (resAcc)   resAcc.textContent   = acc + '%';
    setProgressBars(ok, bad, total);

    const phrase = pickEndPhrase(state.lang, acc);
    const titleEl = document.getElementById('resTitle');
    if (titleEl) titleEl.textContent = phrase;

    showScreen('results');
    safePlay(SND.fanfare);
    runConfetti(3500);
    return;
  }

  state.n++;
  state.q = (state.queue && state.queue[state.n-1]) || genQ();
  if (qText) qText.textContent = `${state.q.a} ${state.q.op} ${state.q.b} = ?`;
  if (ansInput){ ansInput.value = ''; ansInput.focus(); }
  resizeBoardText();
  updateScore();
}

function genQ(){
  const mode = (state.mode==='rnd') ? (Math.random()<0.5?'mul':'div') : state.mode;

  const usePool = state.digits.length > 0;
  const pool    = usePool ? [...state.digits] : null;

  if (mode==='mul'){
    const a = pool ? pick(pool) : r(0,9);
    const b = r(0,9);
    return {a,b,ans:a*b,op:'×'};
  }else{
    let divPool = pool ? pool.filter(n=>n!==0) : null;
    if(!divPool || !divPool.length) divPool = [1,2,3,4,5,6,7,8,9];
    const d  = pick(divPool);
    const qv = r(0,9);
    return {a:d*qv, b:d, ans:qv, op:'÷'};
  }
}

function check(){
  if(!state.q || state.revealed) return;

  const s = ansInput?.value.trim() ?? '';
  const v = Number(s);
  if(s==='' || Number.isNaN(v)){ ansInput?.focus(); return; }

  state.revealed = true;

  const isRight = (v === state.q.ans);
  if (isRight){
    state.ok++;
    highlightBoard(true);
    safePlay(SND.ok);
  } else {
    state.bad++;
    highlightBoard(false);
    safePlay(SND.bad);
  }

  if (qText) qText.textContent = `${state.q.a} ${state.q.op} ${state.q.b} = ${state.q.ans}`;

  updateScore();
  nextBtn?.focus();
}

function updateScore(){
  if (okEl)   okEl.textContent   = state.ok;
  if (badEl)  badEl.textContent  = state.bad;
  if (progEl) progEl.textContent = `${Math.min(state.n,state.series)}/${state.series}`;
  setProgressBars(state.ok, state.bad, state.series);
}

/* Подсветка всей доски */
function highlightBoard(ok){
  if(!boardEl) return;
  boardEl.classList.remove('is-correct','is-wrong');
  boardEl.classList.add(ok ? 'is-correct' : 'is-wrong');
}
function clearBoardHighlight(){
  if(!boardEl) return;
  boardEl.classList.remove('is-correct','is-wrong');
}

/* вспомогательное для чипа "Усі" */
function syncAllChip(){
  if(!digitsGroup) return;
  const allBtn = qs('.chip[data-digit="all"]', digitsGroup);
  if(!allBtn) return;
  const chips = qsa('.chip[data-digit]:not([data-digit="all"])', digitsGroup);
  const allActive = chips.length>0 && chips.every(ch=>ch.classList.contains("active"));
  allBtn.classList.toggle("active", allActive);
}

/* ==== default screen ==== */
showScreen('settings');

/* результаты: делегирование + стоп конфетти */
document.addEventListener('click', (e) => {
  const el = e.target.closest('button');
  if (!el) return;

  if (el.id === 'btnRetry') {
    e.preventDefault();
    stopConfetti();
    startGame();
    showScreen('play');
    safePlay?.(SND?.click);
  }

  if (el.id === 'btnToSettings') {
    e.preventDefault();
    stopConfetti();
    showScreen('settings');
    safePlay?.(SND?.click);
  }
});

/* ==== confetti ==== */
let confettiRAF = null;
function runConfetti(duration=3000){
  const cvs = document.getElementById('confettiCanvas');
  if(!cvs) return;
  const ctx = cvs.getContext('2d');
  const DPR = Math.max(1, window.devicePixelRatio || 1);

  function resize(){
    cvs.width  = Math.floor(window.innerWidth  * DPR);
    cvs.height = Math.floor(window.innerHeight * DPR);
    cvs.style.display = 'block';
  }
  resize();
  window.addEventListener('resize', resize, { once:true });

  const colors = ['#FDD835','#FF7043','#66BB6A','#42A5F5','#AB47BC'];
  const N = Math.round((cvs.width/DPR) * 0.2);
  const P = Array.from({length:N}, () => ({
    x: Math.random()*cvs.width,
    y: -Math.random()*cvs.height*0.5,
    r: 2 + Math.random()*4,
    vx: -1 + Math.random()*2,
    vy: 2 + Math.random()*3,
    col: colors[Math.floor(Math.random()*colors.length)],
    rot: Math.random()*Math.PI,
    vr: -0.1 + Math.random()*0.2
  }));

  const t0 = performance.now();
  cancelAnimationFrame(confettiRAF);

  function tick(t){
    const dt = (t - (tick.prev||t))/16.7; tick.prev = t;
    ctx.clearRect(0,0,cvs.width,cvs.height);

    for(const p of P){
      p.x += p.vx * DPR;
      p.y += p.vy * DPR;
      p.rot += p.vr*dt;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      ctx.fillRect(-p.r*DPR, -p.r*DPR, p.r*2*DPR, p.r*2*DPR);
      ctx.restore();

      if(p.y > cvs.height + 20*DPR) {
        p.y = -10*DPR; p.x = Math.random()*cvs.width;
      }
    }

    if (t - t0 < duration){
      confettiRAF = requestAnimationFrame(tick);
    } else {
      stopConfetti();
    }
  }
  confettiRAF = requestAnimationFrame(tick);
}
function stopConfetti(){
  cancelAnimationFrame(confettiRAF);
  confettiRAF = null;
  const cvs = document.getElementById('confettiCanvas');
  if(cvs) cvs.style.display = 'none';
}
/* === Автоподгон сцены между шапкой и нижней карточкой === */
(function(){
  const root = document.documentElement;
  const hdr  = document.querySelector('.hero');
  const scene= document.querySelector('.scene');
  const card = document.querySelector('.controls-card');

  function vvHeight(){
    const vv = window.visualViewport;
    return Math.max(0, (vv?.height || window.innerHeight));
  }

  function fitPlayLayout(){
    if(!scene) return;
    const hV  = vvHeight();
    const hHdr= hdr ? hdr.getBoundingClientRect().height : 0;
    const hCard= card ? card.getBoundingClientRect().height : 0;

    // внутренние отступы/зазоры: верх/низ контейнера + расстояние до карточки
    const padding = 24; // можно подкрутить при желании

    // свободная высота под сцену:
    let hFree = hV - hHdr - hCard - padding;
    hFree = Math.max(260, hFree); // не меньше 260px, чтобы доска не схлопнулась

    scene.style.minHeight = hFree + 'px';
    scene.style.height    = hFree + 'px';
  }

  // первичный вызов + пересчёт при изменениях
  window.addEventListener('load', fitPlayLayout);
  document.addEventListener('DOMContentLoaded', fitPlayLayout);
  window.addEventListener('resize', fitPlayLayout, { passive: true });
  window.addEventListener('orientationchange', fitPlayLayout, { passive: true });
  if (window.visualViewport){
    visualViewport.addEventListener('resize', fitPlayLayout, { passive: true });
    visualViewport.addEventListener('scroll', fitPlayLayout, { passive: true });
  }

  // на переключениях экранов тоже пересчитать
  const ro = new ResizeObserver(fitPlayLayout);
  hdr && ro.observe(hdr);
  card && ro.observe(card);
})();
/* ===== Fit play layout v2: сцена между шапкой и нижней карточкой, карточка гарантированно видна ===== */
(function () {
  const SAFE_GAP   = 50;   // запас, чтобы карточка точно не пряталась (ты просила 50px)
  const CARD_MIN_H = 92;   // минимальная высота нижней карточки, если браузер возвращает 0

  function cssNum(el, prop) {
    if (!el) return 0;
    const v = getComputedStyle(el).getPropertyValue(prop);
    return parseFloat(v) || 0;
  }

  function viewportPx() {
    const vh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-vh'));
    return (vh && !Number.isNaN(vh)) ? (vh * 100) : window.innerHeight;
  }

  function fitPlayLayout() {
    const screen     = document.getElementById('screen-play');
    if (!screen || screen.hasAttribute('hidden')) return;

    const container  = screen.querySelector('.container');
    const scene      = screen.querySelector('.scene');
    const card       = screen.querySelector('.controls-card');
    const hero       = document.querySelector('.hero');

    if (!container || !scene) return;

    const viewH      = viewportPx();
    const heroH      = hero ? hero.offsetHeight : 0;
    const paddTop    = cssNum(screen, 'padding-top');
    const paddBot    = cssNum(screen, 'padding-bottom');

    // Высота карточки: реальная или минимальная заглушка
    let cardH = CARD_MIN_H;
    if (card) {
      const rect = card.getBoundingClientRect();
      cardH = Math.max(rect.height || 0, CARD_MIN_H);
    }

    // Доступное место под сцену с запасом 50px
    let available = viewH - heroH - paddTop - paddBot - cardH - SAFE_GAP;
    available = Math.max(260, available);

    // Фиксируем высоты
    container.style.minHeight = viewH + 'px'; // чтобы был скролл при необходимости
    scene.style.minHeight = available + 'px';
    scene.style.height    = available + 'px';
  }

  // Системные события
  ['load','resize','orientationchange','pageshow'].forEach(ev =>
    window.addEventListener(ev, fitPlayLayout, { passive: true })
  );

  // Появление мобильной клавиатуры
  document.addEventListener('focus',  (e)=>{ if (e.target?.id === 'ansInput') setTimeout(fitPlayLayout, 60); }, true);
  document.addEventListener('blur',   (e)=>{ if (e.target?.id === 'ansInput') setTimeout(fitPlayLayout, 60); }, true);

  // Переходы между экранами
  document.getElementById('startBtn')?.addEventListener('click', ()=> setTimeout(fitPlayLayout, 0));
  document.getElementById('confirmStart')?.addEventListener('click', ()=> setTimeout(fitPlayLayout, 0));

  // Экспорт при необходимости
  window.fitPlayLayout = fitPlayLayout;
})();
