// ninja-fast factorial function with caching
Math.factorial = (function() {
  var cache = [1];
  return function(n) {
    return cache[n] ? cache[n] : cache[n] = n * Math.factorial(n - 1);
  };
})();

var lcModel = {
  inflections: [],
  a: [],
  getMin: function(num) {
    if (!num) num = this.getCount();
    var r = 0;
    for(var i = 0; i < num; i++) {
      var elt = this.a[i];
      r += elt[0];
    }
    return r;
  },
  getMax: function(num) {
    if (!num) num = this.getCount();
    var r = 0;
    for(var i = 0; i < num; i++) {
      var elt = this.a[i];
      r += elt[1];
    }
    return r;
  },
  getMul: function(num) {
    if (!num) num = this.getCount();
    var r = 1;
    for(var i = 0; i < num; i++) {
      var elt = this.a[i];
      r *= (elt[1] - elt[0]);
    }
    return r;
  },
  getCount: function() {
    return this.a.length;
  },
  update: function(idx, lo, hi) { // 0-based index
    if ((this.a[idx][0] != lo)
    || (this.a[idx][1] != hi)) {
      this.a[idx] = [lo, hi];
      this.reinflect(idx+1);
    }
  },
  add: function(lo, hi) {
    this.a.push([lo, hi]);
    // reinflect is unneccessary here
  },
  del: function(idx) { // 0-based index
    this.a.splice(idx, 1);
    this.reinflect();
    for (var i = idx, l = this.getCount(); i < l; i++) {
      this.reinflect(i+1);
    }
  },
  swap: function(idx) {
    var tmp = this.a[idx];
    this.a[idx] = this.a[idx+1];
    this.a[idx+1] = tmp;
    this._reinflect(idx + 1);
    this._reinflect(idx + 2);
  },
  clear: function() {
    this.a = [];
    this.inflections = [];
  },
  reinflect: function(num) { // 1-based index
    if (!num) num = this.getCount();
    for (var i = num; i <= this.getCount(); i++) {
      this._reinflect(i);
    }
  },
  _reinflect: function(num) { // 1-based index
    var b2 = 1 << num;
    this.inflections[num - 1] = [];
    var infl = this.inflections[num - 1];
    for (var mask = 0; mask < b2; mask++) {
      var sum = 0, count = 0, elt;
      for (var i = 0; i < num; i++) {
        if (mask & (1 << i)) {
          elt = this.a[i];
          sum += elt[1] - elt[0];
          count++;
        }
      }
      var sign = 1 - 2 * (count % 2);
      var point = infl.find(function (e) { return e.value === sum });
      if (point) {
        point.sign += sign;
      } else {
        infl.push({'value': sum, 'sign': sign});
      }  
    }
    infl.sort(function (a, b) { return a.value - b.value; });
  },
  probability: function(threshold) {
    var a = [];
    var p = 0, new_p = 0;
    for (var i = 0, l = this.getCount(); i < l; i++) {
      new_p = this.prob(threshold, i+1);
      a.push(new_p - p);
    }
    return a;
  },
  prob: function(threshold, num) {
    var infl = this.inflections[num-1];
    var min = this.getMin(num);
    var max = this.getMax(num);
    var V = this.getMul(num);
    if (threshold > max) return 0;
    if (threshold < min) return 1;
    threshold -= min;
    var i = 0, sum = 0, elt;
    while ((elt = infl[i++]) && (elt.value < threshold)) {
      sum += elt.sign * Math.pow(threshold - elt.value, num);
    }
    return (V - sum / Math.factorial(num)) / V;
  },
  cycled: function(threshold) {
    return [
      Math.ceil(threshold / lcModel.getMax()),
      Math.ceil(threshold / lcModel.getMin())
    ];
  }
};

/**
 * @class BitBlockEncoder
 */
/**
 * @constructor
 * @throws Exception
 * @param {string} abc alpabet for encoding
 * @param {string|?} stream some stream data
 */
function BitBlockEncoder(abc, stream) {
  this.ABC = BitBlockEncoder.alphabets[abc];
  var l = this.ABC.length;

  var bin = l.toString(2);
  if (!bin.match(/^10+$/)) throw "Non 2^n sized alphabet";
  this.blockSize = bin.length - 1;
  
  this.blockMask = (1 << this.blockSize) - 1;
  for (var i = 0; i < l; i++) {
    this.ABCi[this.ABC.charCodeAt(i)] = i;
  }
  
  if (stream) this.adopt(stream);
}

/**
 * @var {number} buffer for half-filled current block
 * @private
 */
