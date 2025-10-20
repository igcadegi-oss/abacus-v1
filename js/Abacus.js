/**
 * AbacusFinalFixedV6.js — ВЕРСИЯ
 * Изменения vs V5:
 *  - Кнопка сброса вынесена в HTML (см. index.html), SVG-кнопка удалена.
 *  - Абакус увеличен ещё на ~20% относительно V3 (крупнее, без перекрытий).
 *  - Геометрия выровнена: больше нижний зазор, аккуратные пропорции как на скрине 2.
 *  - Цвет точек = цвет рамки (wood mid).
 */
export class Abacus {
  constructor(container, options = {}) {
    if (!container) throw new Error('Container element is required for Abacus.');
    this.container = container;

    // OPTIONS
    this.requestedDigitCount = this.#clampDigitCount(options.digitCount ?? 10);
    this.digitCount = this.requestedDigitCount;
    this.decimalOffset = Math.max(0, Math.round(options.decimalOffset ?? 0));
    this.showDigits = options.showDigits !== false;

    // THEME
    this.theme = {
      woodTopGradientStart: "#A0522D",
      woodTopGradientMid:   "#8B4513",
      woodTopGradientEnd:   "#6B3410",
      metalStart:  "#949494",
      metalMid1:   "#ababab",
      metalMid2:   "#757575",
      metalMid3:   "#8c8c8c",
      metalEnd:    "#606060",
      beadInner:   "#ffb366",
      beadMain:    "#ff7c00",
      beadEdge:    "#cc6300",
      rodColor:    "#654321",
      dotsColor:   "#8B4513",
      digitsColor: "#7d733a",
      rodWidth:    8
    };

    // GEOMETRY — enlarged (~20% over earlier)
    this.columnSpacing = 113;
    this.columnStart = 50;
    this.columnEndPadding = 95;
    this.beadHeight = 56;
    this.beadWidth = 50;
    this.gapFromBar = 4;

    this.metrics = {
      baseTopFrameY: 10,
      baseBottomFrameY: 264,
      topFrameHeight: 30,
      bottomFrameHeight: 30,
      middleBarTop: 91,
      middleBarLightY: 92,
      middleBarShadowY: 101,
      columnTopBase: 40,
      earthActiveBase: 138 // raised for bigger lower area
    };

    this.currentOffsetY = this.showDigits ? 50 : 20;
    this.svgHeight = this.metrics.baseBottomFrameY + 130 + this.metrics.bottomFrameHeight + 40;

    // STATE
    this.beads = [];
    this.dragging = null;
    this.dragStartY = null;

    // SVG
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("class", "abacus-svg");
    this.svg.setAttribute("height", this.svgHeight);
    this.svg.setAttribute("role", "presentation");
    this.container.innerHTML = "";
    this.container.appendChild(this.svg);

    // INIT
    this.#initState();
    this.#attachEvents();
    this.#setupAdaptiveResize();
    this.#render();
  }

