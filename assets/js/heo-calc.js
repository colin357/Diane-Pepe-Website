/* Home Equity Optimizer savings calculator.
   Compares a traditional amortizing mortgage with a first-lien HELOC whose
   linked checking account is swept against the balance nightly.
   Same income and same spending in both scenarios. Illustration only. */
(function () {
  var root = document.querySelector("[data-heo-calc]");
  if (!root) return;

  var form = document.getElementById("heo-form");
  var $ = function (id) { return document.getElementById(id); };
  var MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var MAX_MONTHS = 50 * 12;

  var usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var usdShort = function (v) {
    var a = Math.abs(v);
    if (a >= 1e6) return "$" + (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (a >= 1e3) return "$" + Math.round(v / 1e3) + "K";
    return "$" + Math.round(v);
  };
  function num(name) {
    var v = parseFloat(form.elements[name].value);
    return isFinite(v) && v > 0 ? v : 0;
  }
  function duration(months) {
    var y = Math.floor(months / 12), m = months % 12, out = [];
    if (y) out.push(y + (y === 1 ? " yr" : " yrs"));
    if (m || !y) out.push(m + (m === 1 ? " mo" : " mos"));
    return out.join(" ");
  }

  // Traditional fixed-rate mortgage, standard monthly amortization.
  function traditional(bal, rate, years) {
    var n = Math.max(1, Math.round(years * 12));
    var r = rate / 100 / 12;
    var pmt = r ? bal * r / (1 - Math.pow(1 + r, -n)) : bal / n;
    var b = bal, interest = 0, series = [bal];
    for (var m = 1; m <= n; m++) {
      var i = b * r;
      interest += i;
      b = Math.max(0, b + i - pmt);
      series.push(b);
    }
    return { payment: pmt, months: n, interest: interest, series: series };
  }

  // Optimizer: daily simulation. Paychecks reduce the balance on payday,
  // spending is drawn evenly each day, interest accrues daily on the
  // positive balance and is added to the balance at month end.
  function optimizer(bal, rate, income, spend, freq, bonus) {
    var dr = rate / 100 / 365;
    var dailySpend = spend * 12 / 365;
    var b = bal, interest = 0, accrued = 0, series = [bal], day = 0;
    var limit = bal, overLimit = false;
    for (var m = 0; m < MAX_MONTHS; m++) {
      var dim = MONTH_DAYS[m % 12];
      for (var d = 1; d <= dim; d++, day++) {
        if (freq === "monthly" && d === 1) b -= income;
        else if (freq === "semimonthly" && (d === 1 || d === 15)) b -= income / 2;
        else if (freq === "biweekly" && day % 14 === 0) b -= income * 12 / 26;
        if (bonus && m % 12 === 11 && d === 15) b -= bonus;
        b += dailySpend;
        if (b > 0) accrued += b * dr;
      }
      b += accrued;
      interest += accrued;
      accrued = 0;
      // Credit limit is fixed for 10 years, then drops 1/240th per month.
      if (m >= 120) {
        var lim = limit * Math.max(0, 1 - (m - 119) / 240);
        if (b > lim + 1) overLimit = true;
      }
      if (b <= 0) { series.push(0); return { months: m + 1, interest: interest, series: series, overLimit: overLimit }; }
      series.push(b);
    }
    return { months: null, interest: interest, series: series, overLimit: overLimit };
  }

  function render() {
    var bal = num("balance"), years = Math.min(num("term") || 30, 40);
    var trate = num("trate"), hrate = num("hrate");
    var income = num("income"), spend = num("spend"), bonus = num("bonus");
    var freq = form.elements.freq.value;
    if (!bal) return;

    var t = traditional(bal, trate, years);
    var h = optimizer(bal, hrate, income, spend, freq, bonus);
    var note = $("r-note");
    var notes = [];

    $("r-t-pay").textContent = duration(t.months);
    $("r-t-int").textContent = usd.format(t.interest);
    $("r-t-pmt").textContent = usd.format(t.payment) + "/mo";

    if (h.months === null) {
      $("r-h-pay").textContent = "Not within 50 yrs";
      $("r-h-int").textContent = "—";
      $("r-time").textContent = "—";
      $("r-int").textContent = "—";
      $("r-time-sub").textContent = "";
      $("r-int-sub").textContent = "";
      notes.push("With these numbers, your monthly spending is close to or above your income, so deposits don’t outpace interest and the balance doesn’t fall. The Home Equity Optimizer™ works best when more comes in each month than goes out.");
    } else {
      var saved = t.months - h.months, intSaved = t.interest - h.interest;
      $("r-h-pay").textContent = duration(h.months);
      $("r-h-int").textContent = usd.format(h.interest);
      $("r-time").textContent = saved > 0 ? duration(saved) : "None";
      $("r-time-sub").textContent = saved > 0 ? "Paid off " + duration(h.months) + " from now instead of " + duration(t.months) : "Payoff isn’t faster with these numbers";
      $("r-int").textContent = intSaved > 0 ? usd.format(intSaved) : "None";
      $("r-int-sub").textContent = intSaved > 0 ? Math.round(intSaved / t.interest * 100) + "% less interest than the traditional loan" : "The traditional loan costs less with these numbers";
      if (saved <= 0 || intSaved <= 0) {
        notes.push("Your monthly surplus (" + usd.format(income - spend) + ") isn’t much larger than the traditional payment of " + usd.format(t.payment) + ", so the Optimizer doesn’t come out ahead here. It helps most when you regularly have money left over each month.");
      }
    }
    if (h.overLimit && h.months !== null) {
      notes.push("Heads up: after year 10 the credit limit starts stepping down each month, and with these numbers your balance would run above it at some point. You’d need to pay down more than this projection shows. Diane can walk through the details.");
    }
    note.hidden = !notes.length;
    note.textContent = notes.join(" ");

    drawChart(t.series, h.series);
    fillTable(t.series, h.series);
  }

  function fillTable(ts, hs) {
    var body = document.querySelector("#heo-table tbody");
    var len = Math.max(ts.length, hs.length) - 1;
    var rows = [];
    for (var m = 12; m <= len + 11; m += 12) {
      var i = Math.min(m, len);
      var tv = ts[Math.min(i, ts.length - 1)], hv = hs[Math.min(i, hs.length - 1)];
      rows.push("<tr><td>" + Math.ceil(i / 12) + "</td><td>" + usd.format(tv) + "</td><td>" + usd.format(hv) + "</td></tr>");
      if (i === len) break;
    }
    body.innerHTML = rows.join("");
  }

  // ---------- Chart (inline SVG, two lines, crosshair tooltip) ----------
  var plot = $("heo-chart");
  var W = 720, H = 300, P = { l: 56, r: 92, t: 12, b: 34 };
  var last = null;
  var state = null;

  function drawChart(ts, hs) {
    last = [ts, hs];
    W = Math.max(300, Math.min(720, Math.round(plot.clientWidth || 720)));
    H = W < 480 ? 240 : 300;
    P.r = W < 480 ? 78 : 92;
    P.l = W < 480 ? 46 : 56;
    var months = Math.max(ts.length, hs.length) - 1;
    var maxY = Math.max.apply(null, ts.concat(hs));
    var step = niceStep(maxY / 4);
    var top = Math.ceil(maxY / step) * step;
    var yrs = Math.ceil(months / 12);
    var xStep = yrs > 30 ? 10 : yrs > 12 ? (W < 480 ? 10 : 5) : yrs > 6 ? 2 : 1;
    var x = function (m) { return P.l + (m / Math.max(1, months)) * (W - P.l - P.r); };
    var y = function (v) { return P.t + (1 - v / top) * (H - P.t - P.b); };

    var grid = "", axis = "";
    for (var v = 0; v <= top + 1; v += step) {
      grid += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>';
      axis += '<text x="' + (P.l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + usdShort(v) + "</text>";
    }
    for (var yr = 0; yr <= yrs; yr += xStep) {
      var mm = Math.min(yr * 12, months);
      axis += '<text x="' + x(mm) + '" y="' + (H - P.b + 20) + '" text-anchor="middle">' + (yr === 0 ? "Today" : "Yr " + yr) + "</text>";
    }
    var path = function (s) {
      var d = "";
      for (var i = 0; i < s.length; i++) d += (i ? "L" : "M") + x(i).toFixed(1) + "," + y(s[i]).toFixed(1);
      return d;
    };
    // Direct end labels at each line's payoff point, nudged apart if they collide.
    var tEnd = x(ts.length - 1), hEnd = x(hs.length - 1);
    var tY = y(0) - 8, hY = y(0) - 8;
    var labels = "";
    if (Math.abs(tEnd - hEnd) < 70) { hY -= 16; }
    labels += '<text class="end-label" x="' + (hEnd + 6) + '" y="' + hY + '">Optimizer</text>';
    labels += '<text class="end-label" x="' + (tEnd + 6) + '" y="' + tY + '">Traditional</text>';

    plot.innerHTML =
      '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Line chart of loan balance over time. The traditional loan is paid off in ' +
      duration(ts.length - 1) + "; the Home Equity Optimizer in " + duration(hs.length - 1) + '.">' +
      '<g class="grid">' + grid + "</g>" +
      '<g class="axis">' + axis + "</g>" +
      '<path class="line line--trad" d="' + path(ts) + '"/>' +
      '<path class="line line--opt" d="' + path(hs) + '"/>' +
      labels +
      '<g class="hover" style="display:none"><line class="cross" y1="' + P.t + '" y2="' + (H - P.b) + '"/>' +
      '<circle class="dot dot--trad" r="5"/><circle class="dot dot--opt" r="5"/></g>' +
      '<rect x="' + P.l + '" y="' + P.t + '" width="' + (W - P.l - P.r) + '" height="' + (H - P.t - P.b) + '" fill="transparent" class="hit"/>' +
      "</svg>" +
      '<div class="chart__tip" hidden></div>';

    state = { ts: ts, hs: hs, months: months, x: x, y: y };
    var svg = plot.querySelector("svg");
    var hit = svg.querySelector(".hit");
    hit.addEventListener("pointermove", onMove);
    hit.addEventListener("pointerleave", onLeave);
  }

  function onMove(e) {
    var svg = plot.querySelector("svg");
    var r = svg.getBoundingClientRect();
    var sx = (e.clientX - r.left) * (W / r.width);
    var m = Math.round((sx - P.l) / (W - P.l - P.r) * state.months);
    m = Math.max(0, Math.min(state.months, m));
    var tv = state.ts[Math.min(m, state.ts.length - 1)], hv = state.hs[Math.min(m, state.hs.length - 1)];
    var g = svg.querySelector(".hover");
    g.style.display = "";
    var cx = state.x(m);
    var cross = g.querySelector(".cross");
    cross.setAttribute("x1", cx); cross.setAttribute("x2", cx);
    var dt = g.querySelector(".dot--trad"), dh = g.querySelector(".dot--opt");
    dt.setAttribute("cx", cx); dt.setAttribute("cy", state.y(tv));
    dh.setAttribute("cx", cx); dh.setAttribute("cy", state.y(hv));
    var tip = plot.querySelector(".chart__tip");
    tip.hidden = false;
    tip.innerHTML = "<b>" + (m === 0 ? "Today" : "After " + duration(m)) + "</b>" +
      '<span><i style="background:var(--heo-trad)"></i>Traditional: ' + usd.format(tv) + "</span><br>" +
      '<span><i style="background:var(--heo-opt)"></i>Optimizer: ' + usd.format(hv) + "</span>";
    var px = cx / W * r.width;
    var tw = tip.offsetWidth;
    var left = px + 14;
    if (left + tw > r.width) left = px - tw - 14;
    tip.style.left = Math.max(0, left) + "px";
    tip.style.top = Math.max(0, Math.min(state.y(Math.max(tv, hv)), H - 80) / H * r.height - 10) + "px";
  }
  function onLeave() {
    var g = plot.querySelector(".hover");
    if (g) g.style.display = "none";
    var tip = plot.querySelector(".chart__tip");
    if (tip) tip.hidden = true;
  }
  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    var n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (last) drawChart(last[0], last[1]); }, 150);
  });
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  render();
})();
