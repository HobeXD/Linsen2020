var unitSets = [
  // main
[ [0], [1], [2], [4], [5],
  [10], [11], [12], [14], [15],
  [20], [21], [23], [24], [25],
  [50], [51], [52], [54], [55],
  [60], [61], [63], [64], [65],
  [70], [72], [73], [74], [75],
],
  // off
[ [2, 4], [2, 5],
  [10,15], [12,15],
  [21,23], [21,25],
  [50,55], [51,55], [52,55],
  [60,63], [60,65], [61,63], [61,65],
  [70,75], [73,75],
],
  // def
[ [0], [1], [0, 1],
  [11], [14], [11, 14],
  [20], [24], [25], [20, 24], [20, 25], [24, 25],
  [50], [54], [55], [50, 54], [50, 55],
  [60], [64],
  [72], [74],
  [1, 11], [11, 24], [20, 14], [51, 20], [60, 11], [60, 20],
],
  // animals
[ [30], [31], [32], [33], [34], [35], [36], [37], [38], [39]],
  // scouts
[ [3], [13], [22], [53], [62], [71]],
];
var maxBarracksEffect = Math.pow(0.9, 19);
var state = {
  s: getMyVersion(),
  params: 0,
  stat_sum: 0,
  lvl: 0,
  mode: 0,
  hd_lvl: 0,
  brew: 0,
  item: 0,
  func: 'cu/t'
};
$('server').value = state.s;
var version = parseVersion(state.s);

StateSaver.bind(state, {
  s: 's',
  params: 'i',
  stat_sum: 'i',
  lvl: 'i',
  mode: 'i',
  hd_lvl: 'i',
  brew: 'i',
  item: 'i',
  func: 's'
});
StateSaver.load(state);

function upkeep_hd(unit) {
  var hd_lvl = state.hd_lvl;
  return +(SERVER.hasHdp()
      &&((unit === 3 && hd_lvl >= 10)
      || (unit === 4 && hd_lvl >= 15)
      || (unit === 5 && hd_lvl >= 20)));
}

function build_time_cf(unit) {
  if (!SERVER.hasHdp()) return 1;
  if (unit === 3 || unit === 4 || unit === 5) {
    return g41_build_time(state.hd_lvl);
  } else {
    return 1;
  }
}

function calcDerivateValue(unitSet) {
  var sum_up = 0;
  var sum_cc = 0; // sum of upkeep*cost
  var stat_sum = this.stat_sum;
  var params = this.params;
  var lvl = this.lvl;
  unitSet.forEach(function (u, i) {
    var value = 0;
    var unit = getUnit(u);
    var k1_k2 = ((i >= 1) && (params & 4)) ? unit.time : 1; // percentage, based on building time
    var itemBonus = this.item * unit.cu * SERVER.hasItems();
    if (stat_sum & 1) {
      var off = Combat.upgrade(unit, 'off', lvl) + itemBonus;
      var tribe = Math.floor(u / 10);
      if (tribe === 1) off *= (1 + state.brew / 100);
      value += off;
    }
    if (stat_sum & 2) value += Combat.upgrade(unit, 'def_i', lvl) + itemBonus;
    if (stat_sum & 4) value += Combat.upgrade(unit, 'def_c', lvl) + itemBonus;
    if (stat_sum & 8) value += unit.cap;
    if (this.mode === 4) {
      if (stat_sum & 32) value += Combat.upgrade(unit, 'off_s', lvl);
      if (stat_sum & 64) value += Combat.upgrade(unit, 'def_s', lvl);
    }
    if (value === 0) value = 1;
    var time = Math.round(unit.time * maxBarracksEffect * build_time_cf(u));
    if (params & 4) value /= time / 3600;
    sum_up += value;
    sum_cc += ((params & 2) ? unit.cu - upkeep_hd(u) : 1)
            * ((params & 8) ? unit.cost.sum() : 1)
            / k1_k2;
  }, this);
  value = sum_up;
  if (params & 1) {
    var minSpeed = unitSet.reduce(function (a, u) {
      return Math.min(a, getUnit(u).speed);
    }, 100);
    value *= minSpeed / unitSet.length;
  }
  value /= sum_cc;
  return value;
}

function icon(cls) {
  return '<i' + 'mg src="img/x.gif" class="icon--scalable ' + cls + '">';
}

