/* init help elements */
var pageElt = $$('.page')[0];
var bodyWidth = pageElt.offsetLeft + pageElt.offsetWidth;
var helpWidth = 150; // CSS.getRule(".inlineHelp .helpContent").width.toInt();

// init helpers
TableHelper.cellTimePeriodical = function(cell, value) {
  if (value > 0) {
    cell.innerHTML = timeI2S(value);
    cell.title = Math.round(86400 / value) + " / " + i18n.day_name;
  } else {
    cell.innerHTML = "0";
    cell.title = "";
  }
};
TableHelper.cellImg = function(cell, value) {
  cell.querySelector("img").className = value;
};

var cellNiceFixed = TableHelper.cellNiceFixedFactory(1);
var cellFixed2 = TableHelper.convertFactory(function(value){
  return value && value.toFixed
    ? value.toFixed(4).replace(/\.(\d+)$/, ".<small>$1</small>")
    : value;
});

/* tables */
var convertFields = {
  'img': TableHelper.cellImg,
  'time': TableHelper.cellTimePeriodical,
  'off': cellNiceFixed,
  'def_i': cellNiceFixed,
  'def_c': cellNiceFixed
};
var statController = new DOMTable( $('main'), {
  fields: ['img', 'name', 'off', 'def_i', 'def_c', 'speed', 'cap', 'res0', 'res1', 'res2', 'res3', 'res_sum', 'uc', 'time'],
  convert: convertFields,
  offsetTop: 2
});

var convertFields = {
  'lvl':  TableHelper.trivial,
  'res0': TableHelper.trivial,
  'res1': TableHelper.trivial,
  'res2': TableHelper.trivial,
  'res3': TableHelper.trivial,
  'res_sum': TableHelper.trivial,
  'time': TableHelper.convertFactory(function(value){
    return value > 0 ? timeI2S(value) : 0;
  }),
  'off': cellFixed2,
  'def_i': cellFixed2,
  'def_c': cellFixed2,
  'off_s': cellFixed2,
  'def_s': cellFixed2,
  'dmlsh': cellNiceFixed
};
var upgController = new DOMTableRangeSelect($('upg_table'), {
  fields: ['lvl', 'res0', 'res1', 'res2', 'res3', 'res_sum', 'time', 'off', 'def_i', 'def_c', 'off_s', 'def_s', 'dmlsh'],
  convert: convertFields,
  offsetTop: 2
});
upgController.updateRowCount(21);

/* model */
var state = {
  s: getMyVersion(),
  tribe: 1,
  u_lvl: 0,
  s_lvl: 1,
  t_lvl: 1,
  hdp: 0,
  h: [0, 0],
  recruit: 0,
  a: 0,
  unit: 1
};
StateSaver.bind(state, {
  s: 's',
  tribe: 'i',
  u_lvl: 'i',
  s_lvl: 'i',
  t_lvl: 'i',
  hdp: 'i',
  h: 'a',
  unit: 'i',
  a: 'i',
  recruit: 'i'
});
StateSaver.load(state);

/**
 * controller for tab-style switch
 * @class {TabController}
 */
function TabController(elements, attributeName) {
  EventEmitter.call(this);
  this.currentValue = null;
  this.currentElement = null;
  var self = this;
  this.attributeName = attributeName;
  this.elements = $$(elements);
  this.elements
    .on('click', function() { self.set(self.getTabValue(this)); })
    .on('mouseenter', function() { self.fireEvent('hover', { element: this, value: self.getTabValue(this) }); })
    .on('mouseleave', function() { self.fireEvent('unhover', { element: this, value: self.getTabValue(this)}); })
    ;
}
TabController.prototype = Object.create(EventEmitter.prototype);
TabController.prototype.constructor = TabController;

TabController.prototype.getTabValue = function(elt) {
  if (this.attributeName) {
    return elt.getAttribute(this.attributeName);
  } else {
    return this.elements.indexOf(elt);
  }
};
TabController.prototype.set = function(tab) {
  var tabElt = null;
  if (this.attributeName) {
    for (var i = 0; i < this.elements.length; i++) {
      if (this.elements[i].getAttribute(this.attributeName) == tab) {
        tabElt = this.elements[i];
        break;
      }
    }
  } else {
    tabElt = this.elements[tab];
  }
  if (!tabElt) return false;
  if (this.currentElement != tabElt) {
    this.fireEvent('unselect', { element: this.currentElement, value:this.currentValue });
    this.fireEvent('change', { element: tabElt, value:tab });
    this.fireEvent('select', { element: tabElt, value:tab });
    this.currentElement = tabElt;
    this.currentValue = tab;
  }
  return true;
};