  // ---------- Public API ----------
  setDigitCount(n){
    const clamped=this.#clampDigitCount(n);
    if (clamped===this.requestedDigitCount) return;
    this.requestedDigitCount=clamped;
    this.#updateAdaptiveDigitCount();
    if (this.decimalOffset>this.digitCount-1) this.decimalOffset=this.digitCount-1;
    this.#render();
  }
  setDecimalOffset(n){ const max=Math.max(0,this.digitCount-1); this.decimalOffset=Math.max(0,Math.min(max,Math.round(Number(n)||0))); this.#render(); }
  setShowDigits(v){ const val=!!v; if (val===this.showDigits) return; this.showDigits=val; this.#render(); }
  reset(){
    for(let col=0;col<this.digitCount;col++){
      this.beads[col].heaven='up';
      this.beads[col].earth=['down','down','down','down'];
    }
    this.#render();
  }
  getColumnValue(col){
    const c=this.beads[col]; if(!c) return 0;
    let v=(c.heaven==='down')?5:0;
    c.earth.forEach(p=>{ if(p==='up') v+=1; });
    return v;
  }
  getValue(){
    let total=0;
    for(let col=0;col<this.digitCount;col++){
      const mul=Math.pow(10,this.digitCount-col-1);
      total += this.getColumnValue(col)*mul;
    }
    return total;
  }

  // ---------- Internals ----------
  #clampDigitCount(x){ const n=Math.round(Number(x)||0); return Math.max(1,Math.min(23,n)); }
  #initState(){ this.beads=Array.from({length:this.digitCount},()=>({heaven:'up', earth:['down','down','down','down']})); }

  #setupAdaptiveResize(){
    this.resizeObserver=new ResizeObserver(()=>this.#updateAdaptiveDigitCount());
    this.resizeObserver.observe(this.container);
  }
  #calcWidth(d){ return this.columnStart + (d-1)*this.columnSpacing + this.columnEndPadding; }
  #updateAdaptiveDigitCount(){
    const w=this.container.clientWidth||0;
    const req=this.#calcWidth(this.requestedDigitCount);
    if (req <= w*0.97){
      if (this.digitCount!==this.requestedDigitCount){
        this.digitCount=this.requestedDigitCount;
        this.#initState(); this.#render();
      }
      return;
    }
    let best=1;
    for(let d=1; d<=this.requestedDigitCount; d++){
      if (this.#calcWidth(d) <= w*0.97) best=d; else break;
    }
    if (best!==this.digitCount){
      this.digitCount=best; this.#initState(); this.#render();
    }
  }

  #attachEvents(){
    this.svg.addEventListener('mousedown', e=>this.#down(e,e));
    window.addEventListener('mousemove', e=>this.#move(e,e));
    window.addEventListener('mouseup', ()=>this.#up());
    this.svg.addEventListener('touchstart', e=>{ if(e.touches&&e.touches[0]) this.#down(e.touches[0],e); }, {passive:false});
    window.addEventListener('touchmove', e=>{
      if(this.dragging && e.touches && e.touches[0]){ e.preventDefault(); this.#move(e.touches[0],e); }
    }, {passive:false});
    window.addEventListener('touchend', ()=>this.#up());
    window.addEventListener('touchcancel', ()=>this.#up());
  }
  #down(p,ev){
    const t = p.target instanceof Element ? p.target.closest('[data-role="bead"]') : null; if(!t) return;
    const col=+t.getAttribute('data-col'), type=t.getAttribute('data-type'), index=+t.getAttribute('data-index');
    const r=this.svg.getBoundingClientRect(); this.dragStartY=p.clientY-r.top; this.dragging={col,type,index};
    ev?.preventDefault?.();
  }
  #move(p,ev){
    if(!this.dragging) return;
    const r=this.svg.getBoundingClientRect(), y=p.clientY-r.top, d=y-this.dragStartY, T=8, c=this.dragging.col;
    const col=this.beads[c]; if(!col) return;
    if(this.dragging.type==='heaven'){
      if(d>T && col.heaven!=='down'){ col.heaven='down'; this.dragStartY=y; this.#render(); }
      else if(d<-T && col.heaven!=='up'){ col.heaven='up'; this.dragStartY=y; this.#render(); }
    } else {
      const e=[...col.earth]; let changed=false;
      if(d<-T){ for(let i=0;i<=this.dragging.index;i++){ if(e[i]!=='up'){ e[i]='up'; changed=true; } } }
      else if(d>T){ for(let i=this.dragging.index;i<e.length;i++){ if(e[i]!=='down'){ e[i]='down'; changed=true; } } }
      if(changed){ col.earth=e; this.dragStartY=y; this.#render(); }
    }
    ev?.preventDefault?.();
  }
  #up(){ this.dragging=null; this.dragStartY=null; }

  // ---------- Render ----------
  #render(){
    const width=this.#calcWidth(this.digitCount);
    this.svg.setAttribute('width', width);
    this.currentOffsetY = this.showDigits ? 50 : 20;

    const topY = this.metrics.baseTopFrameY + this.currentOffsetY;
    const botY = this.metrics.baseBottomFrameY + this.currentOffsetY;

    const html = `${this.#defs()}${this.#frame(width,topY,botY)}${this.#rods(topY,botY)}${this.#middle(width)}${this.#dots()}${this.#labels(topY)}${this.#beads()}`;
    this.svg.innerHTML = html;
  }

  #defs(){
    return `<defs>
      <filter id="beadShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dx="0" dy="3" result="offsetblur"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.6"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="frameShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4"/><feOffset dx="0" dy="4" result="offsetblur"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="woodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${this.theme.woodTopGradientStart}"/>
        <stop offset="50%" stop-color="${this.theme.woodTopGradientMid}"/>
        <stop offset="100%" stop-color="${this.theme.woodTopGradientEnd}"/>
      </linearGradient>
      <linearGradient id="metalBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${this.theme.metalStart}"/>
        <stop offset="30%" stop-color="${this.theme.metalMid1}"/>
        <stop offset="50%" stop-color="${this.theme.metalMid2}"/>
        <stop offset="70%" stop-color="${this.theme.metalMid3}"/>
        <stop offset="100%" stop-color="${this.theme.metalEnd}"/>
      </linearGradient>
      <radialGradient id="beadGradient" cx="45%" cy="40%">
        <stop offset="0%" stop-color="${this.theme.beadInner}"/>
        <stop offset="50%" stop-color="${this.theme.beadMain}"/>
        <stop offset="100%" stop-color="${this.theme.beadEdge}"/>
      </radialGradient>
    </defs>`;
  }

  #frame(width, topY, botY){
    const fw = width - 20;
    return `
      <rect x="10" y="${topY}" width="${fw}" height="${this.metrics.topFrameHeight}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5"/>
      <rect x="15" y="${topY+3}" width="${fw-10}" height="4" fill="rgba(255,255,255,.15)" rx="2"/>

      <rect x="10" y="${botY}" width="${fw}" height="${this.metrics.bottomFrameHeight}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5"/>
      <rect x="15" y="${botY+3}" width="${fw-10}" height="4" fill="rgba(255,255,255,.15)" rx="2"/>

      <rect x="10" y="${topY+this.metrics.topFrameHeight}" width="10" height="${botY-(topY+this.metrics.topFrameHeight)}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5"/>
      <rect x="${width-20}" y="${topY+this.metrics.topFrameHeight}" width="10" height="${botY-(topY+this.metrics.topFrameHeight)}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5"/>
    `;
  }

  #rods(topY, botY){
    const rodTop = topY + this.metrics.topFrameHeight;
    const rodBottom = botY;
    let s='';
    for (let col=0; col<this.digitCount; col++){
      const x = this.columnStart + col*this.columnSpacing;
      s += `<line x1="${x}" y1="${rodTop}" x2="${x}" y2="${rodBottom}" stroke="${this.theme.rodColor}" stroke-width="${this.theme.rodWidth}"/>`;
    }
    return s;
  }

  #middle(width){
    const barTop = this.metrics.middleBarTop + this.currentOffsetY;
    const barLight= this.metrics.middleBarLightY + this.currentOffsetY;
    const barShadow= this.metrics.middleBarShadowY + this.currentOffsetY;
    const fw = width - 20;
    return `
      <rect x="10" y="${barTop}" width="${fw}" height="10" fill="url(#metalBarGradient)" rx="2"/>
      <rect x="15" y="${barLight}" width="${fw-10}" height="2" fill="rgba(255,255,255,.6)" rx="1"/>
      <rect x="10" y="${barShadow}" width="${fw}" height="2" fill="rgba(0,0,0,.3)" rx="1"/>
    `;
  }

  #dots(){
    const y = this.metrics.middleBarTop + this.currentOffsetY + 5;
    const unitsIndex = this.digitCount - this.decimalOffset - 1;
    let s='';
    for (let col=0; col<this.digitCount; col++){
      const d = unitsIndex - col;
      if (d<0) continue;
      if (d%4!==0) continue;
      const x = this.columnStart + col*this.columnSpacing;
      s += `<circle cx="${x}" cy="${y}" r="3" fill="${this.theme.woodTopGradientMid}"/>`;
    }
    return s;
  }

  #labels(topY){
    if (!this.showDigits) return '';
    const y = topY - 22;
    let s='';
    for(let col=0; col<this.digitCount; col++){
      const x = this.columnStart + col*this.columnSpacing;
      s += `<text x="${x}" y="${y}" fill="${this.theme.digitsColor}" font-size="32" font-weight="600" text-anchor="middle">${this.getColumnValue(col)}</text>`;
    }
    return s;
  }

  #beads(){
    let s='';
    for(let col=0; col<this.digitCount; col++){
      const x = this.columnStart + col*this.columnSpacing;
      const h=this.beadHeight, w=this.beadWidth, g=this.gapFromBar;
      const c=this.beads[col];

      const heavenY = (c.heaven==='down')
        ? (this.metrics.middleBarTop + this.currentOffsetY - h/2 - g)
        : (this.metrics.columnTopBase + this.currentOffsetY + h/2 + g);
      s += this.#bead(x,heavenY,w,h,col,'heaven',0);

      const upCount = c.earth.filter(p=>p==='up').length;
      const downCount = 4 - upCount;
      const positions = c.earth.map((p,idx)=>{
        if (p==='up'){
          const activeIndex = c.earth.slice(0,idx).filter(v=>v==='up').length;
          return this.metrics.earthActiveBase + this.currentOffsetY + h/2 + g + activeIndex*h;
        } else {
          const inactiveIndex = c.earth.slice(0,idx).filter(v=>v==='down').length;
          return this.metrics.baseBottomFrameY + this.currentOffsetY - h/2 - g - (downCount-1-inactiveIndex)*h;
        }
      });
      for(let i=0;i<4;i++){ s += this.#bead(x, positions[i], w, h, col, 'earth', i); }
    }
    return s;
  }

  #bead(x,y,w,h,col,type,index){
    const hh=h/2, cut=12, side=2;
    const path=`
      M ${x-cut} ${y-hh}
      L ${x+cut} ${y-hh}
      Q ${x+cut+2} ${y-hh+2} ${x+w-side} ${y-side}
      Q ${x+w} ${y} ${x+w-side} ${y+side}
      Q ${x+cut+2} ${y+hh-2} ${x+cut} ${y+hh}
      L ${x-cut} ${y+hh}
      Q ${x-cut-2} ${y+hh-2} ${x-w+side} ${y+side}
      Q ${x-w} ${y} ${x-w+side} ${y-side}
      Q ${x-cut-2} ${y-hh+2} ${x-cut} ${y-hh}
      Z`;
    return `<g data-role="bead" data-col="${col}" data-type="${type}" data-index="${index}">
      <path d="${path}" fill="url(#beadGradient)" filter="url(#beadShadow)"/>
      <line x1="${x-w}" y1="${y}" x2="${x+w}" y2="${y}" stroke="rgba(0,0,0,0.075)" stroke-width="2"/>
    </g>`;
  }
}