function getUnit(fullIdx) {
  var r = Math.floor(fullIdx / 10);
  var u = fullIdx % 10;
  return(units['t' + version.major + '.' + version.minor]
      || units['t' + version.major]
      || units)[r][u];
}

var uSet, values;

function group(items, joiner) {
  var text = items.join(joiner);
  return items.length >= 2 ? '(' + text + ')' : text;
}

function displayFormula() {
  return this.func
    // functions
    .replace(/sqrt\(([a-z]+)\)/g, "√$1")
    .replace(/sqrt/g, "√a")
    .replace(/cbrt\(([a-z]+)\)/g, "∛$1")
    .replace(/cbrt/g, "∛")
    .replace(/pow\(([a-z]+),([-\d.]+)\)/g, "$1<sup>$2</sup>")
    .replace(/pow\(([^,]+),([^)]+)\)/g, "($1)<sup>$2</sup>")
    .replace(/floor\(([^)]+)\)/g, "⎣$1⎦")
    .replace(/ceil\(([^)]+)\)/g, "⎡$1⎤")
    .replace(/abs\(([^)]+)\)/g, "|$1|")
    .replace(/log(\d+)\((\w+)\)/g, "log<sub>$1</sub>$2")
    .replace(/log(\d+)/g, "log<sub>$1</sub>")
    // variables
    .replace(/\b(cu|tc|di|dc|ds|ic|a|c|t|s|v)\b/g, "__$1")
    .replace(/__cu/g, icon('res r5'))
    .replace(/__tc/g, icon('res r6'))
    .replace(/__di/g, icon("stats def_i"))
    .replace(/__dc/g, icon("stats def_c"))
    .replace(/__ds/g, icon("stats def_s"))
    .replace(/__ic/g, icon("stats inv_cost"))
    .replace(/__v/g, icon('stats speed'))
    .replace(/__a/g, icon("stats att_all"))
    .replace(/__c/g, icon("stats cap"))
    .replace(/__t/g, icon("res r7"))
    .replace(/__s/g, icon("stats eye"))
    .replace(/\*/g, "&middot;");
}

var ERR;
var functions = 'abs|pow|sqrt|cbrt|min|max|round|floor|ceil|log|log2|log10';
var fnRe = new RegExp('\\b(' + functions + ')\\b', 'g');
var cleanRe = new RegExp(functions + '|[ \\d.+*/(),-]', 'g');

function calcFormula(unitSet) {
  var state = this;
  var item = this.item;
  ERR = '';
  return unitSet.reduce(function (sum, uIdx) {
    var unit = getUnit(uIdx);
    var time = Math.round(unit.time * maxBarracksEffect * build_time_cf(uIdx));
    var itemBonus = item * unit.cu * SERVER.hasItems();
    var ul = state.lvl;
    var stats = {
      v  : unit.speed,
      a  : Combat.upgrade(unit, 'off', ul) + itemBonus,
      di : Combat.upgrade(unit, 'def_i', ul) + itemBonus,
      dc : Combat.upgrade(unit, 'def_c', ul) + itemBonus,
      s  : Combat.upgrade(unit, 'scan', ul),
      ds : Combat.upgrade(unit, 'def_s', ul),
      c  : unit.cap,
      cu : unit.cu - upkeep_hd(uIdx),
      t  : time / 3600,
      tc : unit.cost.sum(),
    };
    if (state.mode !== 4) {
      stats.s = 0;
      stats.ds = 0;
    }
    // new RegExp('\\b(' + Object.keys(stats).sort().reverse().join('|') + ')\\b', 'g');
    var expr = state.func.replace(
      /\b(v|tc|t|s|dc|di|ds|cu|c|a)\b/g,
      function (name) { return stats[name]; }
    );
    expr = expr
      .replace(/(\d)kk/g, "$1000000")
      .replace(/(\d)k/g, "$1000")
      .replace(/[÷⁄]/g, '/')
      .replace(/[×·]/g, '*');
    var res = expr.replace(cleanRe, '');
    if (res !== '') {
      m = res.match(/\w+/);
      if (m) {
        ERR = 'I don\'t know name "' + m[0] + '"';
      } else {
        ERR = 'I don\'t know symbol "' + res[0] + '"';
      }
      return NaN;
    }
    expr = expr.replace(fnRe, 'Math.$1');
    try {
      new Function(expr);
    } catch (e) {
      ERR = 'I recognize all symbols, but the order is probably wrong. Did you write something like (a+b*)c?';
      return NaN;
    }
    try {
      return sum + eval(expr);
    } catch(e) {
      ERR = 'Unexpected error';
    }
  }, 0);
}