BitBlockEncoder.prototype.buffer = 0;

/**
 * @var {number} count internal pointer for stream seeking
 * @private
 */
BitBlockEncoder.prototype.count = 0;

/**
 * @var {string} stream stream itself
 * @private
 */
BitBlockEncoder.prototype.stream = "";

/**
 * @var {number} count actual amount of stored bits
 * @private
 */
BitBlockEncoder.prototype.len = 0;

/**
 * @var {string} ABC alphabet for encoding
 * @private
 */
BitBlockEncoder.prototype.ABC = "";

/**
 * @var {string[]} ABCi inverse alphabet index table
 * @private
 */
BitBlockEncoder.prototype.ABCi = [];

/**
 * @var {number} blockSize size of the block.
 * @example 6 for base64 and 8 for bytes
 * @private
 */
BitBlockEncoder.prototype.blockSize = null;

/**
 * @var {number} blockMask bit mask for block
 * @private
 */
BitBlockEncoder.prototype.blockMask = null;


/**
 * helper function for stream init
 * //@throws Exception
 * @return {BitBlockEncoder} this
 * @protected
 */
BitBlockEncoder.prototype.adopt = function(str) {
/*  if (m = str.match(/[^A-Za-z0-9\/+-]/)) { // allow minus sign
    var chr = m[0];
    var idx = str.indexOf(chr);
    throw new Exception("Unexpected character: "+chr+" on pos: "+idx+" in input stream.");
  } */
  this.buffer = 0;
  this.count = 0;
  this.stream = str;
  this.len = str.length * this.blockSize;
  return this;
};

/**
 * flushes and returns stream as string
 * @return {string} stream in current alphabet
 * @private
 */
BitBlockEncoder.prototype.getStream = function() {
  this.flush();
  return this.stream;
};

/**
 * increases bit counter in stream and length
 * @param {number} b amount of new bits
 * @private
 */
BitBlockEncoder.prototype.inc = function(b) {
  if (!b) b = 1;
  this.count += b;
  this.len += b;
};

/**
 * resets a stream, i.e. rewinds internal pointer to the beginning
 * @protected
 */
BitBlockEncoder.prototype.reset = function() {
  this.flush();
  this.buffer = 0;
  this.count = 0;
  return this;
};

/**
 * clears a stream and resets pointer
 * @public
 */
BitBlockEncoder.prototype.clear = function() {
  this.reset();
  this.len = 0;
  this.stream = "";
  return this;
};

/**
 * dumps a bit representaion of stream. e.g.: "0010 1110 1 ... "
 * with blocks separated by space
 * @return {string} bin
 * @public
 */
BitBlockEncoder.prototype.bitDump = function() {
  var str,
    idx = 0,
    a = [];
  for (idx = 0, l = Math.floor(this.len/this.blockSize); idx < l; idx++) {
    str = this.ABCi[this.stream.charCodeAt(idx)].toString(2);
    while (str.length < this.blockSize) {
      str = "0" + str;
    }
    a.push(str);
  }
  var tail = this.len - idx*this.blockSize;
  if (tail > 0) {
    str = this.buffer.toString(2);
    while (str.length < tail) {
      str = "0" + str;
    }
    a.push(str);
  }
  return a.join(" ");
};

/**
 * dumps a hex representaion of stream. e.g.: "DEADBEEF... "
 * @todo        test this!
 * @return {string}
 * @public
 */
BitBlockEncoder.prototype.hexDump = function() {
  var idx = 0, a = [];
  var saved = {
    count: this.count,
    buffer: this.buffer
  };
  this.flush();
  this.count = 0; // reset
  for (idx = 0, l = Math.floor(this.len/4); idx < l; idx++) {
    a.push(this.alphabets.BASE16.charAt(
      this.getNbit(4)
    ));
  }
  var tail = this.len - idx*4;
  if (tail > 0) {
    a.push(this.alphabets.BASE16.charAt(
      this.getNbit(tail)
    ));
  }
  if (this.len % this.blockSize) { // was flushed
    this.stream = this.stream.replace(/.$/, "");
    this.buffer = saved.buffer;
  }
  this.count = saved.count;
  return a.join("");
};

/**
 * flushes buffer for last bit-block
 * @protected
 */
BitBlockEncoder.prototype.flush = function() {
  if (this.count > this.stream.length * this.blockSize) {
    this.pushBlock();
  }
};

/**
 * block-processing functions
 * @private
 */
