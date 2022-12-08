var c_stat;
function getUnit(r, u) {
  var v = parseVersion(state.s);
  return (units['t' + v.major + '.' + v.minor]
       || units['t' + v.major]
       || units)[r][u];
}
function getStats() {
  var stats = [
  [ getUnit(0, 0), getUnit(0, 2), getUnit(0, 4), getUnit(0, 5), getUnit(0, 6), getUnit(0, 7) ],
  [ getUnit(1, 0), getUnit(1, 2), getUnit(1, 4), getUnit(1, 5), getUnit(1, 6), getUnit(1, 7) ],
  [ getUnit(2, 0), getUnit(2, 1), getUnit(2, 3), getUnit(2, 5), getUnit(2, 6), getUnit(2, 7) ],
  [],
  [],
  [ getUnit(5, 0), getUnit(5, 2), getUnit(5, 4), getUnit(5, 5), getUnit(5, 6), getUnit(5, 7) ],
  [ getUnit(6, 0), getUnit(6, 1), getUnit(6, 3), getUnit(6, 5), getUnit(6, 6), getUnit(6, 7) ],
  [ getUnit(7, 0), getUnit(7, 3), getUnit(7, 4), getUnit(7, 5), getUnit(7, 6), getUnit(7, 7) ],
  ];
  stats[1][2].idx = -1;
  stats[2][0].idx = -1;
  // stats[5][0].idx = -1;
  stats[5][2].idx = -1;
  return stats;
}

var state = {
  b: [20,0,20,0,0],
  p: [0,0,0],
  r: 1,
  t: 1,
  s: getMyVersion(),
  h: 0,
  br: 0,
  po: true,
  hb: 0,
  art: 100,
  ac: 0,
  hm: [0,0],
  rb: 0,
  w: 0
};
var sliders = [null, null, null, null];
var b_names = ['b','gb','s','gs','ws'];
var building_lvl_inputs;
function createSlider(id, p_idx) {
  var _el = $(id);
  _el.addEventListener('input', function () {
    /*_el.querySelector('.left > :first-child').innerHTML = (100-value) + '/';
    _el.querySelector('.right > :first-child').innerHTML = value; */
    state.p[p_idx] = this.value;
    update_all_stats();
  });
  _el.addEventListener('change', function () {
    StateSaver.save();
  });
  return {
    set: function (value) {
      _el.value = value;
      state.p[p_idx] = value;
      StateSaver.save();
      update_all_stats();
    }
  };
}
function createArtSlider(id) {
  var _el = $(id);
  _el.addEventListener('input', function () {    
    state.art = this.value;
    update_all_stats();
  });
  _el.addEventListener('change', function () {
    StateSaver.save();
  });
  return {
    set: function (value) {
      _el.value = value;
      state.art = value;
      StateSaver.save();
      update_all_stats();
    }
  };
}

function set_inf(value) {
  state.hm[0] = value;
  update_all_stats();
  StateSaver.save();
}
function set_cav(value) {
  state.hm[1] = value;
  update_all_stats();
  StateSaver.save();
}

