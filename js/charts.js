/* charts.js - the two charts the dashboard uses, drawn as inline SVG / DOM.
   Marks follow one spec: <=24px bars, 4px rounded data-end, square baseline,
   2px surface gap between neighbours, hairline solid grid, one series = one hue,
   selective direct labels, and a hover/focus tooltip on every mark. */
(function (global) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVG_NS, name);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(node);
    return node;
  }

  function niceMax(v) {
    if (!isFinite(v) || v <= 0) return 100;
    var exp = Math.floor(Math.log10(v));
    var base = Math.pow(10, exp);
    var steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
    for (var i = 0; i < steps.length; i++) {
      if (v <= steps[i] * base * 1.0001) return steps[i] * base;
    }
    return 10 * base;
  }

  function barPath(x, y, w, h, r) {
    // square at the baseline, rounded at the data end
    r = Math.max(0, Math.min(r, w / 2, h));
    var bottom = y + h;
    return 'M' + x + ' ' + bottom +
           'L' + x + ' ' + (y + r) +
           'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y +
           'L' + (x + w - r) + ' ' + y +
           'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) +
           'L' + (x + w) + ' ' + bottom + 'Z';
  }

  function tooltipFor(container) {
    var tip = container.querySelector('.viz-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'viz-tip';
      tip.setAttribute('role', 'status');
      tip.hidden = true;
      container.appendChild(tip);
    }
    return tip;
  }

  function showTip(container, tip, html, x, y) {
    tip.innerHTML = html;
    tip.hidden = false;
    var cw = container.clientWidth;
    var tw = tip.offsetWidth;
    var left = Math.min(Math.max(4, x - tw / 2), Math.max(4, cw - tw - 4));
    tip.style.left = left + 'px';
    tip.style.top = Math.max(0, y) + 'px';
  }

  /**
   * Daily-spend columns.
   * opts: {data:[{key,total,short,isToday}], limit, fmt, fmtAxis, dayLabel, height}
   */
  function columns(container, opts) {
    var data = opts.data || [];
    container.innerHTML = '';
    var tip = tooltipFor(container);
    tip.hidden = true;

    var W = Math.max(240, container.clientWidth || 320);
    var plotH = opts.height || 150;
    var axisH = 20;
    var H = plotH + axisH;

    var maxVal = data.reduce(function (m, d) { return Math.max(m, d.total); }, 0);
    var top = niceMax(Math.max(maxVal, opts.limit || 0) * 1.05);
    var ticks = [0, top / 2, top];
    var axisLabels = ticks.map(function (t) { return opts.fmtAxis(t); });
    var padL = Math.min(80, Math.max(30, axisLabels.reduce(function (m, s) { return Math.max(m, s.length); }, 0) * 7.2 + 8));
    var padR = 6;
    var padT = 14;
    var innerW = Math.max(40, W - padL - padR);
    var innerH = plotH - padT;
    var baseY = padT + innerH;

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: H,
      role: 'img', 'aria-label': opts.ariaLabel || 'Daily spending chart'
    }, container);

    // gridlines + y ticks (hairline, solid, recessive)
    ticks.forEach(function (t, i) {
      var y = baseY - (t / top) * innerH;
      el('line', {
        x1: padL, x2: W - padR, y1: y, y2: y,
        class: i === 0 ? 'viz-baseline' : 'viz-grid'
      }, svg);
      var label = el('text', {
        x: padL - 6, y: y + 4, class: 'viz-tick', 'text-anchor': 'end'
      }, svg);
      label.textContent = axisLabels[i];
    });

    var n = data.length || 1;
    var band = innerW / n;
    var gap = 2;                                   // surface gap between neighbours
    var barW = Math.max(3, Math.min(24, band - gap));

    // daily-limit threshold line (not a gridline: it is a value the reader compares against).
    // It is named in the card subtitle, so no inline label can collide with a tall column.
    if (opts.limit > 0 && opts.limit <= top) {
      var ly = baseY - (opts.limit / top) * innerH;
      el('line', { x1: padL, x2: W - padR, y1: ly, y2: ly, class: 'viz-threshold' }, svg);
    }

    data.forEach(function (d, i) {
      var cx = padL + band * i + band / 2;
      var x = cx - barW / 2;
      var h = top > 0 ? (d.total / top) * innerH : 0;
      if (d.total > 0) h = Math.max(h, 2);
      var y = baseY - h;

      if (h > 0) {
        el('path', {
          d: barPath(x, y, barW, h, 4),
          class: 'viz-bar' + (d.isToday ? ' is-today' : '')
        }, svg);
      }

      // x-axis label
      var xl = el('text', { x: cx, y: H - 6, class: 'viz-tick', 'text-anchor': 'middle' }, svg);
      xl.textContent = d.short;

      // selective direct label: only today's column carries its value
      if (d.isToday && d.total > 0) {
        var vl = el('text', {
          x: cx, y: Math.max(10, y - 6), class: 'viz-value', 'text-anchor': 'middle'
        }, svg);
        vl.textContent = opts.fmtAxis(d.total);
      }

      // hit target: the whole band, so a thin bar is still easy to tap
      var hit = el('rect', {
        x: padL + band * i, y: padT, width: band, height: innerH,
        class: 'viz-hit', tabindex: '0', role: 'button',
        'aria-label': opts.dayLabel(d.key) + ': ' + opts.fmt(d.total)
      }, svg);
      var html = '<strong>' + opts.fmt(d.total) + '</strong><span>' + opts.dayLabel(d.key) + '</span>';
      function show() {
        var scale = (container.clientWidth || W) / W;
        showTip(container, tip, html, cx * scale, Math.max(0, (y - 44) * scale));
      }
      hit.addEventListener('pointerenter', show);
      hit.addEventListener('focus', show);
      hit.addEventListener('pointerleave', function () { tip.hidden = true; });
      hit.addEventListener('blur', function () { tip.hidden = true; });
      hit.addEventListener('click', function () { show(); if (opts.onPick) opts.onPick(d); });
    });
  }

  /**
   * Ranked horizontal bars (one series, value at the tip).
   * opts: {data:[{id,name,icon,total,pct}], fmt, max}
   */
  function rankedBars(container, opts) {
    container.innerHTML = '';
    var data = opts.data || [];
    var max = opts.max || data.reduce(function (m, d) { return Math.max(m, d.total); }, 0) || 1;
    var list = document.createElement('ul');
    list.className = 'rank';
    data.forEach(function (d) {
      var li = document.createElement('li');
      li.className = 'rank-row';

      var head = document.createElement('div');
      head.className = 'rank-head';
      var name = document.createElement('span');
      name.className = 'rank-name';
      name.textContent = (d.icon ? d.icon + ' ' : '') + d.name;
      var val = document.createElement('span');
      val.className = 'rank-val';
      val.textContent = opts.fmt(d.total);
      head.appendChild(name);
      head.appendChild(val);

      var track = document.createElement('div');
      track.className = 'rank-track';
      var fill = document.createElement('div');
      fill.className = 'rank-fill';
      fill.style.width = Math.max(1.5, (d.total / max) * 100) + '%';
      track.appendChild(fill);
      track.setAttribute('role', 'img');
      track.setAttribute('aria-label', d.name + ': ' + opts.fmt(d.total) +
        (d.pct ? ', ' + Math.round(d.pct) + '% of the total' : ''));

      var sub = document.createElement('div');
      sub.className = 'rank-sub';
      sub.textContent = Math.round(d.pct) + '%';

      li.appendChild(head);
      li.appendChild(track);
      li.appendChild(sub);
      list.appendChild(li);
    });
    container.appendChild(list);
  }

  /** Re-render a chart when its container is resized (orientation change, keyboard). */
  function responsive(container, draw) {
    draw();
    if (!global.ResizeObserver) return;
    if (container.__ro) container.__ro.disconnect();
    var last = container.clientWidth;
    var ro = new ResizeObserver(function () {
      var w = container.clientWidth;
      if (Math.abs(w - last) > 8) { last = w; draw(); }
    });
    ro.observe(container);
    container.__ro = ro;
  }

  global.Charts = { columns: columns, rankedBars: rankedBars, responsive: responsive };
})(window);