BitBlockEncoder.prototype.popBlock = function() {
  var idx = Math.floor(this.count / this.blockSize);
  this.buffer = this.ABCi[this.stream.charCodeAt(idx)];
};
BitBlockEncoder.prototype.pushBlock = function() {
  this.stream += this.ABC.charAt(this.buffer);
  this.buffer = 0;
};

/**
 * adds a bit to stream
 * @param {number} b bit value
 * @public
 */
BitBlockEncoder.prototype.addBit = function(b) {
  var offset = this.count % this.blockSize;
  this.buffer += (b & 1) << (this.blockSize - 1 - offset);
  this.inc(1);
  if (offset == this.blockSize - 1) {
    this.pushBlock();
  }
  return this;
};

/**
 * gets a bit from stream
 * @throws {RangeError}
 * @return {number} bit value
 * @public
 */
BitBlockEncoder.prototype.getBit = function() {
  if (this.count == this.len) {
    throw new RangeError("Index "+(this.len)+"(bits) is out-of-bound.");
  }
  if (this.count % this.blockSize == 0) {
    var idx = Math.floor(this.count / this.blockSize);
    this.popBlock();
  }
  var sbs = this.blockSize - 1;
  var b = (this.buffer & (1 << sbs)) >> sbs;
  this.count++;
  this.buffer <<= 1;
  this.buffer &= this.blockMask;
  return b;
};

/**
 * adds an N-bit unsigned to stream
 * @param {number} bits amount of bits
 * @param {number} n bit value
 * @public
 */
BitBlockEncoder.prototype.addNbit = function(bits, n) {
  for (var b = bits - 1; b >= 0; b--) {
    this.addBit((n & (1 << b)) >> b);
  }
  return this;
};

/**
 * gets an N-bit unsigned from stream
 * @param {number} bits amount of bits
 * @return {number} int value
 * @public
 */
BitBlockEncoder.prototype.getNbit = function(bits) {
  var n = 0;
  for (var b = 0; b < bits; b++) {
    n <<= 1;
    n += this.getBit();
  }
  return n;
};

/**
 * @see RFC 3548
 */
BitBlockEncoder.alphabets = {
  BASE16: "0123456789ABCDEF",
  BASE32: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  BASE32HEX: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
  BASE64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  BASE64URL: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  BASE64XML_TOKENS: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.-",
  BASE64XML_IDENT: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_:",
  BASE64REG_EXP: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!-"
};

// helper
var inputHelper = {
  getValue: function(elt) {
    if (elt.type === 'checkbox') return elt.checked;
    if (elt.type === 'text'
    ||  elt.type === 'number') return elt.value;
    if (elt.tagName === 'SELECT') return elt.value;
  },
  setValue: function(elt, value) {
    if (elt.type === 'checkbox') elt.checked = value;
    if (elt.type === 'text'
    ||  elt.type === 'number') elt.value = value;
    if (elt.tagName === 'SELECT') elt.value = value;
  }
};

// controller
var ROW_OFFSET = 3;

function changeRace(event) {
  var race = parseInt(this.value);
  var cell = this.parentNode;
  cell.querySelector(".unit").className = "icon--scalable unit u" + ((race-1)*10 + 9);
  var row = cell.parentNode;
  row.querySelector(".brew_wrapper").style.display = raceUseBrewery(race) ? 'block' : 'none';
  var idx = row.rowIndex - ROW_OFFSET;
  // hack: don't do update on emulated event (used in importData)
  if (event) {
    state.updateAtk(idx, 'race', race);
  }
}

function changeNum() {
  var num = parseInt(this.value);
  var row = this.parentNode.parentNode;
  var idx = row.rowIndex - ROW_OFFSET;
  state.updateAtk(idx, 'num', num);
}

function changeBP() {
  var bp = this.checked;
  var row = this.parentNode.parentNode.parentNode;
  var idx = row.rowIndex - ROW_OFFSET;
  state.updateAtk(idx, 'bp', bp);
}

function changeBrew() {
  var brew = this.checked;
  var row = findParent(this, 'tr');
  var idx = row.rowIndex - ROW_OFFSET;
  state.updateAtk(idx, 'brew', brew);
}

function changePop(event) {
  var val = this.value;
  var row = this.parentNode.parentNode;
  var idx = row.rowIndex - ROW_OFFSET;
  if (!/^\d+$/.test(val)
  ||  /^0+$/.test(val)) {
    this.style.backgroundColor = "#f88";
    setTimeout(function () {
      this.style.backgroundColor = "#fff";
    }.bind(this), 500);
  }
  var pop = parseInt(val) || 1;
  if (idx >= 0) {
    state.updateAtk(idx, 'pop', pop);
  } else {
    state.pop = pop;
    state.updateAll();
  }
}