window.addEventListener('DOMContentLoaded', function(){
  // model init
  var timeScales = $$("#time option").map(function (e) { return +e.value; });
  
  // Create a new slider instance
  sliders[0] = createSlider('inf_slider', 0, 'i');
  sliders[1] = createSlider('cav_slider', 1, 'c');
  sliders[2] = createSlider('siege_slider', 2, 's');
  sliders[3] = createArtSlider('artifact_slider');
  $('i0').  addEventListener('click', function() { sliders[0].set(0); });
  $('i100').addEventListener('click', function() { sliders[0].set(100); });
  $('c0').  addEventListener('click', function() { sliders[1].set(0); });
  $('c100').addEventListener('click', function() { sliders[1].set(100); });
  $('s0').  addEventListener('click', function() { sliders[2].set(0); });
  $('s100').addEventListener('click', function() { sliders[2].set(100); });
  // init building lvls array
  building_lvl_inputs = $$('input.building_lvl');
  // init selects and event handlers
  building_lvl_inputs.on('input', update_build_speed);
  b_names.forEach(function(id){
    id = 'b_' + id;
    $$('.' + id).on('click', function () {
      $(id).value = this.textContent.trim();
      update_build_speed();
    });
  });
  $('race').addEventListener('change', function() {
    update_race();
    StateSaver.save();
  });
  function general_update() {
    update_all_stats();
    StateSaver.save();
  }
  $('times').addEventListener('input', general_update);
  $('time').addEventListener('change', general_update);
  $('art_speed_up').addEventListener('change', general_update);
  $('hero_bonus').addEventListener('input', function () {
    var value = parseInt(this.value, 10) || 0;
    value = Math.max(0, Math.min(value, 100));
    if (this.value != value) this.value = value;
    state.hb = value;
    update_all_stats();
    StateSaver.save();
  });
  $('server').addEventListener('change', function() {
    serverChange(this.value);
  });
  $('b_hd').addEventListener('change', function() {
    state.h = parseInt(this.value, 10);
    update_build_speed();
    StateSaver.save();
  });
  $('b_br').addEventListener('change', function() {
    state.br = parseInt(this.value, 10);
    update_all_stats();
    StateSaver.save();
  });
  $$('.b_hd').on('click', function() {
    val = this.innerHTML;
    var elt = $('b_hd');
    elt.value = isNaN(val) ? "0" : val;
    state.h = parseInt(elt.value, 10);
    update_build_speed();
    StateSaver.save();
  });
  $$('.b_br').on('click', function() {
    val = this.innerHTML;
    var elt = $('b_br');
    elt.value = isNaN(val) ? "0" : val;
    state.br = parseInt(elt.value, 10);
    update_all_stats();
    StateSaver.save();
  });
  $('recruit').addEventListener('change', function() {
    state.rb = +this.value;
    update_all_stats();
    StateSaver.save();
  });
  $$('.weapon').on('change', function() {
    state.w = this.selectedIndex;
    $('weaponIcon').className = this.value
      ? "icon--scalable unit u" + (+this.value.split(':')[0] + 1)
      : "icon--scalable itemCategory itemCategory_rightHand";
    update_all_stats();
    StateSaver.save();
  });

  // Create and init state object
  StateSaver.bind(state, {
    b: 'a',
    p: 'a',
    r: 'i',
    t: 'i',
    s: 's',
    h: 'i',
    br: 'i',
    po: 'b',
    hb: 'i',
    art: 'i',
    ac: 'i',
    hm: 'a',
    rb: 'i',
    w: 'i'
  });
  StateSaver.load();
  
  // Set switchers to proper states
  $('art_speed_up').value = state.ac;
  // init times
  var i = 0;
  for (var j = 0; j < timeScales.length; j++) {
    if (state.t % timeScales[j] === 0) {
      i = j;
    }
  }
  while  ((i < timeScales.length) &&
      (state.t > 9999*timeScales[i])) { i++; }
  if (state.t > 9999*timeScales[i]) state.t = 9999*timeScales[i];
  $('times').value = Math.round(state.t / timeScales[i]);
  $('time').value = timeScales[i];
  
  
  for (var sl=0; sl<3; sl++) sliders[sl].set(state.p[sl]);
  sliders[3].set(state.art);
  building_lvl_inputs.forEach(function(elt) {
    elt.value = state.b[b_names.indexOf(elt.id.replace('b_', ''))];
  });
  $('server').value = state.s;
  $('hero_bonus').value = state.hb;
  $('race').value = state.r;
  $('recruit').value = state.rb;
  $('inf_helmet').value = state.hm[0];
  $('cav_helmet').value = state.hm[1];
  
  update_race();
  serverChange(state.s);
});

