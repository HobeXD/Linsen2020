/*jslint nomen:true, plusplus:true*/
function extend(proto, mixin) {
  if (typeof proto !== 'object') return mixin;
  if (Array.isArray(proto)) {
    return proto.map(function (e, i) {
      return (i in mixin) ? extend(e, mixin[i]) : e;
    });
  } else {
    var key, copy = {};
    for (key in proto) {
      copy[key] = proto[key];
    } 
    for (key in mixin) {
      copy[key] = mixin[key];
    } 
    return copy;
  }
}
var units = (function () {
  // rs_time = 1800 + 3 * time    # everyone
  //       = (time + 7200) / 4  # senators
  //         = 0                  # settlers
  var units = [
  [ {off:40, def_i:35, def_c:50, speed:6, cost:[  120,  100,  150,   30], cu:1, time: 2000, cap:50,  type:'i', prod: 20, mask:5, rs_time:7800},
    {off:30, def_i:65, def_c:35, speed:5, cost:[  100,  130,  160,   70], cu:1, time: 2200, cap:20,  type:'i', prod: 20, mask:2, rs_time:8400},
    {off:70, def_i:40, def_c:25, speed:7, cost:[  150,  160,  210,   80], cu:1, time: 2400, cap:50,  type:'i', prod: 20, mask:1, rs_time:9000},
    {off:0,  def_i:20, def_c:10, speed:16,cost:[  140,  160,   20,   40], cu:2, time: 1700, cap:0,   type:'c', prod: 21, mask:48,rs_time:6900},
    {off:120,def_i:65, def_c:50, speed:14,cost:[  550,  440,  320,  100], cu:3, time: 3300, cap:100, type:'c', prod: 21, mask:1, rs_time:11700},
    {off:180,def_i:80, def_c:105,speed:10,cost:[  550,  640,  800,  180], cu:4, time: 4400, cap:70,  type:'c', prod: 21, mask:1, rs_time:15000},
    {off:60, def_i:30, def_c:75, speed:4, cost:[  900,  360,  500,   70], cu:3, time: 4600, cap:0,   type:'i', prod: 22, mask:65,rs_time:15600},
    {off:75, def_i:60, def_c:10, speed:3, cost:[  950, 1350,  600,   90], cu:6, time: 9000, cap:0,   type:'i', prod: 22, mask:65,rs_time:28800},
    {off:50, def_i:40, def_c:30, speed:4, cost:[30750,27200,45000,37500], cu:5, time:90700, cap:0,   type:'i', prod: 26, mask:0, rs_time:24475, loyality:[20,30]},
    {off:0,  def_i:80, def_c:80, speed:5, cost:[ 4600, 4200, 5800, 4400], cu:1, time:26900, cap:3000,type:'i', prod: 26, mask:0, rs_time:0}
  ],
  [ {off:40, def_i:20, def_c:5,  speed:7, cost:[   95,   75,   40,   40], cu:1, time:  900, cap:60,  type:'i', prod: 20, mask:1, rs_time:4500},
    {off:10, def_i:35, def_c:60, speed:7, cost:[  145,   70,   85,   40], cu:1, time: 1400, cap:40,  type:'i', prod: 20, mask:4, rs_time:6000},
    {off:60, def_i:30, def_c:30, speed:6, cost:[  130,  120,  170,   70], cu:1, time: 1500, cap:50,  type:'i', prod: 20, mask:1, rs_time:6300},
    {off:0,  def_i:10, def_c:5,  speed:9, cost:[  160,  100,   50,   50], cu:1, time: 1400, cap:0,   type:'c', prod: 20, mask:48,rs_time:6000, prod_type:'i'},
    {off:55, def_i:100,def_c:40, speed:10,cost:[  370,  270,  290,   75], cu:2, time: 3000, cap:110, type:'c', prod: 21, mask:2, rs_time:10800},
    {off:150,def_i:50, def_c:75, speed:9, cost:[  450,  515,  480,   80], cu:3, time: 3700, cap:80,  type:'c', prod: 21, mask:1, rs_time:12900},
    {off:65, def_i:30, def_c:80, speed:4, cost:[ 1000,  300,  350,   70], cu:3, time: 4200, cap:0,   type:'i', prod: 22, mask:65,rs_time:14400},
    {off:50, def_i:60, def_c:10, speed:3, cost:[  900, 1200,  600,   60], cu:6, time: 9000, cap:0,   type:'i', prod: 22, mask:65,rs_time:28800},
    {off:40, def_i:60, def_c:40, speed:4, cost:[35500,26600,25000,27200], cu:4, time:70500, cap:0,   type:'i', prod: 26, mask:0, rs_time:19425, loyality:[20,25]},
    {off:10, def_i:80, def_c:80, speed:5, cost:[ 5800, 4400, 4600, 5200], cu:1, time:31000, cap:3000,type:'i', prod: 26, mask:0, rs_time:0}
  ],
  [ {off:15, def_i:40, def_c:50, speed:7, cost:[  100, 130,   55,    30], cu:1, time: 1300, cap:35,  type:'i', prod: 20, mask:6, rs_time:5700},
    {off:65, def_i:35, def_c:20, speed:6, cost:[  140, 150,  185,    60], cu:1, time: 1800, cap:45,  type:'i', prod: 20, mask:1, rs_time:7200},
    {off:0,  def_i:20, def_c:10, speed:17,cost:[  170, 150,   20,    40], cu:2, time: 1700, cap:0,   type:'c', prod: 21, mask:48,rs_time:6900},
    {off:100,def_i:25, def_c:40, speed:19,cost:[  350, 450,  230,    60], cu:2, time: 3100, cap:75,  type:'c', prod: 21, mask:1, rs_time:11100},
    {off:45, def_i:115,def_c:55, speed:16,cost:[  360, 330,  280,   120], cu:2, time: 3200, cap:35,  type:'c', prod: 21, mask:2, rs_time:11400},
    {off:140,def_i:50, def_c:165,speed:13,cost:[  500, 620,  675,   170], cu:3, time: 3900, cap:65,  type:'c', prod: 21, mask:5, rs_time:13500},
    {off:50, def_i:30, def_c:105,speed:4, cost:[  950, 555,  330,    75], cu:3, time: 5000, cap:0,   type:'i', prod: 22, mask:65,rs_time:16800},
    {off:70, def_i:45, def_c:10, speed:3, cost:[  960,1450,  630,    90], cu:6, time: 9000, cap:0,   type:'i', prod: 22, mask:65,rs_time:28800},
    {off:40, def_i:50, def_c:50, speed:5, cost:[30750,45400,31000,37500], cu:4, time:90700, cap:0,   type:'i', prod: 26, mask:0, rs_time:24475, loyality:[20,25]},
    {off:0,  def_i:80, def_c:80, speed:5, cost:[ 4400, 5600, 4200, 3900], cu:1, time:22700, cap:3000,type:'i', prod: 26, mask:0, rs_time:0}
  ],
  [ {off:10, def_i:25, def_c:20, speed:20, cost:[0,0,0,100],cu:1, time:0, cap:0, type:'i', mask:0, rs_time:1800},
    {off:20, def_i:35, def_c:40, speed:20, cost:[0,0,0,0],  cu:1, time:0, cap:0, type:'i', mask:0, rs_time:1800},
    {off:60, def_i:40, def_c:60, speed:20, cost:[0,0,0,0],  cu:1, time:0, cap:0, type:'i', mask:0, rs_time:1800},
    {off:80, def_i:66, def_c:50, speed:20, cost:[0,0,0,0],  cu:1, time:0, cap:0, type:'i', mask:0, rs_time:1800},
    {off:50, def_i:70, def_c:33, speed:20, cost:[0,0,0,0],  cu:2, time:0, cap:0, type:'i', mask:0, rs_time:1800},
    {off:100,def_i:80, def_c:70, speed:20, cost:[0,0,0,0],  cu:2, time:0, cap:0, type:'i', mask:0, rs_time:1800},
    {off:250,def_i:140,def_c:200,speed:20, cost:[0,0,0,0],  cu:3, time:0, cap:0, type:'i', mask:0, rs_time:1800},
    {off:450,def_i:380,def_c:240,speed:20, cost:[0,0,0,0],  cu:3, time:0, cap:0, type:'i', mask:0, rs_time:1800},
    {off:200,def_i:170,def_c:250,speed:20, cost:[0,0,0,0],  cu:3, time:0, cap:0, type:'i', mask:0, rs_time:1800},
    {off:600,def_i:440,def_c:520,speed:20, cost:[0,0,0,0],  cu:5, time:0, cap:0, type:'i', mask:0, rs_time:0}
  ],
  [ {off:20, def_i:35, def_c:50, speed:6, cost:[0,0,0,0], cu:1, time:0, cap:0, type:'i', prod: 20, mask:0, rs_time:1800},
    {off:65, def_i:30, def_c:10, speed:7, cost:[0,0,0,0], cu:1, time:0, cap:0, type:'i', prod: 20, mask:0, rs_time:1800},
    {off:100,def_i:90, def_c:75, speed:6, cost:[0,0,0,0], cu:1, time:0, cap:0, type:'i', prod: 20, mask:0, rs_time:1800},
    {off:0,  def_i:10, def_c:0,  speed:25,cost:[0,0,0,0], cu:1, time:0, cap:0, type:'i', prod: 20, mask:0, rs_time:1800},
    {off:155,def_i:80, def_c:50, speed:14,cost:[0,0,0,0], cu:2, time:0, cap:0, type:'c', prod: 21, mask:0, rs_time:1800},
    {off:170,def_i:140,def_c:80, speed:12,cost:[0,0,0,0], cu:3, time:0, cap:0, type:'c', prod: 21, mask:0, rs_time:1800},
    {off:250,def_i:120,def_c:150,speed:5, cost:[0,0,0,0], cu:4, time:0, cap:0, type:'i', prod: 22, mask:0, rs_time:1800},
    {off:60, def_i:45, def_c:10, speed:3, cost:[0,0,0,0], cu:5, time:0, cap:0, type:'i', prod: 22, mask:0, rs_time:1800},
    {off:80, def_i:50, def_c:50, speed:5, cost:[0,0,0,0], cu:1, time:0, cap:0, type:'i', prod: 26, mask:0, rs_time:1800, loyality:[200,200]},
    {off:30, def_i:40, def_c:40, speed:5, cost:[0,0,0,0], cu:1, time:0, cap:0, type:'i', prod: 26, mask:0, rs_time:0}
  ],
  [ {off:10, def_i:30, def_c:20, speed:7, cost:[   45,   60,   30,   15], cu:1, time:  530, cap:15,  type:'i', prod: 20, mask:2, rs_time:3390},
    {off:30, def_i:55, def_c:40, speed:6, cost:[  115,  100,  145,   60], cu:1, time: 1380, cap:50,  type:'i', prod: 20, mask:6, rs_time:5760},
    {off:65, def_i:50, def_c:20, speed:7, cost:[  170,  180,  220,   80], cu:1, time: 1440, cap:45,  type:'i', prod: 20, mask:1, rs_time:6120},
    {off:0,  def_i:20, def_c:10, speed:16,cost:[  170,  150,   20,   40], cu:2, time: 1360, cap:0,   type:'c', prod: 21, mask:48,rs_time:5880},
    {off:50, def_i:110,def_c:50, speed:15,cost:[  360,  330,  280,  120], cu:2, time: 2560, cap:50,  type:'c', prod: 21, mask:2, rs_time:9480},
    {off:110,def_i:120,def_c:150,speed:10,cost:[  450,  560,  610,  180], cu:3, time: 3240, cap:70,  type:'c', prod: 21, mask:6, rs_time:11520},
    {off:55, def_i:30, def_c:95, speed:4, cost:[  995,  575,  340,   80], cu:3, time: 4800, cap:0,   type:'i', prod: 22, mask:65,rs_time:16200},
    {off:65, def_i:55, def_c:10, speed:3, cost:[  980, 1510,  660,  100], cu:6, time: 9000, cap:0,   type:'i', prod: 22, mask:65,rs_time:28800},
    {off:40, def_i:50, def_c:50, speed:4, cost:[34000,50000,34000,42000], cu:4, time:90700, cap:0,   type:'i', prod: 26, mask:0, rs_time:24475, loyality:[20,25]},
    {off:0,  def_i:80, def_c:80, speed:5, cost:[ 5040, 6510, 4830, 4620], cu:1, time:24800, cap:3000,type:'i', prod: 26, mask:0, rs_time:0}
  ],
  [ {off:35, def_i:40, def_c:30, speed:6, cost:[  130,   80,   40,   40], cu:1, time:  810, cap:50,  type:'i', prod: 20, mask:3, rs_time:4230},
    {off:50, def_i:30, def_c:10, speed:6, cost:[  140,  110,   60,   60], cu:1, time: 1120, cap:30,  type:'i', prod: 20, mask:1, rs_time:5160},
    {off:0,  def_i:20, def_c:10, speed:19,cost:[  170,  150,   20,   40], cu:2, time: 1360, cap:0,   type:'c', prod: 21, mask:48,rs_time:5880},
    {off:120,def_i:30, def_c:15, speed:16,cost:[  290,  370,  190,   45], cu:2, time: 2400, cap:75,  type:'c', prod: 21, mask:1, rs_time:9000},
    {off:110,def_i:80, def_c:70, speed:15,cost:[  320,  350,  330,   50], cu:2, time: 2480, cap:105, type:'c', prod: 21, mask:7, rs_time:9240},
    {off:180,def_i:60, def_c:40, speed:14,cost:[  450,  560,  610,  140], cu:3, time: 2990, cap:80,  type:'c', prod: 21, mask:1, rs_time:10770},
    {off:65, def_i:30, def_c:90, speed:4, cost:[ 1060,  330,  360,   70], cu:3, time: 4400, cap:0,   type:'i', prod: 22, mask:65,rs_time:15000},
    {off:45, def_i:55, def_c:10, speed:3, cost:[  950, 1280,  620,   60], cu:6, time: 9000, cap:0,   type:'i', prod: 22, mask:65,rs_time:28800},
    {off:50, def_i:40, def_c:30, speed:5, cost:[37200,27600,25200,27600], cu:4, time:90700, cap:0,   type:'i', prod: 26, mask:0, rs_time:24475, loyality:[15,30]},
    {off:10, def_i:80, def_c:80, speed:5, cost:[ 6100, 4600, 4800, 5400], cu:1, time:28950, cap:3000,type:'i', prod: 26, mask:0, rs_time:0}
  ],
  [ {off:50, def_i:35, def_c:30, speed:6, cost:[  110,  185,  110,   35], cu:1, time: 1700, cap:60,  type:'i', prod: 20, mask:7, rs_time:4000},
    {off:0,  def_i:40, def_c:22, speed:9, cost:[  185,  150,   35,   75], cu:1, time: 1232, cap:0,   type:'i', prod: 20, mask:48,rs_time:5000},
    {off:40, def_i:85, def_c:45, speed:8, cost:[  145,   95,  245,   45], cu:1, time: 1936, cap:40,  type:'i', prod: 20, mask:2, rs_time:6000},
    {off:90, def_i:55, def_c:40, speed:6, cost:[  130,  200,  400,   65], cu:1, time: 2112, cap:50,  type:'i', prod: 20, mask:1, rs_time:9000},
    {off:55, def_i:120,def_c:90, speed:16,cost:[  555,  445,  330,  110], cu:2, time: 2816, cap:110, type:'c', prod: 21, mask:6, rs_time:9000},
    {off:195,def_i:80, def_c:75, speed:9, cost:[  660,  495,  995,  165], cu:3, time: 3432, cap:80,  type:'c', prod: 21, mask:1, rs_time:11000},
    {off:65, def_i:30, def_c:80, speed:4, cost:[  525,  260,  790,  130], cu:3, time: 4620, cap:0,   type:'i', prod: 22, mask:65,rs_time:15000},
    {off:50, def_i:60, def_c:10, speed:3, cost:[  550, 1240,  825,  135], cu:6, time: 9900, cap:0,   type:'i', prod: 22, mask:65,rs_time:28800},
    {off:40, def_i:60, def_c:40, speed:4, cost:[33450,30665,36240,13935], cu:4, time:77550, cap:0,   type:'i', prod: 26, mask:0, rs_time:24475, loyality:[20,25]},
    {off:10, def_i:80, def_c:80, speed:5, cost:[ 5115, 5580, 6045, 3255], cu:1, time:34100, cap:3000,type:'i', prod: 26, mask:0, rs_time:0}
  ],
  ];
  units.forEach(function(raceUnits, race){
    raceUnits.forEach(function(unit, idx){
      unit.idx = idx;
      unit.race = race;
    });
  });
  var t4 = extend(units, [
    [ { time: 1600, rs_time: 6600 },
      { time: 1760, rs_time: 7080 },
      { time: 1920, rs_time: 7560 },
      { time: 1360, rs_time: 5880 },
      { time: 2640, rs_time: 9720 },
      { time: 3520, rs_time:12360 },
      { time: 4600 },
      { time: 9000 },
      { time:90700 },
      { time:26900 }
    ], [
      { time:  720, rs_time: 3960 },
      { time: 1120, rs_time: 5160 },
      { time: 1200, rs_time: 5400 },
      { time: 1120, rs_time: 5160 },
      { time: 2400, rs_time: 9000 },
      { time: 2960, rs_time:10680 },
      { time: 4200 },
      { time: 9000 },
      { time:70500 },
      { time:31000 }
    ], [
      { time: 1040, rs_time: 4920 },
      { time: 1440, rs_time: 6120 },
      { time: 1360, rs_time: 5880 },
      { time: 2480, rs_time: 9240 },
      { time: 2560, rs_time: 9480 },
      { time: 3120, rs_time:11160, def_i:60 },
      { time: 5000 },
      { time: 9000 },
      { time:90700 },
      { time:22700 }
    ]
  ]);
  var t5 = extend(t4, [
  [ { cost:[   75,   50, 100,  0] },
    { cost:[   80,  100, 160,  0] },
    { cost:[  100,  110, 140,  0] },
    { cost:[  100,  140,  10,  0] },
    { cost:[  350,  260, 180,  0] },
    { cost:[  280,  340, 600,  0] },
    { cost:[  700,  180, 400,  0] },
    { cost:[  690, 1000, 400,  0] },
    { cost:[30750,27200,45000, 0] },
    { cost:[ 3500, 3000, 4500, 0] }
  ],
  [ { cost:[   85,   65,   30, 0] },
    { cost:[  125,   50,   65, 0] },
    { cost:[   80,   65,  130, 0] },
    { cost:[  140,   80,   30, 0] },
    { cost:[  330,  170,  200, 0] },
    { cost:[  280,  320,  260, 0] },
    { cost:[  800,  150,  250, 0] },
    { cost:[  660,  900,  370, 0] },
    { cost:[35500,26600,25000, 0] },
    { cost:[ 4000, 3500, 3200, 0] }
  ],
  [ { cost:[   85,  100,   50, 0] },
    { cost:[   95,   60,  140, 0] },
    { cost:[  140,  110,   20, 0] },
    { cost:[  200,  280,  130, 0] },
    { cost:[  300,  270,  190, 0] },
    { cost:[  300,  380,  440, 0] },
    { cost:[  750,  370,  220, 0] },
    { cost:[  590, 1200,  400, 0] },
    { cost:[30750,45400,31000, 0] },
    { cost:[ 3000, 4000, 3000, 0] }
  ]
  ]);
  var t3 = extend(units, [
    { 9: { cost: [ 5800, 5300, 7200, 5500] } },
    { 9: { cost: [ 7200, 5500, 5800, 6500] } },
    { 9: { cost: [ 5500, 7000, 5300, 4900] } }
  ]);
  var t25 = extend(t3, {
    0: [ { cost: [120, 100, 180, 40] } ],
    2: [ { cap: 30 } ]
  });
  units.t5 = t5;
  units.t4 = t4;
  units.t3 = t3;
  units['t2.5'] = t25;
  return units;
}());
function hasUpgrades (unit) {
  return unit.tribe !== 4
    && unit.tribe !== 5
    && unit.idx < 8;
}
var Combat = {
  upgCoeff: [],
  _std_upg: function (stat, cu, lvl, s) {
        var v = parseVersion(s || "1.40"),
            T4 = v.major >= 4;
        cu /= (1 + 0.007*T4);
    return stat + (stat + 300*cu/7) * this.upgCoeff[lvl] + T4 * cu * 0.0021;
  },
  _cat_upg: function (stat, cu, lvl) {
    return Math.round(200 * Math.pow(1.0205, lvl)) / 10;
  },
  upgrade: function(u, type, lvl, s) {
    switch (type) {
      case 'off':   return this._std_upg(u.off,   u.cu, lvl, s);
      case 'def_i': return this._std_upg(u.def_i, u.cu, lvl, s);
      case 'def_c': return this._std_upg(u.def_c, u.cu, lvl, s);
      case 'off_s': return this._std_upg(35,      u.cu, lvl, s);
      case 'def_s': return this._std_upg(20,      u.cu, lvl, s);
      case 'dmlsh': return this._cat_upg(20,      u.cu, lvl, s);
    default:
      return 0;
    }
  }
};