function displayParams() {
  var sum = [];
  if (this.mode !== 4) {
    if (this.stat_sum & 1) sum.push(icon('stats att_all'));
    if (this.stat_sum & 2) sum.push(icon('stats def_i'));
    if (this.stat_sum & 4) sum.push(icon('stats def_c'));
    if (this.stat_sum & 8) sum.push(icon('stats cap'));
  } else {
    if (this.stat_sum & 32) sum.push(icon('stats eye'));
    if (this.stat_sum & 64) sum.push(icon('stats def_s'));
  }
  
  var f = group(sum, ' + ');
  if (this.params & 1) {
    if (this.stat_sum) {
      f = icon('stats speed') + "&middot;" + f;
    } else {
      f = icon('stats speed');
    }
  }
  if (f === '') f = '1';
  var denominator = [];
  if (this.params & 2) denominator.push(icon('res r5'));
  if (this.params & 4) denominator.push(icon('res r7'));
  if (this.params & 8) denominator.push(icon('res r6'));
  if (denominator.length) {
    f += ' / ' + group(denominator, '&middot;');
  }
  return f;
}

function rebuildTable() {
  var f; // formula
  StateSaver.save();
  if (state.stat_sum & 16) {
    values = uSet.map(calcFormula, state);
    if (!state.func) {
      f = '\u26a0\ufe0f error';
      $('expression_error').innerHTML = 'Formula is empty';
    } else if (ERR) {
      f = '\u26a0\ufe0f error';
      $('expression_error').innerHTML = ERR;
    } else if (values.some(isNaN)) {
      f = displayFormula.call(state);
      $('expression_error').innerHTML = 'Formula is recognized, but gives invalid results';
    } else {
      f = displayFormula.call(state);
      $('expression_error').innerHTML = '';
    }    
  } else {
    values = uSet.map(calcDerivateValue, state);
    f = displayParams.call(state);
  }
  var topCells = xtable.rows[0].cells;
  topCells[topCells.length-1].innerHTML = f;
  var maxValue = Math.max.apply(null, values);
  var logScale = Math.max(2 - Math.floor(Math.log(maxValue) * Math.LOG10E), 0);
  while (logScale > 0 && values.every(function (value) {
    return /\.0+$/.test(value.toFixed(logScale));
  })) { logScale--; }
  values = values
    .map(function (v, i) {
      return { value: v, set: uSet[i] };
    })
    .sort(function (a, b) { return b.value - a.value; });
    //  print calculated array
  values.forEach(function (value, j) {
  var uSet = value.set;
  var xrow = xtable.rows[j+1];
  xrow.cells[0].innerHTML = uSet.map(function (uIdx) {
    return icon("unit u" + (uIdx+1));
  }).join(' ');
  xrow.cells[1].innerHTML = uSet.map(function (uIdx) {
    return names[uIdx];
  }).join(", ");
  xrow.className = 'tribe_' + (Math.floor(uSet[0] / 10) + 1);
  xrow.cells[2].innerHTML = isNaN(value.value)
    ? '\u2014' // em dash
    : value.value.toFixed(logScale);
  });
}

function prepareTable(mode) {
  if (mode !== undefined) {
    state.mode = mode;
    $('mode').value = mode;
  }
  if (state.mode == 4) {
    state.stat_sum &= 0x70;
  } else {
    state.stat_sum &= 0x1F;
  }
  updateStatsButtons();
  updateParamButtons();
  $$("[modes]").css('display', 'none');
  $$("[modes][modes*='" + state.mode + "']").css('display', '');
  while (xtable.rows[1]) {
    xtable.deleteRow(1);
  }
  uSet = unitSets[state.mode];
  if (version.major !== 4
  ||  (version.minor < 30 && version.minor !== 5)) {
    uSet = uSet.filter(function (us) {
      return us.every(function (u) {
        return u < 50;
      });
    });
  }
  for (var i = 0; i < uSet.length; i++) {
    var row = xtable.insertRow(1);
    row.height = 22;
    for (var j = 0; j < 3; j++) row.insertCell(0);
    row.cells[1].innerHTML = "&nbsp;";
    row.cells[0].style.whiteSpace = "nowrap";
  }
}

function updateExpr() {
  state.func = this.value;
  rebuildTable();
}