function optimal_build(data) {
  var a, b, g, d;
  if (!("t" in data)) { data.t = 1; }
  var result = { amnt:[0,0], cost:[0,0] };
  if (!data.t11 && !data.t12 &&
    !data.t21 && !data.t22) return result;
  
  if (!data.p2) {
    if (data.t11) {
      result.amnt[0] += data.t/data.t11;
      result.cost[0] += data.t/data.t11;
    }
    if (data.t12) {
      result.amnt[0] += data.t/data.t12;
      result.cost[0] += 3*data.t/data.t12;
    }
    return result;
  }
  if (!data.p1) {
    if (data.t21) {
      result.amnt[1] += data.t/data.t21;
      result.cost[1] += data.t/data.t21;
    }
    if (data.t22) {
      result.amnt[1] += data.t/data.t22;
      result.cost[1] += 3*data.t/data.t22;
    }
    return result;
  }
  if (!data.t12 && !data.t22) {
    g = (data.p1*data.t11 + data.p2*data.t21) / data.t;
    a = data.p1 / g;
    b = data.p2 / g;
    return { amnt:[a,b], cost:[a,b] };
  }
  if (!data.t11 && !data.t21) {
    g = (data.p1*data.t12 + data.p2*data.t22) / data.t;
    a = data.p1 / g;
    b = data.p2 / g;
    return { amnt:[a,b], cost:[3*a,3*b] };
  }
  if (data.t11 * data.p2 > data.t22 * data.p1) {
    a = data.t12*data.p1 + data.t22*data.p2;
    b = data.t11*data.p1 - data.t22*data.p2;
    g = data.p2 * (data.t11 + data.t12);
    d = a * data.t11 / data.t;
    a /= d;
    b /= d;
    g /= d;
    return { amnt: [a+b, g], cost: [a+3*b, 3*g], internal: [a, b, 0, g] };
  } else {
    a = data.p1 * (data.t21 + data.t22);
    b = data.t22*data.p2 - data.t11*data.p1;
    g = data.t11*data.p1 + data.t21*data.p2;
    d = g * data.t22 / data.t;
    a /= d;
    b /= d;
    g /= d;
    return { amnt: [a, b+g], cost: [a, b+3*g], internal: [a, 0, b, g] };
  }
}

function lvl_time(lvl) {
  if (lvl === 0) return 0;
  var fullBuilds = Math.floor(lvl / 20);
  var lastLvl = lvl % 20;
  return 1 / (fullBuilds * Math.pow(0.9, -19)
       + (lastLvl ? Math.pow(0.9, 1-lastLvl) : 0));
}

function horsedrinker_applies() {
  return (state.r == 1) && SERVER.hasHdp();
}

function brewery_applies() {
  return (state.r == 2) && SERVER.hasBrewery();
}

function _specials() {
  $('horsedrinker').style.display = 
    horsedrinker_applies() ? 'block' : 'none';
  $('brewery').style.display = 
    brewery_applies() ? 'block' : 'none';
  var bl = SERVER.breweryLevel();
  var input = $$('#brewery input')[0];
  $$('#brewery .but')[1].innerHTML = bl;
  var max = +input.max;
  if (state.br > bl) {
    state.br = bl;
    input.max = bl;
    input.value = bl;
  } else if (max < bl && state.br === max) {
    state.br = bl;
    input.max = bl;
    input.value = bl;
  } else {
    input.max = bl;
  }
}


function serverChange(serv_type) {
  SERVER.setVersion(serv_type);
  var display = SERVER.hasHeroes() ? '' : 'none';
  $('army').rows[0].cells[8].style.display = display;
  $('army').rows[1].cells[8].style.display = display;
  
  state.s = serv_type;
  _specials();
  $('art_holder').style.display = SERVER.hasArtifacts() ? '' : 'none';
  $('t4_items').style.display = SERVER.hasItems() ? '' : 'none';
  $$('#race option.mode4').prop('disabled', !SERVER.hasExtraRaces());
  $('recruit_wrap').style.display = SERVER.hasAllianceBoni() ? '' : 'none';
  update_build_speed();
}

function update_build_speed() {
  building_lvl_inputs.forEach(function (elt) {
    state.b[b_names.indexOf(elt.id.replace('b_', ''))] = parseInt(elt.value, 10);
  });
  update_all_stats();
  StateSaver.save();
}