function add_row(data, idx) {
  var row = $('main_tbl').insertRow(idx + ROW_OFFSET);

  for (var i = 0; i < row_example.length; i++) {
    row.insertCell(i).innerHTML = row_example[i];
  }
  row.cells[2].className = "left";
  row.cells[3].className = "population"
  data.fm = data.pop; // pop input has "fm" class
  for (var p in data) {
    var elt = row.querySelector("." + p);
    if (elt) inputHelper.setValue(elt, data[p]);
  }
  // call handler to update race image
  if (data.race != 1) changeRace.call(row.querySelector(".race"));

  row.querySelector(".race").addEventListener('change', changeRace);
  row.querySelector(".delete_button").addEventListener('click', del_row);
  row.querySelector(".num").addEventListener('change', changeNum);
  row.querySelector(".bp").addEventListener('click', changeBP);
  row.querySelector(".brew").addEventListener('click', changeBrew);
  row.querySelector(".fm").addEventListener('input', changePop);

  return row;
}

function del_row(event) {
  event.preventDefault();
  var row = this.parentNode.parentNode;
  var idx = row.rowIndex - ROW_OFFSET;
  // remove events
  row.querySelector(".race").removeEventListener('change', changeRace);
  row.querySelector(".delete_button").removeEventListener('click', del_row);
  row.querySelector(".num").removeEventListener('change', changeNum);
  row.querySelector(".bp").removeEventListener('click', changeBP);
  row.querySelector(".brew").removeEventListener('click', changeBrew);
  row.querySelector(".fm").removeEventListener('input', changePop);
  row.parentNode.removeChild(row);
  state.delAtk(idx);
}

function setRace(row, race) {
  row.querySelector(".unit").className = "icon--scalable unit u" + ((race-1)*10 + 9);
}

// model
var adm_pow = [
  [20, 30],
  [20, 25],
  [20, 25],
  [ 0,  0],
  [200,200],
  [20, 25],
  [15, 30]
];
var base64e = new BitBlockEncoder("BASE64URL");
base64e.encode_10K3 = function(n) {
  var i = 0;
  while (i < 3 && n % 10 === 0) {
    n = Math.round(n / 10);
    i++;
  }
  this.addNbit(2, i);
  this.addNbit(17 - i*3, n);
};
base64e.encode_128_200 = function(n) {
  if (n <= 125) {
    this.addNbit(7, n);
  } else if (n === 200) {
    this.addNbit(7, 127);
  } else {
    this.addNbit(7, 126);
    this.addNbit(7, n - 125);
  }
};
base64e.decode_10K3 = function() {
  var i = this.getNbit(2);
  return this.getNbit(17 - i*3) * Math.pow(10, i);
};
base64e.decode_128_200 = function() {
  var n = this.getNbit(7);
  if (n === 127) { return 200; }
  if (n <= 125) { return n; }
  return 125 + this.getNbit(7);
};

var defaultAttacker = {
  race: 1,
  num: 1,
  brew: 0,
  bp: false,
  pop: 3000
};

function raceUseBrewery(race) {
  return true;
  // celebration server
  // return (race == 2);
}

function getHasMorale(str) {
  const v = parseVersion(str);
  return !(v.major === 4 && v.minor < 9 && v.minor >= 6);
}

var hasMorale = getHasMorale($('server').value);
$('server').addEventListener('change', function (e) {
  var newHasMorale = getHasMorale(e.target.value);
  if (newHasMorale !== hasMorale) {
    hasMorale = newHasMorale;
    state.updateAll();
  }
  $('main_tbl').classList.toggle('nopop', !hasMorale);
});

