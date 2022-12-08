/*global $: false, $$: false */
var Warsim = (function (i18n) {
'use strict';

/**
 * @singleton Input
 * contains factory method for wrapping input elements
 */
var Input = (function () {
  var getValue = function () { return +this.elt.value || 0; },
      setValue = function (value) { this.elt.value = value; },
      getChecked = function () { return this.elt.checked; },
      setChecked = function (checked) { this.elt.checked = checked; },
      getIndex = function () { return this.elt.selectedIndex; },
      setIndex = function (idx) { if (idx !== "") { this.elt.selectedIndex = idx; } },
      getRadio = function () { return [].filter.call(function (elt) { return elt.checked; }, this.elt)[0].value; },
      setRadio = function (value) { [].filter.call(function (elt) { return elt.value === value; }, this.elt)[0].checked = true; },
      getRePartBool = function (name) { return "("+name+")?"; },
      getRePartDecimal = function (name) { return "(?:"+name+"([\\d-]+))?"; },
      instances = null;
  
  function InputWrapper() {}
  InputWrapper.prototype = {
    getValue: getValue,
    setValue: setValue,
    getState: getValue,
    setState: setValue,
    getREpart: getRePartDecimal
  };
  
  function SelectWrapper() {}
  SelectWrapper.prototype = {
    getValue: getValue,
    setValue: setValue,
    getState: getIndex,
    setState: setIndex,
    getREpart: getRePartDecimal
  };
  
  function RadioWrapper() {}
  CheckboxWrapper.prototype = {
    getValue: getRadio,
    setValue: setRadio,
    getState: getRadio,
    setState: setRadio,
    getREpart: getRePartBool
  };

  function CheckboxWrapper() {}
  CheckboxWrapper.prototype = {
    getValue: getChecked,
    setValue: setChecked,
    getState: function () { return ""; },
    setState: setChecked,
    getREpart: getRePartBool
  };
  
  function MultiInputsWrapper() {}
  MultiInputsWrapper.prototype.getValue = function () {
    return this.elts.map(function(elt){
      return Input.wrap(elt).getValue();
    });
  };
  MultiInputsWrapper.prototype.getState = function () {
    return this.elts.map(function(elt){
      return Input.wrap(elt).getState();
    });
  };
  MultiInputsWrapper.prototype.setValue = function (values) {
    this.elts.forEach(function(elt, idx){
      Input.wrap(elt).setValue(values.length ? (values[idx] || "") : values);
    });
  };
  MultiInputsWrapper.prototype.setState = function (values) {
    this.elts.forEach(function(elt, idx){
      Input.wrap(elt).setState(values.length ? (values[idx] || "") : values);
    });
  };
  MultiInputsWrapper.prototype.getREpart = function(name) { return "(?:" + name + "([,\\dkM-]*))?"; };
  
  instances = {
    input: new InputWrapper(),
    select: new SelectWrapper(),
    checkbox: new CheckboxWrapper(),
    multi: new MultiInputsWrapper(),
    radio: new RadioWrapper()
  };

  function getWrapper(elt) {
    if (elt.tagName !== "INPUT") { return instances.select; }
    if (elt.type === "radio") { return instances.radio; }
    if (elt.type === "checkbox") { return instances.checkbox; }
    return instances.input;
  }
  
  return {
    wrap: function (elts) {
      var wrapper;
      if (!(elts instanceof Array)
      ||  elts[0].type === 'radio') {
        wrapper = getWrapper(elts);
        wrapper.elt = elts;
        return wrapper;
      }
      if (elts.length === 1) {
        wrapper = getWrapper(elts[0]);
        wrapper.elt = elts[0];
        return wrapper;
      }
      wrapper = instances.multi;
      wrapper.elts = elts;
      return wrapper;
    }
  };
})();

/**
 * @class FormWrapper
 * flyweight for parsing parts of input
 */
function FormWrapper(inputDetails, prefix) {
  this.prefix = prefix || "";
  this.inputDetails = inputDetails || [];
}

FormWrapper.prototype.getElts = function getElts(selector) {
  return [].slice.call(this.container.querySelectorAll(selector));
};

FormWrapper.prototype.adopt = function adopt(container) {
  this.container = container;
  if (this.re) { return this; }
  var re = '^' + this.prefix;
  this.inputDetails.forEach(function (id) {
    var elts = this.getElts(id.elt);
    id.defaultValue = id.defaultValue || '';
    re += Input.wrap(elts).getREpart(id.name);
  }, this);
  this.re = new RegExp(re + '$');
  return this;
};

FormWrapper.prototype.parse = function parse(line) {
  var m = line.match(this.re),
      raceSelector,
      hs;
  line = line
    .replace(/M/g, "kk")
    .replace(/k/g, "000");
  if (!m) { return false; }
  m.shift(); // remove whole match line
  m.forEach(function (match, i) {
    var id = this.inputDetails[i],
      elts = this.getElts(id.elt),
      val = match || id.defaultValue;
    if (elts.length !== 1) {
      return Input.wrap(elts).setState(val.toString().split(","));
    }
    Input.wrap(elts[0]).setState(val);
    if (typeof id.onChange === 'function') {
      id.onChange(val);
    }
  }, this);
  raceSelector = this.container.querySelector(".race_selector");
  if (raceSelector) { update_race.call(raceSelector); }
  hs = this.container.querySelector("input[name='hero_switcher']");
  if (hs && hs.checked) {
    this.container.querySelector(".hero").classList.remove('disabled');
  }
  return true;
};

FormWrapper.prototype.gather = function gather() {
  var data = {
    hash: "",
    req: {}
  };
  this.inputDetails.forEach(function(id){
    var elts = this.getElts(id.elt),
      value = Input.wrap(elts).getValue() || id.defaultValue;
    if (id.dependsOn && !data.req[id.dependsOn]) { return; }
    // if (!elts[0].offsetWidth) return; // pass invisible elements
    if (value != id.defaultValue) {
      data.hash += id.name + Input.wrap(elts)
        .getState()
        .toString()
        .replace(/,0/g, ",")
        .replace(/(^0)?,+$/, "");
      data.req[id.name] = Input.wrap(elts).getValue();
    }
  }, this);
  data.hash = this.prefix + data.hash.replace(/(\D)0,/g, "$1,");
//    data.hash = data.hash.replace(/(u[\dkM,]+)0{6}(\D|$)/g, "$1M$2").replace(/(u[\dkM,]+)0{3}(\D|$)/g, "$1k$2");
  return data;
};

var mode, def_pop;

function version2mode(v) {
  return {'25': 2,'36': 3,'46': 9,'50': 5,'431': 4,'45': 4}[v.slice(2)] || 4;
}
function mode2version(m) {
  return {2:'1.25',3:'1.36',4:'1.45',5:'1.50',9:'1.46'}[m];
}


(function () {
  var v;
  try {
    v = localStorage.get('v') || '1.46';
  } catch (e) {
    v = '1.46';
  }
  mode = version2mode(v);
  $('server').addEventListener('change', function (e) {
    mode = version2mode(e.target.value);
    set_mode(mode);
  });
}());
set_mode(mode);

function update_index() {
  var sides = document.querySelectorAll(".side"),
    zidx = 1,
    i;
  for (i = sides.length - 1; i >= 2; i--) {
    sides[i].style.zIndex = zidx++;
  }
}

function update_inactives() {
  var blocks = document.querySelectorAll("sides .side");
  if (blocks.length > 2) {
    blocks[0].querySelector(".up").classList.add('inactive');
    blocks[1].querySelector(".up").classList.remove('inactive');
    blocks[blocks.length-2].querySelector(".down").classList.remove('inactive');
    blocks[blocks.length-1].querySelector(".down").classList.add('inactive');
  } else if (blocks.length) {
    blocks[0].querySelector(".up").classList.add('inactive');
    blocks[0].querySelector(".down").classList.remove('inactive');
    blocks[blocks.length-1].querySelector(".up").classList.remove('inactive');
    blocks[blocks.length-1].querySelector(".down").classList.add('inactive');
  }
}

function toggle (elt) {
  var side = elt.parentNode.parentNode.parentNode;
  if (side.classList.contains('collapsed')) {
    elt.classList.remove('navi_minus');
    elt.classList.add('navi_under');
    setTimeout(function () {
      side.classList.remove('collapsed');
      side.style.height = "";
      $$(".caption select, .caption input", side).prop('disabled', false);
    }, 330);
    elt.title = i18n.misc.part_collapse;
  } else {
    side.style.height = side.querySelector(".caption").offsetHeight - 1 + 'px';
    side.classList.add('collapsed');
    $$(".caption select, .caption input", side).prop('disabled', true);
    elt.classList.remove('navi_under');
    elt.classList.add('navi_minus');
    elt.title = i18n.misc.part_expand;
  }
}
function elt_up(elt) {
  var prev = elt.previousElementSibling,
      prevInsert = prev,
      dy, dh;
  if (!prev) { return; }
  // jump over central conditions
  if (prev.id === "def_cond") {
    prev = prev.previousElementSibling;
    if (!prev) { return; }
  }
  // detect deltas
  dy = prev.offsetTop - elt.offsetTop;
  dh = prev.offsetHeight - elt.offsetHeight;
  // change positions
  prev.style.top = dy + dh + 'px';
  elt.style.top = -dy + 'px';
  // reorder them
  elt.parentNode.insertBefore(elt, prev);
  if (prevInsert !== prev) {
    elt.parentNode.insertBefore(prevInsert, prev);
    prevInsert.style.top = dh + 'px';
    setTimeout(function () { prevInsert.style.top = 0; }, 0);
  }
  update_index();
  // restore positions
  elt.style.top = 0;
  prev.style.top = 0;
  update_inactives();
}
function elt_down(elt) {
  var next = elt.nextElementSibling,
      nextInsert = next,
      dy, dh;
  if (!next) { return; }
  // jump over central conditions
  if (next.id === "def_cond") {
    next = next.nextElementSibling;
    if (!next) { return; }
  }
  // detect deltas
  dy = next.offsetTop - elt.offsetTop;
  dh = elt.offsetHeight - next.offsetHeight;
  // change positions
  elt.style.top = -dy + dh + 'px';
  next.style.top = dy + 'px';
  elt.parentNode.insertBefore(next, elt);
  // reorder them
  if (nextInsert !== next) {
    elt.parentNode.insertBefore(nextInsert, elt);
    nextInsert.style.top = dh + 'px';
    setTimeout(function () { nextInsert.style.top = 0; }, 0);
  }
  update_index();
  // restore positions
  elt.style.top = 0;
  next.style.top = 0;
  update_inactives();
}

function _updateItem(id, i) {
  // jshint validthis: true
  this[i].value = id;
  this[i].text = items[id].name;
}

function updateWeapons(sideElt, race) {
  var weaponSelector = sideElt.querySelector(".weapon"),
      optGroups = weaponSelector.querySelectorAll("optgroup"),
      ui = 0;
  /*global weapons: false, items: false*/
  for (var w in weapons[race]) {
    var ids = weapons[race][w];
    var og = optGroups[ui++],
        options = og.querySelectorAll("option"),
        u = Object.keys(items[ids[0]].unit)[0];
    og.label = i18n.units[race][u];
    ids.forEach(_updateItem, options);
  }
}
function updateUnits(sideElt, race) {
  $$(".unitHolder > img.unit", sideElt).forEach(function (icon, u) {
    icon.alt = i18n.units[race][u];
    icon.className = "icon--scalable unit u" + (race*10+u+1);
  });
}

function add(a, b) { return a + b; }
function hero_stats3_update(input) {
  var heroHolder = findParent(input, ".hero"),
      skill = parseInt(heroHolder.querySelector(".hero_self").value, 10) || 0,
      u = heroHolder.querySelector(".hero_unit").value,
      r = Math.floor(u / 10),
      unit = units.t3[r][u %= 10];
  if (heroHolder.parentNode.classList.contains('off')) {
    heroHolder.querySelector(".skill_str").innerHTML = 
      window.Round5((2*unit.off/3+27.5)*skill + 5*unit.off/4);
    return;
  }
  var corr = Math.pow(unit.def_i/unit.def_c, 0.2);
  heroHolder.querySelector(".skill_str").innerHTML = 
    window.Round5((2*unit.def_i/3 + 27.5*corr)*skill + 5*unit.def_i/3);
  heroHolder.querySelector(".skill_str2").innerHTML = 
    window.Round5((2*unit.def_c/3 + 27.5/corr)*skill + 5*unit.def_c/3);
}
function hero_stats4_update(root, side) {
  var race = +side.querySelector("select").value;
  var skill = +root.querySelector(".hero_self").value * (race === 0 ? 100 : 80) + 100;
  return skill +
    [].slice.call(root.querySelectorAll(".hero_item"), 0, 3)
    .map(function (elt) {
      var item = elt.querySelector(".hero_input").value;
      if (item === '0') return 0;
      return (mode === 9 ? items45 : items)[item].hero;
    }).reduce(add);
}
function hero_stats5_update(root, side) {
  var race = +side.querySelector(".race_selector").value;
  var skill = +root.querySelector(".hero_self").value * (race === 0 ? 100 : 80) + 400;
  return skill + 
    [].slice.call(root.querySelectorAll(".hero_item"), 0, 3)
    .map(function (elt) {
      var item = elt.querySelector(".hero_input").value;
      if (item === '0') return 0;
      var quality = +elt.querySelector(".quality input").value + 2;
      var crystals = elt.querySelector(".crystals input").value;
      var tier = (item - 1) % 3;
      if (!items5[item] || !items5[item].hero) return 0;
      return items5[item].hero[quality] + 50 * Math.pow(2, tier) * crystals;
    }).reduce(add);
}
function updateTotalStr() {
  var side = this;
  var heroWrapper = side.querySelector(".hero");
  if (mode <= 3) return;
  var totalElt = heroWrapper.querySelector(".total_str");
  if (mode === 5) {
    totalElt.innerHTML = hero_stats5_update(heroWrapper, side);
  } else {
    totalElt.innerHTML = hero_stats4_update(heroWrapper, side);
  }
}

function hero_self_update() {
  // jshint validthis: true
  var race = +findParent(this, ".side").querySelector("select").value,
    val,
    newVal;
  if (this.value) {
    val = parseInt(this.value, 10);
    if (isNaN(val)) { return; }
  } else {
    val = 0;
  }
  newVal = Math.min(Math.max(0, val), 100);
  if (newVal !== val) { this.value = newVal; }
  if (mode === 3) { hero_stats3_update(this); }
  if (mode >= 4) {
    this.parentNode.nextElementSibling.innerHTML =
      100 + 300 * +(mode === 5) + newVal * (race ? 80 : 100);
  }
}
function hero_bonus_update() {
  // jshint validthis: true
  var val,
    newVal;
  if (this.value) {
    val = parseInt(this.value, 10);
    if (isNaN(val)) { return; }
  } else {
    val = 0;
  }
  newVal = Math.min(Math.max(0, val), 100);
  if (newVal !== val) { this.value = newVal; }
  this.parentNode.nextElementSibling.innerHTML = (0.2 * newVal).toFixed(1).replace(/\.0$/, "") + "%";
}
function hero_health_update() {
  // jshint validthis: true
  var val,
    newVal;
  if (this.value) {
    val = parseInt(this.value, 10);
    if (isNaN(val)) { return; }
  } else {
    val = 0;
  }
  newVal = Math.min(Math.max(0, val), 100);
  if (newVal !== val) {
    this.value = newVal;
    //this.parentNode.previousElementSibling.querySelector("img").style.opacity = newVal * 0.009 + 0.1;
  }
}
function hero_unit_update() {
  // jshint validthis: true
  var img = findParent(this, ".mode3").querySelector("img");
  img.className = "icon--scalable unit u" + (+this.value + 1);
  hero_stats3_update(this);
}
function hero_weapon_update() {
  // jshint validthis: true
  this.previousElementSibling.className = this.value === '0' ?
    "icon--scalable itemCategory itemCategory_rightHand" :
    "icon--scalable itemIcon itemIcon_" + this.value;
}
function hero_item_update() {
  // jshint validthis: true
  if (mode !== 5) return;  
  var extra_wrapper = findParent(this, ".hero_item").querySelector(".item_extra");
  if (!extra_wrapper) return;
  extra_wrapper.style.display = this.value === '0' ? 'none' : '';
}
function update_race() {
  // jshint validthis: true
  var r = +this.value,
    dr = $('def_race'),
    side = findParent(this, ".side"),
    isOff = side.classList.contains('off'),
    select;
  if (isOff) {
    side.querySelector(".brew").style.display = (r === 1 || mode === 9) ? '' : 'none';
    // update scout block position
    var scoutIdx = r === 2 || r === 6 || r === 7 ? 2 : 3;
    side.querySelectorAll(".unitHolder")[scoutIdx]
      .appendChild(side.querySelector(".details"));
  } else {
    side.querySelector(".natar_selection").style.display = r === 4 ? '' : 'none';
  }
  // hide heroes for nature and natars
  if (r >= 3 && r <= 4) {
    side.classList.add('nn');
    if (!isOff) {
      if ((r === 4) && (dr.value !== '4')) {
        dr.value = 4;
        def_race_update.call(dr);
      }
    }
  } else {
    if (!isOff) {
      if (dr.value === '4') {
        dr.value = r;
        def_race_update.call(dr);
      }
    }
    side.classList.remove('nn');
    select = side.querySelector(".hero .mode3 select");
    [ [0,1,2,4,5],
      [0,1,2,4,5],
      [0,1,3,4,5],
      ,
      ,
      [0,1,3,4,5],
      [0,1,2,4,5],
      [0,1,3,4,5],
    ][r].forEach(function (idx, u) {
      var option = select.options[u];
      option.value = idx + r*10;
      option.text = i18n.units[r][idx];
    });
  }
  updateWeapons(side, r);
  updateUnits(side, r);

  $$("select.hero_input", side).forEach(function (elt) {
    hero_item_update.call(elt);
  });
  hero_weapon_update.call(side.querySelector(".weapon"));
  hero_unit_update.call(side.querySelector("select.hero_unit"));
  hero_self_update.call(side.querySelector(".hero_self"));
}

function common_events(side) {
  side.querySelector("img").addEventListener('click', function () {
    var select = this.nextElementSibling;
    select.selectedIndex = (select.selectedIndex + 1) % select.options.length;
    update_race.call(select);
  });
  side.querySelector(".close").addEventListener('click', function (event) {
    var info, a;
    event.preventDefault();
    info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = i18n.misc.part_restore;
    side.parentNode.insertBefore(info, side);
    a = info.querySelector("a");
    a.addEventListener('click', function(event) {
      event.preventDefault();
      info.parentNode.insertBefore(side, info);
      info.parentNode.removeChild(info);
      info = null;
    });
    a.focus();
    side.parentNode.removeChild(side);
    setTimeout(function () {
      if (info) { info.parentNode.removeChild(info); }
    }, 10000);
  });
  side.querySelector(".caption .block").addEventListener('click', function (event) {
    event.preventDefault();
    toggle(this);
  });
  side.querySelector(".caption .up").addEventListener('click', function (event) {
    event.preventDefault();
    elt_up(side);
  });
  side.querySelector(".caption .down").addEventListener('click', function (event) {
    event.preventDefault();
    elt_down(side);
  });
  side.querySelector(".caption .copy").addEventListener('click', function (event) {
    event.preventDefault();
    new_side(side);
  });

  side.querySelector(".race_selector").addEventListener('change', update_race);
  $$(".cata_tgt", side).on('change', function () {
    if (+this.value > 21) { // croplands may be of level 21
      this.parentNode.querySelector(".ida").checked = true;
    }
  });

  side.querySelector(".hero").addEventListener('click', function(){
    if (this.classList.contains('disabled')) {
      side.querySelector("input[name='hero_switcher']").checked = true;
      this.classList.remove('disabled');
    }
  });

  side.querySelector("input[name='hero_switcher']").addEventListener('click', function(event){
    var heroContainer = side.querySelector(".hero");
    if (!this.checked) {
      heroContainer.classList.add('disabled');
      heroContainer.querySelector("div").classList.remove('opened');
    } else {
      heroContainer.classList.remove('disabled');
    }
  });

  var isIE = /microsoft/.test(navigator.userAgent);

  if (isIE) {
    side.querySelector(".hero div").addEventListener('click', function(event){
      this.classList.toggle('opened');
    });
  }

  var heroInput = $$(".hero div input");
  if (!isIE) {
    heroInput.on('focus', function() {
      findParent(this, ".hero_items").classList.add('opened');
      var parent = this.parentNode.parentNode;
      if (parent.classList.contains('disabled')) {
        side.querySelector("input[name='hero_switcher']").checked = true;
        parent.classList.remove('disabled');
      }
      return true;
    });
    heroInput.on('keyup', function(event){
      if (event.key !== 'tab') {
        return true;
      }
      if (event.alt || event.ctrl) { return true; }
      if (event.shift) {
        this.parentNode.parentNode.querySelector("input[name='hero_mounted'], .hero_bonus").focus();
        this.parentNode.classList.remove('opened');
      } else {
        this.getNext(".hero_item").querySelector(".hero_input").focus();
      }
    });
  }
  heroInput.on('select', function(event){
    event.preventDefault();
    return false;
  });
  side.querySelector(".hero .hero_input:last-child").addEventListener('keypress', function(event){
    if ((event.key === 'tab') && (!event.shift)) {
      this.parentNode.classList.remove('opened');
    }
  });
  side.querySelector(".hero_self").addEventListener('keyup', hero_self_update);
  side.querySelector(".hero_bonus").addEventListener('keyup', hero_bonus_update);
  side.querySelector(".hero_health").addEventListener('keyup', hero_health_update);
  side.querySelector(".hero select.hero_unit").addEventListener('change', hero_unit_update);
  $$("select.hero_input", side).on('change', hero_item_update);
  side.querySelector(".weapon").addEventListener('change', hero_weapon_update);
  side.querySelector(".leftHand").addEventListener('change', function () {
    this.previousElementSibling.className = this.value === '0'
      ? "icon--scalable itemCategory itemCategory_leftHand"
      : "itemIcon itemIcon_" + this.value;
  });
  side.querySelector(".armor").addEventListener('change', function () {
    this.previousElementSibling.className = this.value === '0'
      ? "icon--scalable itemCategory itemCategory_body"
      : "itemIcon itemIcon_" + this.value;
  });
  $$("select.bandage", side).on('change', function select_bandage() {
    this.parentNode.querySelector("img").className = "icon--scalable itemCategory itemCategory_bandage" + this.value;
  });
  
  $$(".button-group.crystals > button", side).on('click', function () {
    var parent = this.parentNode;
    var value = +this.value;
    var crystalClass = 'crystal_' + parent.getAttribute('crystal');
    parent.querySelector(".cross").classList.toggle('cross--disabled', value === 0);
    $$(".crystal", parent).forEach(function (elt, i) {
      elt.classList.toggle(crystalClass, i < value);
    });
    this.parentNode.querySelector("input").value = this.value;    
  });
  $$(".button-group.quality > button", side).on('click', function () {
    var active = this.parentNode.querySelector(".active");
    if (active) { active.classList.remove('active'); }
    this.classList.add('active');
    this.parentNode.querySelector("input").value = this.value;
  });

  var strUpdater = updateTotalStr.bind(side);
  $$("select, input", side.querySelector(".hero"))
    .on('change', strUpdater)
    .on('keyup', strUpdater);
  setTimeout(strUpdater, 1);

  side.querySelector(".hero").addEventListener('click', function (event) {
    var elt = event.target;
    if (elt.classList.contains('itemIcon')
    ||  elt.classList.contains('itemCategory')) {
      this.querySelector(".hero_items").classList.add('opened');
      setTimeout(function() {
        elt.nextElementSibling.focus();
      }, 10);
    }
    if (elt.classList.contains('hero_input')) {
      event.stopPropagation();
    }
  });

  if (side.classList.contains('off')) {
    side.querySelector(".attackType").addEventListener('change', function () {
      side.classList.toggle('raid', this.value === "1");
    });
  }

  // appearing tooltips
  var timerId = null,
    unitHolder = null;
  function removeOutline(){
    if (unitHolder) {
      unitHolder.classList.remove('outline');
    }
  }
  $$("input, select", side).on('focus', function() {
    var parent = findParent(this, ".unitHolder");
    if (!parent || !parent.querySelector(".details")) { return; }
    if (unitHolder) {
      unitHolder.classList.remove('outline');
      clearTimeout(timerId);
    }
    if (warsim_prefs.show_tooltips) {
      parent.classList.add('outline');
    }
  });
  $$("input, select", side).on('blur', function () {
    var parent = findParent(this, ".unitHolder");
    if (!parent || !parent.querySelector(".details")) { return; }
    unitHolder = parent;
    timerId = setTimeout(removeOutline, 50);
  });
  var buffer = side.querySelector(".buffer");
  buffer.addEventListener('focus', function () {
    this.classList.add('buffer-focus');
  });
  buffer.addEventListener('blur', function () {
    this.classList.remove('buffer-focus');
  });
  buffer.addEventListener('change', function (event) {
    var values = this.value.match(/\d+/g);
    if (!values) { return true; }
    var unitInputs = side.querySelectorAll("input[fc='u']");
    values.slice(0, 10).forEach(function(val, idx){
      unitInputs[idx].value = +val || "";
    });
    side.querySelector(".hero_switcher").checked = values[10];
  });
}

function new_side(side, race, idx) {
  var elt,
    newSide,
    raceSelector,
    formWrapper,
    hash;
  if (typeof side !== "string") {
    elt = side;
    side = side.className.match(/off|def/)[0];
  }
  var base = $('side_' + side);
  if (base.clone) {
    newSide = base.clone(true);
  } else {
    newSide = base.cloneNode(true);
    newSide.id = '';
  }
  if (side === 'off') {
    newSide.querySelector(".art").value = 0;
  }
  newSide.querySelector(".hero").style.transition = "all 250ms";
  common_events(newSide);
  raceSelector = newSide.querySelector(".race_selector");
  // duplicate
  if (typeof race === 'undefined') {
    elt.parentNode.insertBefore(newSide, elt);
    race = elt.querySelector(".race_selector").value;
    formWrapper = window[side + "Side"];
    hash = formWrapper.adopt(elt).gather().hash;
    formWrapper.adopt(newSide).parse(hash);
  } else {
    if (idx) {
      $('sides').insertBefore(newSide, document.querySelectorAll("#sides > div")[idx]);
    } else {
      if (side === 'off') {
        $('sides').insertBefore(newSide, $('sides').firstChild);
      } else {
        $('sides').appendChild(newSide);
      }
    }
  }
  //sort.addItems(_side);
  raceSelector.value = race;
  update_race.call(raceSelector);
  raceSelector.focus();
  update_inactives();
  update_index();
  return newSide;
}

function set_mode(newMode) {
  var version = mode2version(newMode);
  var v = parseVersion(version);
  document.body.className = 't' + v.major;
  try { localStorage.v = version; } catch (e) {}
  mode = +newMode;
/*  var oldActive = document.querySelector(".mode_switcher a.active");
  var newActive = document.querySelector("a[mode='" + mode + "']");
  if (oldActive) { oldActive.classList.remove('active'); }
  newActive.classList.add('active');*/
  document.main.className = "mode" + mode;
  const elts = $$("#sides .hero .hero_self");
  elts.forEach(hero_self_update.call, hero_self_update);
  elts.forEach(function (el) {
    updateTotalStr.call(findParent(el, ".side"));
  });
}

// default vaue
var warsim_prefs = {
  stop_uu: true,
  stop_cb: false,
  stop_dt: true,
  show_tooltips: true,
  u0: 1,  u1: 10,
  i0: 1,  i1: 10,
  h0: 1,  h1: 10,
  c0: 1,  c1: 10,
  d0: 1,  d1: 100,
  p0: 10, p1: 100,
  t0: 10, t1: 100,
  ico: {
    u: 'switch_up',
    a: 'round_positive',
    s: 'round_0123'
  }
};
(function () {
  var pmenu = $('prefs_offset'),
    wp;
  try {
    if (!window.localStorage) return;
  } catch (e) {
    return;
  }
  $('warsim_settings').style.display = 'block';
  document.addEventListener('keypress', function(event){
    if (event.shift && event.key === 'p') {
      pmenu.style.display =
        pmenu.style.display === 'none' ? '' : 'none';
    }
  });
  document.addEventListener('keyup', function(event){
    if (event.key === 'esc') {
      pmenu.style.display = 'none';
    }
  });
  $('warsim_settings').addEventListener('click', function(event){
    pmenu.style.display = '';
  });
  $('prefs_save').addEventListener('click', function () {
    var set;
    warsim_prefs.stop_uu = $('stop_uu').checked;
    set = warsim_prefs.stop_uu ? 0 : -1;
    $$(".unitHolder .up").prop('tabindex', set);
    
    warsim_prefs.stop_cb = $('stop_cb').checked;
    $$(".caption .navi").prop('tabindex', warsim_prefs.stop_cb ? 0 : -1);
    warsim_prefs.stop_dt = $('stop_dt').checked;
    $$(".details input, .details select").prop('tabindex', warsim_prefs.stop_dt ? 0 : -1);
    warsim_prefs.show_tooltips = $('show_tooltips').checked;

    $$("#prefs_container .fm").forEach(function (elt) {
      warsim_prefs[elt.getAttribute('name')] = +elt.value || 1;
    });
    
    $$("#prefs_container select").forEach(function(elt){
      var name = elt.getAttribute('name').split(".");
      if (!warsim_prefs[name[0]]) {
        warsim_prefs[ name[0] ] = {};
      }
      warsim_prefs[ name[0] ] [ name[1] ] = elt.value;
    });
    localStorage.setItem('warsim_prefs', JSON.stringify(warsim_prefs));
    pmenu.style.display = 'none';
  });
  document.querySelector("#prefs_container .navi_close").addEventListener('click', function(event){
    pmenu.style.display = 'none';
    return false;
  });
  try {
    wp = localStorage.getItem('warsim_prefs');
  } catch(e) {}
  if (!wp) { return; }
  warsim_prefs = JSON.parse(wp);
  $('stop_uu').checked = warsim_prefs.stop_uu;
  $('stop_cb').checked = warsim_prefs.stop_cb;
  $('stop_dt').checked = warsim_prefs.stop_dt;
  $('show_tooltips').checked = warsim_prefs.show_tooltips;
  $$("#prefs_container .fm").forEach(function(elt) {
    var name = elt.getAttribute('name');
    elt.value = warsim_prefs[name];
  });
  $$("#prefs_container select").forEach(function(elt) {
    var name = elt.getAttribute('name').split(".");
    if (!warsim_prefs[name[0]]) {
      warsim_prefs[ name[0] ] = {};
    }
    elt.value = warsim_prefs[ name[0] ] [ name[1] ];
  });
}());

$('dp').addEventListener('change', function(){ def_pop = this.value; });
var def_race_update = function () {
  var race = +this.value,
    race_wrapper = this.parentNode.parentNode,
    wall_wrapper = $('wall').parentNode.parentNode;
  race_wrapper.querySelector("img").className = "icon--scalable tribe tribe-" + (race + 1);
  $('def_cond').className = "race" + race;
  if (race === 3) {
    $('dp').classList.add('readonly');
    $('dp').readonly = true;
    $('dp').value = 500;
    $$('.itemCategory_cage').forEach(function(elt){
      elt.parentNode.style.display = '';
    });
  } else {
    $('dp').classList.remove('readonly');
    $('dp').readonly = false;
    if (typeof def_pop !== "undefined") { $('dp').value = def_pop; }
    $$('.itemCategory_cage').forEach(function (elt) {
      elt.parentNode.style.display = 'none';
    });
  }
  wall_wrapper.querySelector("img").className = "icon--scalable building " + ["g31", "g32", "g33", "", "g31", "g42", "g43"][race];
  wall_wrapper.cells[1].innerHTML = i18n.walls[race];
  if (race === 4) {
    $$(".def .race_selector").forEach(function (select) {
      if (select.value !== '3') { select.value = 4; }
      update_race.call(select);
    });
  } else {
    $$(".def .race_selector").forEach(function (select) {
      if (select.value === '4') { select.value = race; }
      update_race.call(select);
    });
  }
};

window.addEventListener('load', function () {
  if (!warsim_prefs.stop_uu) { $$(".unitHolder .up").prop('tabindex', -1); }
  if (!warsim_prefs.stop_cb) { $$(".caption .navi").prop('tabindex', -1); }
  if (!warsim_prefs.stop_dt) { $$(".details input, .details select").prop('tabindex', -1); }
  $('def_race').addEventListener('change', def_race_update);
  var icoFunctions = {
    d: function() {
      var elt = this.parentNode.parentNode.cells[2].querySelector("input");
      if (!elt.value) {
        elt.value = elt.getAttribute('max');
      } else {
        elt.value = "";
      }
    },
    h: function() {
      var elt = this.parentNode.nextElementSibling.querySelector("input"),
        cls = elt.className.match(/hero_\w+/),
        func = window[cls + '_update'];
      if (!elt.value) {
        elt.value = elt.getAttribute('max');
      } else {
        elt.value = "";
      }
      if (func) {
        func.call(elt);
      }
    },
    switch_up: function() {
      var elt = this.nextElementSibling;
      if (!elt.value) {
        elt.value = elt.getAttribute('max');
      } else {
        elt.value = "";
      }
    },
    clear_amount: function() {
      this.parentNode.querySelector("input[fc='u']").value = "";
    },
    round_0123: function() {
      var elt = this.parentNode.querySelector("input");
      elt.value = ((+elt.value || 0) + 1) % 4 || "";
    },
    toggle_party: function() {
      var elt = this.parentNode.querySelector(".details .party");
      if (elt) {
        elt.checked = !elt.checked;
      }
    },
    round_positive: function() {
      var elt = this.parentNode.parentNode.cells[2].querySelector("select"),
        i = elt.selectedIndex + 1;
      if (i === elt.options.length) { i = 0; }
      if (elt.options[i].value < 0) { i = 0; }
      elt.selectedIndex = i;
    },
    round_all: function() {
      var elt = this.parentNode.parentNode.cells[2].querySelector("select"),
        i = elt.selectedIndex + 1;
      if (i === elt.options.length) { i = 0; }
      elt.selectedIndex = i;
    }
  };
  icoFunctions.u = icoFunctions.switch_up;
  icoFunctions.a = icoFunctions.round_positive;
  icoFunctions.s = icoFunctions.round_0123;
  document.main.addEventListener('keydown', function (event) {
    var target = event.target,
      val, fc,
      oldVal,
      delta = 0,
      max;
    if (target.tagName.toLowerCase() === 'input' &&
      target.type === 'text') {
      val = +target.value || 0;
      fc = target.getAttribute('fc');
      if (fc === null) { return; }
      oldVal = val;
      switch (event.key) {
        case 'ArrowUp': delta = +warsim_prefs[fc + '0']; break;
        case 'ArrowDown': delta = -warsim_prefs[fc + '0']; break;
        case 'PageUp': delta = +warsim_prefs[fc + '1']; break;
        case 'PageDown': delta = -warsim_prefs[fc + '1']; break;
      }
      val += delta;
      if (val < 0) { val = 0; }
      max = target.getAttribute('max');
      if (max && val > max) { val = max; }
      if (val !== oldVal) { target.value = val || ""; }
    }
  });
  document.main.addEventListener('click', function (event) {
    var target = event.target,
      fc;
    if (target.tagName.toLowerCase() === 'img') {
      fc = target.getAttribute('fc');
      if (!fc) { return true; }
      if (typeof icoFunctions[fc] === 'undefined') { return true; }
      if (typeof warsim_prefs.ico[fc] !== 'undefined') {
        icoFunctions[warsim_prefs.ico[fc]].call(target);
      } else {
        icoFunctions[fc].call(target);
      }
    }
  });
});

if (!window.new_side_pre_calls) { window.new_side_pre_calls = []; }
new_side_pre_calls.forEach(function(args){ new_side.apply(null, args); });
new_side_pre_calls.length = 0;

return ({
  setMode: set_mode,
  newSide: new_side,
  getMode: function () { return mode; },
  updateDef: def_race_update,
  FormWrapper: FormWrapper
});

}(i18n));