function update_img(images, n) {
  if (c_stat[n].idx != -1) {
    var uIdx = parseInt(c_stat[n].idx, 10);
    var race = state.r - 1;
    images[n].className = "icon--scalable unit u" + (race*10 + uIdx + 1) + ' click';
    images[n].style.display = '';
    images[n].alt = units[race][uIdx].name;
    return true;
  } else {
    images[n].style.display = 'none';
    return false;
  }
}

function update_race() {
  $$(".weapon[race='" + (state.r - 1) + "']").css('display', 'none');
  state.r = $('race').value;
  $$(".weapon[race='" + (state.r - 1) + "']").css('display', '');
  _specials();
  c_stat = getStats()[state.r-1];
  var images = $$('.content img.unit');
  for(var unit_type = 0; unit_type < 3; unit_type++) {
    var i0 = update_img(images, unit_type*2+0, true);
    var i1 = update_img(images, unit_type*2+1, true);
    $$('.slider')[unit_type].style.display = i0 && i1 ? '' : 'none';
    if (!i0) sliders[unit_type].set(100);
    if (!i1) sliders[unit_type].set(0);
  }
  var xrow = $('army').rows[0].cells;
  for (var u = 0; u < 8; u++) {
    var img = xrow[u].firstChild;
    img.className = "icon--scalable unit u" + (state.r * 10 + u - 9);
    img.alt = units[state.r - 1][u].name;
    img.parentNode.setAttribute('title', units[state.r - 1][u].name);
  }
  update_all_stats();
}

function getOff(stats) {
  return Combat._std_upg(stats.off, stats.cu * (1 + SERVER.doubleUpgrades()), 20, state.s);
}

function build_hash(amounts) {
  var hash = "a:r" + (state.r - 1);
  var units_hash = ["", "", "", "", "", "", "", ""];
  for (var ut = 0; ut < 6; ut++) {
    var currentUnitIndex = c_stat[ut].idx;
    if (currentUnitIndex !== -1) {
      units_hash[currentUnitIndex] = Math.round(amounts[ut]);
    }
  }
  units_hash = units_hash.map(function (v) { return v || ""; });
  hash += "u" + units_hash.join(",").replace(/,+$/, "");
  hash += "U!20";
  if (SERVER.hasHeroes()) {
    hash += "h";
    if (state.hb) {
      hash += "0,0," + state.hb + ",100";
    }
  }
  return hash;
}

