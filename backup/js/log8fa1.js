function formatLargeNum(value){
  value = value.toString().replace(/(\d)((?:\d{3})+)$/g, "\$1<small>\$2</small>");
  value = value.replace(/(\d{3})/g, "\u2009\$1");
  return value;
}

var reportManager = (function() {
  var tabsData = [];
  var tabStats, stats = null;
  var activeTab = null;
  var ww_items = $$("#warsim_warns li");
  var atkrTable = $$("#report .attacker")[0];
  if (atkrTable) {
    var heroCell = atkrTable.rows[5].cells[11];
  }
  function getStatsObject() {
    return [{
      pts: { i: 0, c: 0, t: 0 },
      cost: [0, 0, 0, 0],
      exp: 0,
      cap: 0
    }, {
      pts: { i: 0, c: 0, t: 0 },
      cost: [0, 0, 0, 0],
      exp: 0
    }];
  }
  var ww = 0;
  var cache = (function() {
    var tds = [];
    var values = [];
    var index = -1; // used for faster prefetch w/o even indexOf
    function checkValue(value) {
      if (values[index] == value) return true;
      values[index] = value;
      return false;
    }
    return {
      isValueFor: function(cell, value) {
        index++;
        if (tds[index] == cell) return checkValue(value);
        index = tds.indexOf(cell);
        if (index != -1) return checkValue(value);
        tds.push(cell);
        values.push(value);
        return false;
      }
    };
  }());
  function updateCell(cell, value) {
    if (cache.isValueFor(cell, value)) return;
    cell.className = value ? "" : "c";
    cell.innerHTML = value;
  }
  var cagedRow = $$(".defender")[3].rows[4];
  function updateTable(table, data, side, r) {
    var u, _units, trapped, hero, sideIdx, ids, revived;
    if (side == 'off') {
      _units = data.units;
      trapped = data.trapped;
      hero = data.dead_heroes[3];
      sideIdx = 0;
      ids = [1,3,5,4];
      if (data.caged) {
        cagedRow.style.display = '';
        for (u = 0; u < 10; u++) {
          updateCell(cagedRow.cells[u+1], data.caged[u]);
        }
      } else {
        cagedRow.style.display = 'none';
      }
      revived = data.revived[3] || [];
    } else {
      _units = data.def[r];
      trapped = [];
      hero = data.dead_heroes[r];
      sideIdx = 1;
      if (r < 3) {
        ids = [1,2,4,3];
        revived = data.revived[r] || [];
      } else {
        ids = [1,2,3,-1];
        revived = [];
      }
    }
    if (ids[3] > -1) {
      if (revived.length) {
        table.rows[ids[3]].style.display = '';
        revived.push(0);
      } else {
        table.rows[ids[3]].style.display = 'none';
      }
    }
    var loss = data.losses[sideIdx];
    var sideStats = stats[sideIdx];
    var wasTrapped = trapped.reduce(function (a, b) { return a + b; }, 0);
    var uMax = 10 + ((r < 3 || r >= 5) ? 1 : 0);
    for (u = 0; u < uMax; u++) {
      var amnt = _units[u];
      var trap = trapped[u] || 0;
      var losses = (u < 10) ? amnt - Math.round(amnt * (1-loss)) : hero;
      updateCell(table.rows[ids[0]].cells[u+1], amnt+trap);
      updateCell(table.rows[ids[1]].cells[u+1], losses);
      var alive = amnt+trap-losses + (revived.length ? revived[u] : 0);
      updateCell(table.rows[ids[2]].cells[u+1], alive);
      if (revived.length) updateCell(table.rows[ids[3]].cells[u+1], revived[u]);
      if (wasTrapped) updateCell(table.rows[2].cells[u+1], trap);
      var mode = window.Warsim ? Warsim.getMode() : 4;
      var unitsVersion = 't' + ({2:2.5,9:4}[mode] || mode);
      if (u < 10) {
        var unit = units[unitsVersion][r][u];
        if (sideIdx) { // def
          sideStats.pts.i += amnt * unit.def_i;
          sideStats.pts.c += amnt * unit.def_c;
        } else { // off
          sideStats.pts.t += amnt * unit.off;
          sideStats.pts[unit.type] += amnt * unit.off;
          sideStats.cap += (amnt+trap-losses) * unit.cap;
        }
        for (var res = 0; res < 4; res++) {
          sideStats.cost[res] += losses * unit.cost[res];
        }
        sideStats.exp += Math.round(amnt * loss * unit.cu);
      } else {
        if (losses) sideStats.exp += 6 * losses;
      }
    }
    if (side == 'off') {
      table.rows[2].style.display = wasTrapped ? "" : "none";
      table.rows[table.rows.length - 1].cells[1].innerHTML = sideStats.cap;
    }
  }
  function colorize(x) {
    var col = Math.round(2.55 * x);
    return "rgb(" + col + "," + ((255 - col) >> 1) + ",0)";
  }
  function colorLosses(x) {
    var v = Math.round(x*10);
    return "<span style='color:" + colorize(x) + ";'>" +
        Math.floor(v / 10) + "<small>." + (v % 10) + "</small>%</span>";
  }
  var pob = 1;
  return {
    gather: function(data) {
      var i;
      $$("p.error")[0].innerHTML = "";
      tabsData = [];
      tabStats = [];
      var def = {};
      var tdf = {};
      var ww_new = 0;
      data.forEach(function(wave) {
        var r, u;
        if (wave.type == 'def') {
          pob = wave.pob;
          for (r in wave.units) {
            if (!(r in def)) {
              def[r] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              tdf[r] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            }
            for (u = 0; u < wave.units[r].length; u++) {
              def[r][u] += wave.units[r][u];
              tdf[r][u] += wave.units[r][u];
            }
          }
        } else if (wave.type == 'off') {
          wave.def = def;
          var newDef = {};
          for (r in def) {
            newDef[r] = [].concat(def[r]);
            for (u = 0; u < 10; u++) {
              newDef[r][u] = Math.round(newDef[r][u] * (1-wave.losses[1]));
            }
            if (r < 3 || r >= 5) {
              newDef[r][10] -= wave.dead_heroes[r];
            }
          }
          if (wave.caged) {
            for (u = 0; u < 10; u++) {
              newDef[3][u] -= wave.caged[u];
            }
          }
          tabsData.push(wave);
          def = newDef;
        } else if (wave.type == 'link') {
          $('log_link').href = "/log2.php?" + wave.id;
        } else if (wave.type == 'warns') {
          ww_new = parseInt(wave.mask);
        } else if (wave.type == 'error') {
          $$("p.error")[0].innerHTML = wave.message;
          return;
        }
      });
  /*    tabsData.push({
        def: tdf
      });*/
      var DOMtabs = $$("#report #tabs .tab");
      var len = DOMtabs.length;
      if (len > tabsData.length) {
        for (i = tabsData.length; i < len; i++) {
          DOMtabs[i].parentNode.removeChild(DOMtabs[i]);
        }
      }
      len = $$("#report #tabs .tab").length;
      if (tabsData.length > len) {
        for (i = len; i < tabsData.length; i++) {
          var tab = document.createElement("div");
          tab.className = "tab";
          $('tabs').appendChild(tab);
        }
      }
      $$("#report #tabs .tab").forEach(function(elt, idx){
        elt.innerHTML = idx+1;
      });
      
      var ww_count = ww_items.length;
      if (ww != ww_new) {
        if (ww_new) {
          for (i = 0; i < ww_count; i++) {
            ww_items[i].className = (ww_new & (1 << i)) ? 'show' : '';
          }
          $('warsim_warns').style.display = '';
        } else {
          $('warsim_warns').style.display = 'none';
        }
        ww = ww_new;
      }
    },
    showTab: function(idx) {
      var tabElts = $$("#tabs .tab");
      var newTab;
      if (typeof idx == "undefined") { // refresh current tab
        idx = tabElts.indexOf(activeTab);
        if (idx == -1) idx = tabElts.length-1;
        newTab = tabElts[idx];
      } else {
        newTab = tabElts[idx];
        if (newTab == activeTab) return;
      }
      if (!newTab) { return; }
      //if (!tabStats[idx]) {
        tabStats[idx] = getStatsObject();
        stats = tabStats[idx];
      //}
      // reclassing tabs: 0.5ms
      if (activeTab) activeTab.classList.remove("active");
      (activeTab = newTab).classList.add("active");
      var tabData = tabsData[idx];
      var table = $$("#report table.attacker")[0];
      var r = tabData.race;
      // reclassing unit icons: 0.4ms
      var unitIcons = $$("img", table);
      for (var u = 0; u < 10; u++) {
        unitIcons[u].className = "unit u" + (r*10+u+1);
        unitIcons[u].alt = i18n.units[r][u];
        unitIcons[u].title = i18n.units[r][u];
      }
      // TODO: use rows in more optimal way
      while (table.rows.length > 7) table.deleteRow(6);
      var rowIdx = 6;
      if (('info' in tabData) && !('length' in tabData.info)) {
        for (var p in tabData.info) {
          var row = table.insertRow(rowIdx++);
          row.insertCell(0).innerHTML = i18n.info.info;
          var cell = row.insertCell(1);
          cell.colSpan = 11;
          cell.className = "info";
          var data = tabData.info[p];
          switch (p) {
          case 'none_return':
            cell.innerHTML = i18n.report.none_return;
            break;
          case 'wall':
            cell.innerHTML = i18n.info.wall
              .replace('{wall}', i18n.walls[pob] || '')
              .replace('{lvl1}', data[0])
              .replace('{lvl2}', data[1]);
            break;
          case 'bl':
            var str = i18n.info.build
              .replace('{lvl1}', data[0])
              .replace('{lvl2}', data[1]);
            if (data.length > 2) {
              str += "<BR>" + i18n.info.build
                .replace('{lvl1}', data[2])
                .replace('{lvl2}', data[3]);
            }
            cell.innerHTML = str;
            break;
          default:
            cell.innerHTML = p + ": " + tabData.info[p].join(" &rarr; ");
          }
        }
      }
      updateTable(table, tabData, 'off', r);
      if (heroCell && tabData.hero_health != null) {
        heroCell.innerHTML = Math.round(tabData.hero_health) + "%";
        heroCell.style.color = colorize(100 - tabData.hero_health);
      }
      for (r = 0; r < 7; r++) {
        table = $$("#report table.defender")[r];
        if (r in tabData.def) {
          table.style.display = "";
          updateTable(table, tabData, 'def', r);
        } else {
          table.style.display = "none";
        }
      }
      if (stats[0].pts.t) {
        stats[1].pts.t = Math.round(
          (stats[1].pts.i * stats[0].pts.i + stats[1].pts.c * stats[0].pts.c) / stats[0].pts.t
        );
      } else {
        stats[1].pts.t = (stats[1].pts.i + stats[1].pts.c) / 2;
      }
      
      var summary = $$("#summary")[0];
      for (var side = 0; side < 2; side++) {
        var sideStats = stats[side];
        var cellIdx = 2*side;
        summary.rows[1].cells[cellIdx].innerHTML = formatLargeNum(sideStats.pts.i);      
        summary.rows[2].cells[cellIdx].innerHTML = formatLargeNum(sideStats.pts.c);
        summary.rows[3].cells[cellIdx].innerHTML = formatLargeNum(sideStats.pts.t);
        summary.rows[5].cells[side].innerHTML = colorLosses(tabData.losses[side]*100);
        for (r = 0; r < 4; r++) {
          summary.rows[6+r].cells[cellIdx].innerHTML = formatLargeNum(sideStats.cost[r]);
        }
        summary.rows[10].cells[cellIdx].innerHTML = formatLargeNum(sideStats.cost
          .reduce(function (a, b) { return a + b; }, 0));
        summary.rows[11].cells[cellIdx].innerHTML = formatLargeNum(sideStats.exp);
      }
    }
  };
}());

$('tabs').addEventListener('click', function(event){
  if (event.target != this) event.preventDefault();
  var idx = $$(".tab", this).indexOf(event.target);
  if (idx > -1) {
    reportManager.showTab(idx);
  }
});

function wrapResponse(response) {
  try {
    reportManager.gather(response);
    $('report').style.display = "";
  } catch(e) {
    $('report').style.display = "none";
    $$("p.error")[0].innerHTML = "server script error";
  }
//      try {
    reportManager.showTab();
/*      } catch (e) {
    //$('report').style.display = "none";
    $$("p.error")[0].innerHTML = "javascript error: " + e;
  }*/
}

$('display_alive').addEventListener('click', function(){
  $('report').classList.toggle("hideAlive", !this.checked);
  if (this.checked) {
    Cookie.write('show_surv', '', { duration: 365 });
  } else {
    Cookie.dispose('show_surv');
  }
});
var display_alive = Cookie.read('show_surv') !== null;
$('display_alive').checked = display_alive;
$('warsim_warns').addEventListener('click', function() {
  this.classList.toggle("collapsed");
});
$('report').classList.toggle("hideAlive", !display_alive);