/* controller */
function generalUpdate() {
  var name = this.getAttribute('state_name') || 's';
  unitsMediator.updateStat(name, this.value);
}
$('server').addEventListener('change', generalUpdate);
$('prod').addEventListener('change', generalUpdate);
$('hdp').addEventListener('change', generalUpdate);
$('tribe').addEventListener('change', generalUpdate);
$('upg').addEventListener('change', generalUpdate);
$('smith').addEventListener('change', generalUpdate);
$('smith').addEventListener('change', function () {
  var elt, maxLvl = parseInt(this.value);
  for (var lvl = 1; lvl <= 20; lvl++) {
    elt = $$("#upg_table tr")[lvl+2];
    if (lvl <= maxLvl) {
      elt.classList.remove('unavailable');
    } else {
      elt.classList.add('unavailable');
    }
  }
});
$('recruit').addEventListener('change', function () {
  state.recruit = +this.value;
  unitsMediator.updateStat();
});
$('art_train').addEventListener('change', function () {
  state.a = +this.value;
  unitsMediator.updateStat();
});
$('hi').addEventListener('change', function(){
  state.h[0] = +this.value;
  unitsMediator.updateStat();
});
$('hc').addEventListener('change', function(){
  state.h[1] = +this.value;
  unitsMediator.updateStat();
});
var unitSelector = new TabController("td[unit]", 'unit');
unitSelector.addEvents({
  select: function(event) { event.element.classList.add('unitSelected'); },
  unselect: function(event) { if (event.element) event.element.classList.remove('unitSelected'); },
  hover: function(event) { event.element.classList.add('unitHover'); },
  unhover: function(event) { event.element.classList.remove('unitHover'); },
  change: function(event) {
    state.unit = event.value;
    unitsMediator.updateStat('unit', event.value);
  }
});
$('prod').value = state.t_lvl;
$('server').value = state.s;
$('hdp').value = state.hdp;
$('tribe').value = state.tribe;
$('upg').value = state.u_lvl;
$('smith').value = state.s_lvl;
$('hi').value = state.h[0];
$('hc').value = state.h[1];
$('recruit').value = state.recruit;
$('art_train').value = state.a;

/* model again */