(function (a) {
  var i;
  for (i = 0; i <= 20; i++) {
    a.push(Math.pow(1.007, i) - 1);
  }
}(Combat.upgCoeff));

var researchCostCoeffs = (function(){
  var stdCost = {
    b: [100, 100, 200, 160],
    k: [6, 4, 8, 6],
    t: 3
  },
  adminCost = {
    k: [0.5, 0.5, 0.8, 0.6],
    b: [500, 200, 400, 160],
    t: 0.25
  },
  nullCost = {
    k: [0, 0, 0, 0],
    b: [0, 0, 0, 0],
    t: 0
  };
  return [stdCost, stdCost, stdCost, stdCost, stdCost, stdCost, stdCost, stdCost, adminCost, nullCost];
}());

function unitUpgradeCost(lvl) {
    var c = Math.pow(lvl, 0.8),
        u;
  if (!this.upgCost) {
    u = this.cu;
    this.upgCost = this.cost.map(function(val, idx){
      return (val * 7 + b[idx]) / u;
    });
  }
  return this.upgCost.map(function (e) { return Round5(e * c); });
}

var CC = 450;

function rebuildUpgs(unit_stats) {
  var result = [[],[]], // 21
      r, l;
  for (r = 0; r < 4; r++) {
    result[0][r] = k[r] * unit_stats.cost[r] + b[r];
    result[1][r] = (unit_stats.cost[r] * 7 + b[r]) / unit_stats.cu;
  }
  for (l = 20; l > 1; l--) {
    if (!result[l]) { result[l] = []; }
    for (r = 0; r < 4; r++) {
      result[l][r] = Round5(result[1][r] * coeff[l]);
    }
  }
  return result;
}