var state = {
  attackers: [],
  l: 100,
  bp: false,
  pop: 1000,
  save: function() {
    window.location.hash = "#" + state.exportData();
  },
  updateAll: function() {
    for (var i = 0, l = this.attackers.length; i < l; i++) {
      this.updateAtk(i);
    }
    this.save();
  },
  updateAtk: function(idx, field, value) {
    var curr = this.attackers[idx];
    if (field) {
      curr[field] = value;
      this.save();
    }
    var oratory = adm_pow[curr.race - 1];
    // moralebonus
    var morale = 1;
    if (hasMorale) {
      morale = Math.round(Math.pow(this.pop / curr.pop, 0.2) * 1000) / 1000;
      if (morale < 0.667) morale = 0.667;
      if (morale > 1.000) morale = 1.000;
    }
    // incorporate brewery effect into moralebonus
    if (raceUseBrewery(curr.race) && curr.brew) morale *= 0.5;
    var delta = (this.bp ? -5 : 0) + (curr.bp ? +5 : 0);
    var c = morale * curr.num;
    lcModel.update(
      idx,
      (oratory[0] + delta) * c,
      (oratory[1] + delta) * c
    );
    // redraw
    this.redraw();
    //this.save();
  },
  updateAtkNum: function() {
    var numElt,
      tries = lcModel.cycled(state.l);
    if (tries[0] === tries[1]) {
      tries = [tries[0]];
    }
    if (tries[0] === Infinity) {
      tries = ["&infin;"];
    }
    numElt = document.querySelector("#cycled_attacks b");
    if (numElt) {
      numElt.innerHTML = tries.join("&ndash;");
    } else {
      $('cycled_attacks').innerHTML += " <b>" + tries.join("&ndash;")+"</b>";
    }
  },
  redraw: function() {
    function fmt(p, s) {
      return Math.round(s * p) / s + "%";
    }
    var a = lcModel.probability(this.l);
    for(var i = 0; i < a.length; i++) {
      var c = lcModel.a[i];
      var row = $("main_tbl").rows[i + ROW_OFFSET];
      row.cells[4].innerHTML = fmt(c[0], 1) + "&ndash;" + fmt(c[1], 1);
      row.cells[5].innerHTML = fmt(100 * a[i], 100);
    }
    this.updateAtkNum();
  },
  addAtk: function(o) {
    var empty = true;
    for (var p in defaultAttacker) {
      if (p in o) {
        empty = false;
      } else {
        o[p] = defaultAttacker[p];
      }
    }
    if (empty && this.attackers.length) {
      o = JSON.parse(JSON.stringify(this.attackers.slice(-1)[0]));
    }
    add_row(o, this.attackers.length);
    this.attackers.push(o);
    lcModel.add(0, 0);
    this.updateAtk(this.attackers.length-1);
    if (empty) this.save();
  },
  delAtk: function(idx) {
    this.attackers.splice(idx, 1);
    lcModel.del(idx);
    this.updateAtkNum();
    this.save();
  },
  getRace: function(idx) {
    return this.attackers[idx].race;
  },
  exportData: function() {
    base64e.clear();
    base64e.addBit(this.bp);
    base64e.encode_128_200(this.l);
    base64e.encode_10K3(this.pop);
    base64e.addNbit(5, this.attackers.length);
    this.attackers.forEach(function (a) {
      if (a.race > 4) {
        base64e.addNbit(2, 0);
        base64e.addNbit(2, a.race - 6);
      } else {
        base64e.addNbit(2, a.race);        
      }
      base64e.addNbit(2, a.num);
      base64e.addBit(a.brew);
      base64e.addBit(a.bp);
      base64e.encode_10K3(a.pop);
    });
    var str = base64e.getStream();
    return str;
  },
  importData: function(str) {
    base64e.adopt(str);
    this.bp = base64e.getBit();
    this.l = base64e.decode_128_200();
    this.pop = base64e.decode_10K3();
    var l = base64e.getNbit(5);
    for (var i = 0; i < l; i++) {
      var race = base64e.getNbit(2);
      if (race === 0) {
        race = 6 + base64e.getNbit(2);
      }
      var num = base64e.getNbit(2);
      var brew = base64e.getBit();
      var bp = base64e.getBit();
      var pop = base64e.decode_10K3();
      this.addAtk({
        race: race,
        num:  num,
        brew: brew,
        bp:   bp,
        pop:  pop
      });
    }
  }
};


// init
state.pop = parseInt($('pop').value);
state.bp = $('bp').checked;
var hash = location.hash.replace(/^#/, "");
if (hash) {
  state.importData(hash);
  $('pop').value = state.pop;
  $('bp').checked = state.bp;
  $('loyality').innerHTML = state.l;
}


// controller
var el = $('slider');
//window.addEventListener('DOMContentready', function() {
el.value = state.l;
el.addEventListener('change', function () {
  state.save();
});
el.addEventListener('input', function () {
  state.l = this.value;
  state.redraw();
  $('loyality').innerHTML = this.value;
});

function setLoy(value) {
  el.value = value;
  state.save();
  state.l = value;
  state.redraw();
  $('loyality').innerHTML = value;
}

// certain top inputs
$('pop').addEventListener('input', changePop);
$('bp').addEventListener('click', function () {
  state.bp = this.checked;
  state.updateAll();
});

$('add_button').addEventListener('click', function(event){
  event.preventDefault();
  state.addAtk({});
});
if (!state.attackers.length) {
  state.addAtk({});
};