function updateStatsButtons() {
  $$(".layout__control [data-sum]").forEach(function (el) {
    el.classList.toggle('active', !!(el.dataset.sum & state.stat_sum));
  });
}
function updateParamButtons() {
  $$(".layout__control [data-params]").forEach(function (el) {
      el.classList.toggle('active', !!(el.dataset.params & state.params));
  });
}

updateStatsButtons();
updateParamButtons();
$$(".layout__control button").on('click', function (event) {
  this.classList.toggle('active');
  if (this.dataset.sum) {
    state.stat_sum = (state.stat_sum ^ this.dataset.sum) & this.dataset.mask;
    $('type_params').click();
  } else if (this.dataset.params) {
    state.params ^= this.dataset.params;
    $('type_params').click();
  }
});
$$('#predef').on('change', function () {
  $('type_predef').click();
  updateData(this.value);
});

if (state.stat_sum & 16) {
  $('type_formula').checked = true;
}

$('upg_value').innerHTML = $('upg').value = state.lvl;
$('upg').oninput = function () {
  $('upg_value').innerHTML = this.value;
  state.lvl = +this.value;
  rebuildTable();
};
$('hdp_value').innerHTML = $('hdp').value = state.hd_lvl;
$('hdp').oninput = function () {
  $('hdp_value').innerHTML = this.value;
  state.hd_lvl = +this.value;
  rebuildTable();
};
$('brew_value').innerHTML = $('brew').value = state.brew;
$('brew').oninput = function () {
  $('brew_value').innerHTML = this.value;
  state.brew = +this.value;
  rebuildTable();
};
$('item').value = state.item;
$('item').onchange = function () {
  state.item = this.value;
  rebuildTable();
};

var listeners = {
  mode: prepareTable,
  mask: function (value) {
    state.stat_sum &= value;
  },
  params: function (value) {
    state.params = value;
    updateParamButtons();
  },
  stat_sum: function (value) {
    state.stat_sum = value;
    updateStatsButtons();
  },
  upg: function(value) {
    $('upg').value = value;
    $('upg_value').innerHTML = value;
    state.lvl = value;
  },
  hdp: function(value) {
    $('hdp').value = value;
    $('hdp_value').innerHTML = value;
    state.hd_lvl = value;
  },
  brew: function(value) {
    value = Math.min(value, SERVER.breweryLevel());
    $('brew').value = value;
    $('brew_value').innerHTML = value;
    state.brew = value;
  },
  item: function (value) {
    $('item').value = value;
    state.item = value;
  }
};

function updateData(attr) {
  if (!attr) return;
  var data = JSON.parse(attr);
  for (var key in data) {
    var value = data[key];
    listeners[key](value);
  }
  rebuildTable();
}
document.querySelector('.layout').addEventListener('click', function (event) {
  updateData(event.target.dataset.set);
});
$('mode').addEventListener('change', function () {
  prepareTable(+this.value);
  rebuildTable();
});
$('mode').value = state.mode;

$('server').addEventListener('change', function () {
  version = parseVersion(state.s = this.value);
  $('hdp_wrap').style.display = SERVER.hasHdp() ? '' : 'none';
  $('item_wrap').style.display = SERVER.hasItems() ? '' : 'none';
  $('brew').style.display = SERVER.hasBrewery() ? '' : 'none';
  var max = SERVER.breweryLevel();
  $('brew').max = max;
  $('brew').nextElementSibling.innerHTML = max;
  $('brew').nextElementSibling.dataset.set = '{"brew":' + max + '}';
  state.brew = Math.min(state.brew, max);
  $('brew_value').innerHTML = state.brew;
  prepareTable();
  rebuildTable();
});
$('expression').value = state.func;
$('expression').oninput = updateExpr;
$('expression').onfocus = function () {
  $('type_formula').click();
};
$('type_formula').onclick = function () {
  state.stat_sum |= 16;
  rebuildTable();
};
$('type_params').onclick = function () {
  state.stat_sum &= ~16;
  rebuildTable();
};
$$('#type_predef').on('click', function () {
  updateData($('predef').value);
});
var xtable = $('war');
prepareTable();
rebuildTable();

var predef_buttons = $$("#predef_params .but");
var maxWidth = predef_buttons.reduce(function(max, elt) {
  return Math.max(max, elt.offsetWidth);
}, 0);
predef_buttons.forEach(function(elt){
  elt.style.display = 'block';
  elt.style.margin = '0 auto';
  elt.style.width = (maxWidth + 5) + 'px';
});