var statModel = new DataTable();
statModel.addEvent('change', function(evt){
  statController.updateCell(evt.idx, evt.name, evt.value);
});
var upgModel = new DataTableRangeSum({
  'lvl':  SummatorHelper.delta,
  'res0':  SummatorHelper.trivial,
  'res1':  SummatorHelper.trivial,
  'res2':  SummatorHelper.trivial,
  'res3':  SummatorHelper.trivial,
  'res_sum':SummatorHelper.trivial,
  'time':  SummatorHelper.trivial,
  'off':  SummatorHelper.delta,
  'def_i':SummatorHelper.delta,
  'def_c':SummatorHelper.delta,
  'off_s':SummatorHelper.delta,
  'def_s':SummatorHelper.delta,
  'dmlsh':SummatorHelper.delta
});
upgModel.addEvent('change', function(evt){
  upgController.updateCell(evt.idx, evt.name, evt.value);
});
upgController.addEvent('rangeChange', function(evt){
  upgModel.updateRange(evt.low, evt.high);
});
function addResSum(obj) {
  obj.res_sum = obj.res0 + obj.res1 + obj.res2 + obj.res3;
}
var unitsMediator = {
  stateObj: state,
  isT4: function() {
    return this.v.major >= 4;
  },
  isT5: function() {
    return this.v.major >= 5;
  },
  getTribeUnits: function() {
    return(units['t' + this.v.major + '.' + this.v.minor]
      || units['t' + this.v.major]
      || units
    )[this.stateObj.tribe-1];
  },
  updateControls: function() {
    $('hdp_wrap').style.display =
      (this.v.version > 3.5 && this.stateObj.tribe == 1)
      ? '' : 'none';
    const extraTribes = SERVER.hasExtraRaces();
    $('tribe6').disabled = !extraTribes;
    $('tribe7').disabled = !extraTribes;
    $('art_wrap').style.display = SERVER.hasArtifacts() ? '' : 'none';
    $('recruit_wrap').style.display = SERVER.hasAllianceBoni() ? '' : 'none';
    $('details').style.display = (this.stateObj.tribe <= 3 || this.stateObj.tribe >= 5) ? '' : 'none';
    $('t4').style.display = this.isT4() ? '' : 'none';
  },
  updateStat: function(name, value) {
    if (name) {
      this.stateObj[name] = value;
    }
    StateSaver.save();
    this.v = parseVersion(this.stateObj.s);
    SERVER.setParsedVersion(this.v);
    this.updateControls();
    var a = this.getTribeUnits();
    var tribeUnits = a.map(function(unit) {
      return this.getUnitData(unit, this.stateObj.u_lvl);
    }, this);
    statModel.updateRecords(tribeUnits);
    this.getUnitUpg(a[this.stateObj.unit-1]);
  },
  getUnitData: function(unit, up_lvl, forUpg) {
    // init shortcuts
    var version = this.stateObj.s;
    var tribe = this.stateObj.tribe;
    var useUpg = ((tribe <= 3 || tribe >= 6) && (unit.idx < 8));
    var cu = unit.cu * (1 + SERVER.doubleUpgrades());
    var obj = {
      img:  "icon--scalable unit u" + ((tribe - 1) * 10 + unit.idx + 1),
      name:  unit.name,
      off:   useUpg ? Combat._std_upg(unit.off,   cu, up_lvl, version) : unit.off,
      def_i: useUpg ? Combat._std_upg(unit.def_i, cu, up_lvl, version) : unit.def_i,
      def_c: useUpg ? Combat._std_upg(unit.def_c, cu, up_lvl, version) : unit.def_c,
      off_s: useUpg ? Combat._std_upg(35, cu, up_lvl, version) : 35,
      def_s: useUpg ? Combat._std_upg(20, cu, up_lvl, version) : 20,
      dmlsh: useUpg ? Combat._cat_upg(20, cu, up_lvl, version) : 20,
      res0:  unit.cost[0],
      res1:  unit.cost[1],
      res2:  unit.cost[2],
      res3:  unit.cost[3],
      res_sum: 0,
      uc:  unit.cu,
      speed: unit.speed,
      cap:   unit.cap,
      time:  unit.time
    };
    addResSum(obj);

    var unitSpd = SERVER.troopsSpeed();
    obj.speed *= unitSpd;
    obj.time /= this.v.speed;
    if (!forUpg) {
      if (SERVER.hasAllianceBoni()) {
        obj.time *= (1 - this.stateObj.recruit / 100);
      }
      // helms of infantry & cavalry
      if (unit.idx < 6
      &&   SERVER.hasItems()) {
        if (unit.prod === 20) { // trained in barracks
          obj.time *= (1 - this.stateObj.h[0] / 100);
        } else { // trained in stables
          obj.time *= (1 - this.stateObj.h[1] / 100);
        }
      }
      // training artifact
      if (SERVER.hasArtifacts()) {
        obj.time *= (4 - this.stateObj.a) / 4;
      }
      // horse drinking pool
      if ((this.stateObj.tribe === 1)
      &&  (unit.type === 'c')
      &&  this.v.version >= 3.5) {
        if (this.stateObj.hdp >= (unit.idx-1)*5) { obj.uc--; }
        obj.time *= 1 - 0.01 * this.stateObj.hdp;
      }
      // barracks, stables, workshop, residence/palace
      obj.time = Math.round(obj.time * Math.pow(0.9, this.stateObj.t_lvl - 1));
    }
    return obj;
  },
  getUnitUpg: function(unit) {
    var r;
    if ((this.stateObj.tribe === 4) // nature
    ||  (this.stateObj.tribe === 5) // natars
    ||  (unit.idx === 9)) { // settler
      $('upg_table').style.display = 'none';
      return;
    }
    $('upg_table').style.display = '';
    var coeffs = researchCostCoeffs[unit.idx];
    var a = [];
    var colsVisibility = {};
    var extra_fields = [];
    ['off', 'def_i', 'def_c', '_dummy', 'off_s', 'def_s', 'dmlsh'].forEach(function(s, i) {
      var mask = 1 << i;
      var masked = colsVisibility[s] = unit.mask & mask;
      if (masked) {
        extra_fields.push(s);
      }
    });
    // research
    var obj = this.getUnitData(unit, 0, true);
    var time = coeffs.t ? (obj.time * coeffs.t + 1800) : 0;
    obj.time = time;
    for (r = 0; r < 4; r++) {
      obj['res' + r] = obj['res' + r] * coeffs.k[r] + coeffs.b[r];
    }
    if (this.isT5()) { obj['res3'] = 0; }
    for (var stat in colsVisibility) {
      if (!colsVisibility[stat]) {
        obj[name] = undefined;
      }
    }
    addResSum(obj);
    a.push(obj);
    // upgrades
    if (unit.idx === 8) {
      upgController.hideRows(1, 20);
    } else {
      upgController.showRows(1, 20);
      for (var lvl = 1; lvl <= 20; lvl++) {
        var c = Math.pow(lvl, 0.8),
          tc = Math.pow(0.964, this.stateObj.s_lvl-1);
        obj = this.getUnitData(unit, lvl, true);
        obj.lvl = lvl;
        for (r = 0; r < 4; r++) {
          obj['res'+r] = Round5((obj['res'+r] * 7 + coeffs.b[r]) / unit.cu * c);
        }
        if (this.isT5()) { obj['res3'] = 0; }
        addResSum(obj);
        obj.time = time * c * tc;
        a.push(obj);
      }
    }
    // first type of unit have zero upgrade cost
    if (unit.idx === 0) {
      for (r = 0; r < 4; r++) { a[0]['res'+r] = 0; }
      addResSum(a[0]);
      a[0].time = 0;
    }
    upgModel.updateRecords(a);
    upgController.showCols(colsVisibility);
  }
};
unitSelector.set(state.unit);