function update_all_stats() {
  // time
  state.t = $('time').value
          * $('times').value;
  /*var tdim = t.options[t.selectedIndex].innerHTML;
  sliders[3].knob.querySelector('.middle').innerHTML =
    ($('times').value * state.art / 100).toFixed(2) + " " + tdim; */
  state.ac = $('art_speed_up').value;
  // all stats
  c_stat = getStats()[state.r-1];
  SERVER.setVersion(state.s);
  var spd = SERVER.v.speed;
  var buildSpeeds = {
    infantry: spd,
    cavalry: spd,
    siege: spd
  };
  // speed modifiers
  if (SERVER.hasArtifacts()) {
    var ap = state.art / 100;
    ax = 4 / (4 - state.ac);
    ax = 1 * (1 - ap) + ax * ap; 
    Object.keys(buildSpeeds).forEach(function (k) {
      buildSpeeds[k] *= ax;
    });
  }
  var data = {
    cost: [0, 0, 0, 0],
    cu:  0, cu2: 0,
    off: 0, off_c: 0, off_i: 0
  };
  
  var weaponBonus = [0,0,0,0,0,0,0,0];
  weaponBonus['-1'] = 0;
  if (horsedrinker_applies()) {
    buildSpeeds.cavalry /= g41_build_time(state.h);
  }
  if (SERVER.hasItems()) {
    buildSpeeds.infantry /= (1 - state.hm[0]/100);
    buildSpeeds.cavalry  /= (1 - state.hm[1]/100);
    // determine boni
    val = $$(".weapon[race='" + (state.r-1) + "']")[0].value;
    if (val && (m = val.match(/^(\d):(\d+)$/))) {
      weaponBonus[m[1]] = parseInt(m[2], 10);
    }
  }
  if (SERVER.hasAllianceBoni()) {
    var recruitment = 1 - state.rb / 100;
    Object.keys(buildSpeeds).forEach(function (k) {
      buildSpeeds[k] /= recruitment;
    });
  }
  var miscBoni = 1;
  if (SERVER.hasHeroes()) {
    miscBoni *= (1 + state.hb / 500);
  }
  if (brewery_applies()) {
    miscBoni *= (1 + state.br / 100);
  }

  var amounts = [0,0,0,0,0,0];
  // dirty hack: "great workshop"
  state.b[5] = 0;
  Object.keys(buildSpeeds).forEach(function (type, i) {
    var p = state.p[i] / 100;
    var t0 = 2 * i,
      t1 = 2 * i + 1;
  /*  calculate optimal build */
    var buildData = optimal_build({
      p1: 1-p,
      p2: p,
      t11: Math.round(c_stat[t0].time / buildSpeeds[type] * lvl_time(+state.b[t0])),
      t12: Math.round(c_stat[t0].time / buildSpeeds[type] * lvl_time(+state.b[t1])),
      t21: Math.round(c_stat[t1].time / buildSpeeds[type] * lvl_time(+state.b[t0])),
      t22: Math.round(c_stat[t1].time / buildSpeeds[type] * lvl_time(+state.b[t1])),
      t: state.t * 3600
    });
    amounts[t0] = buildData.amnt[0];
    amounts[t1] = buildData.amnt[1];
  /*  cost */
    for (var r = 0; r < 4; r++) {
      data.cost[r] +=
        buildData.cost[0] * c_stat[t0].cost[r] +
        buildData.cost[1] * c_stat[t1].cost[r];
    }
  /*  upkeep */
    data.cu += 
      buildData.amnt[0] * c_stat[t0].cu +
      buildData.amnt[1] * c_stat[t1].cu;
    if ((type === 'cavalry') && horsedrinker_applies()) { // cavalry
      if (state.h >= 15) data.cu -= buildData.amnt[0];
      if (state.h >= 20) data.cu -= buildData.amnt[1];
    }
  /*  off points */
    var s1 = c_stat[t0],
      s2 = c_stat[t1],
      off = buildData.amnt[0] * (getOff(s1) + weaponBonus[s1.idx])
        + buildData.amnt[1] * (getOff(s2) + weaponBonus[s2.idx]);
    off *= miscBoni;
    data.off += off;
    // proper type of attack
    var attackType = { infantry: 'i', cavalry: 'c', siege: 'i' }[type];
    data['off_' + attackType] += off;
  });
  state.b.push();
  out_stats(data);
  var xrow = $('army').rows[1].cells;
  for (var u = 0; u < 8; u++) {
    xrow[u].innerHTML = 0;
    xrow[u].className = "c";
  }
  c_stat.forEach(function (unit, ut) {
    var val;
    var currentUnitIndex = unit.idx;
    if (currentUnitIndex === -1) { return; }
    val = Math.round(amounts[ut]);
    xrow[currentUnitIndex].innerHTML = val;
    xrow[currentUnitIndex].className = val == "0" ? "c" : "";
  });

  $('warsim').href = "warsim2.php#" + build_hash(amounts) + "#";
}
function out_stats(data) {
  var xtable = $('result');
  var sum = 0;
  for (var r = 0; r < 4; r++) {
    sum += data.cost[r];
    xtable.rows[r].cells[1].innerHTML = Math.round(data.cost[r]).toLocaleString();
  }
  xtable.rows[4].cells[1].innerHTML = Math.round(sum).toLocaleString();
  xtable.rows[5].cells[1].innerHTML = Math.round(sum / state.t).toLocaleString();

  xtable.rows[7].cells[1].innerHTML = Math.round(data.off_i).toLocaleString();
  xtable.rows[8].cells[1].innerHTML = Math.round(data.off_c).toLocaleString();
  xtable.rows[9].cells[1].innerHTML = Math.round(data.off).toLocaleString();
  var heroUpkeep = SERVER.hasHeroes() ? 6 : 0;
  xtable.rows[10].cells[1].innerHTML =
    Math.round(data.cu  + heroUpkeep).toLocaleString();
}