function rebuildUpgTime(_unit_stats, _smith_lvl, _spd) {
  var r0, r1, l,
      result = [
        r0 = timeS2R(_unit_stats.rs_time) / _spd,
        r1 = r0 * Math.pow(0.964, _smith_lvl-1)
      ];
  for (l = 2; l <= 20; l++) {
    result.push(r1 * coeff[l]);
  }
  return result;
}

function cost_upg(_unit_stats, lvl) {
  var r,
      result = [];
  for (r = 0; r < 4; r++) {
    result.push(Round5(
      coeff[lvl] * (_unit_stats.cost[r] * 7 + b[r]) / _unit_stats.cu
    ));
  }
  return result;
}

function calc_upg(_unit_stats, type, lvl) {
  return Combat.upgrade(_unit_stats, type, lvl);
}

function calc_at(_unit_stats, type, lvl) {
  return sum(cost_upg(_unit_stats, lvl+1)) * calc_upg(_unit_stats, type, lvl) /
  ((sum(_unit_stats.cost) + CC*_unit_stats.cu) * (calc_upg(_unit_stats, type, lvl+1) - calc_upg(_unit_stats, type, lvl)));
}

function rebuildUnitMethod(fn, max) {
  return function (_unit_stats) {
    var result = [], lvl;
    var props = ['off', 'def_i', 'def_c', '%reserverd%', 'scan', 'def_s', 'dmlsh'].filter(function (name, idx) {
      return _unit_stats.mask & (1 << idx);
    });
    for (lvl = 0; lvl < max; lvl++) {
      result.push(props.map(function (name) {
        return fn(_unit_stats, name, lvl);
      }));
    }
    return result;
  };
}
var rebuildUnitStats = rebuildUnitMethod(calc_upg, 21),
    rebuildUnitAt = rebuildUnitMethod(calc_at, 20);

function calcUnits(unit_cost, res) {
  var sum = 0,
      tc = 0,
      r;
  for (r = 0; r < 4; r++) {
    tc += unit_cost[r];
    sum += res[r]; 
  }
  var result = {
    nr: sum / tc,
    res: [0,0,0,0]
  };
  var accum = 0;
  for (r = 0; r < 4; r++) {
    accum += unit_cost[r] * result.nr;
    result.res[r] = Math.round(accum);
  }
  for (r = 3; r > 0; r--) {
    result.res[r] -= result.res[r - 1];
  }
  return result;
}
