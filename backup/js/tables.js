function EventEmitter() {
  this._events = {};
}
EventEmitter.prototype.addEvent = function(type, handler) {
  if (!this._events[type]) {
    this._events[type] = [];
  }
  this._events[type].push(handler);
};
EventEmitter.prototype.addEvents = function(obj) {
  for (var type in obj) {
    this.addEvent(type, obj[type]);
  }
};
EventEmitter.prototype.fireEvent = function(type, data) {
  (this._events[type] || []).forEach(function (handler) {
    handler.call(this, data);
  }, this);
};

/**
 * @class table model
 */
function DataTable() {
  EventEmitter.call(this);
  this.data = [];
  this.view = null;
}
DataTable.prototype = Object.create(EventEmitter.prototype);
DataTable.prototype.constructor = DataTable;

/**
 * updates one cell
 * @param {number} row index
 * @param {string} col column name
 * @param {unknown} value new value
 */
DataTable.prototype.setValue = function(row, col, value) {
  if (!this.data[row]) {
    this.data[row] = {};
  }
  var not_eqauls = false;
  if (typeof value == "object") {
    not_eqauls = (value.toString() != this.data[row][col].toString());
  } else {
    not_eqauls = (this.data[row][col] != value);
  }
  if (not_eqauls) {
    this.fireEvent('change', {
      idx: row,
      name: col,
      value: value
    });
    this.data[row][col] = value;
  }
};
/**
 * updates one row
 * @param {T} obj with values
 * @param {number} idx index of a row
 */
DataTable.prototype.updateRecord = function(obj, idx) {
  for (var field in obj) {
    this.setValue(idx, field, obj[field]);
  }
};

/**
 * updates one column
 * @param {T[]} values array of values
 * @param {string} field name of column
 */
DataTable.prototype.updateCol = function(values, field) {
  for (var i = 0, l = values.length; i < l; i++) {
    this.setValue(i, field, values[i]);
  }
};

/**
 * updates several rows
 * @param {Partial<T>[]} a array of new values - assoc.arrays
 */
DataTable.prototype.updateRecords = function(a) {
  for (var i = 0, l = a.length; i < l; i++) {
    this.updateRecord(a[i], i);
  }
};

function DataTableRangeSum(summators) {
  DataTable.call(this);
  /**
   * @var {[key: keyof in T]: (S[]) => string} assoc.array of summator objects
   */
  this.summators = summators;
}
DataTableRangeSum.prototype = Object.create(DataTable.prototype);
DataTableRangeSum.prototype.constructor = DataTableRangeSum;

/**
 * gets value from one cell
 * @param {number} row index
 * @param {string} col name
 * @param {*} value new value
 */
DataTableRangeSum.prototype.getValue = function(row, col) {
  if (!this.data[row]) {
    return undefined;
  }
  return this.data[row][col];
};

/**
 * updates sum row on updating 
 */
DataTableRangeSum.prototype.updateSum = function() {
  var obj = {};
  for (var col in this.summators) {
    var sm = this.summators[col];
    obj[col] = sm.func(this, col);
  }
  this.updateRecord(obj, "sumRow");
};

/**
 * updates range of summing
 * @param {number} low lower row index
 * @param {number} high upper row index (inclusive)
 */
DataTableRangeSum.prototype.updateRange = function(low, high) {
  this.rangeLow = low;
  this.rangeHigh = high;
  this.updateSum();
};

/**
 * updates several rows - overriding parent one
 * @param {Partial<T>[]} a new values
 */
DataTableRangeSum.prototype.updateRecords = function(a) {
  DataTable.prototype.updateRecords.call(this, a);
  this.updateSum();
};

/**
 * returns range of summing
 * @return {{ low: number, high: number }}
 */
DataTableRangeSum.prototype.getRange = function() {
  return {
    low: this.rangeLow,
    high: this.rangeHigh
  }
};


/* summators */
var SummatorHelper = {
  trivial: {
    defaultValue: 0,
    func: function(model, field) {
      var ranges = model.getRange();
      var val = this.defaultValue;
      for (var r = ranges.low; r <= ranges.high; r++) {
        val += model.getValue(r, field);
      }
      return val;
    }
  },
  delta: {
    defaultValue: 0,
    func: function(model, field) {
      var ranges = model.getRange();
      if (typeof ranges.low == "undefined") return "&mdash;";
      var subLowerValue = model.getValue(ranges.low-1, field);
      if (typeof(subLowerValue) == "undefined") {
        subLowerValue = this.defaultValue;
      }
      return model.getValue(ranges.high, field) - subLowerValue;
    }    
  }
}


/**
 * @class controller for dom table with "smart" update functionality
 */
/**
 * initialize object
 * @param {HTMLElement} table
 * @param {Object} options other options
 * @constructor
 */
function DOMTable(table, options) {
  EventEmitter.call(this);
  this.offsetTop = 0;
  this.offsetLeft = 0;

  /** @type {HTMLTableElement} */
  this._table = table;
  /** @type {string[]} */
  this.fields = options.fields;
  this.convert = options.convert;
  this.rowcount = 0;
  if (options) {
    if (options.offsetLeft) this.offsetLeft = options.offsetLeft;
    if (options.offsetTop) this.offsetTop = options.offsetTop;
  }
  table.addEventListener('mousemove', this.eventWrapperFactory('cellenter'));
  // table.addEvent('mouseleave', this.eventWrapperFactory('cellleave'));
  // table.addEvent('mouseleave', this.eventWrapperFactory('tableleave'));
  table.addEventListener('click', this.eventWrapperFactory('cellclick'));
}

DOMTable.prototype = Object.create(EventEmitter.prototype);
DOMTable.prototype.constructor = DOMTable;
  
/**
 * creates wrapper for DOM events, used to process own "software" events
 * @param {string} _type type of custom events
 * @see this.events
 */
DOMTable.prototype.eventWrapperFactory = function(_type) {
  var _self = this;
  return (function (evt) {
    var elt = evt.target;
    var tagName = elt.tagName.toLowerCase();
    if (tagName == "td") {
      _self.fireEvent(_type, {
        x: elt.cellIndex - _self.offsetLeft,
        y: elt.parentNode.rowIndex - _self.offsetTop,
        cell: elt
      });
    }
  });
};

/**
 * gets row of a table 
 * @param {number} row_idx
 * @private
 */
DOMTable.prototype.getRow = function(row_idx) {
  row_idx += this.offsetTop;
  if (row_idx < 0) {
    throw RangeError("row [" + row_idx + "] is out of range");
  }
  if (row_idx >= this._table.rows.length) {
    throw RangeError("row [" + row_idx + "] is out of range (" + this._table.rows.length + ")");
  }
  return this._table.rows[row_idx];
};

/**
 * actually updates cell in a table
 * @param {number} row_idx
 * @param {number} cell_idx
 * @param {unknown} value would be pasted into cell
 */
DOMTable.prototype.updateCell = function(row_idx, name, value) {
  if (typeof value == "undefined") return;
  var cell_idx = this.fields.indexOf(name);
  if (cell_idx == -1) return;
  var cell = this.getRow(row_idx).cells[cell_idx + this.offsetLeft];
  if (this.convert[name]) {
    this.convert[name](cell, value);
  } else {
    cell.textContent = value;
  }
};

/**
 * hides rows range (inclusive), determined by 2 numbers
 * @param {number} from lower index of rows
 * @param {number} to upper index of rows
 */
DOMTable.prototype.hideRows = function(from, to) {
  for (var i = from; i <= to; i++) {
    this.getRow(i).style.display = "none";
  }
};
/**
 * shows rows range (inclusive), determined by 2 numbers
 * @param {number} from lower index of rows
 * @param {number} to upper index of rows
 */
DOMTable.prototype.showRows = function(from, to) {
  for (var i = from; i <= to; i++) {
    this.getRow(i).style.display = "";
  }
};

/**
 * shows or hide columns determined by assoc.array
 * @param {[key: keyof T]: boolean} arr
 */
DOMTable.prototype.showCols = function(arr) {
  for (var r = 0, l = this._table.rows.length; r < l; r++) {
    var row = this._table.rows[r];
    for (name in arr) {
      var cell_idx = this.fields.indexOf(name);
      if (cell_idx != -1) {
        var cell = row.cells[cell_idx + this.offsetLeft];
        if (!cell) continue;
        cell.style.display = arr[name] ? "" : "none";
      }
    }
  }
};

/**
 * updates amount of rows
 * @param {number} n new rows count
 */
DOMTable.prototype.updateRowCount = function(n) {
  var delta = this.rowcount - n;
  var colCount = this._table.rows[1].cells.length;
  while (delta < 0) {
    var row = this._table.insertRow(n + delta+ this.offsetTop);
    for (var c = 0; c < colCount; c++) {
      row.insertCell(c);
    }
    delta++;
  }
  while (delta > 0) {
    this._table.deleteRow(n + delta + this.offsetTop - 1);
    delta--;
  }
  this.rowcount = n;
};


/**
 * @class DOMTable controller with range summator
 */
function DOMTableRangeSelect(table, options) {
  DOMTable.call(this, table, options);
  this.hoveredRows = [];
  for (var r = 0; r <= this.rowcount; r++) {
    this.hoveredRows[r] = "";
  }
  this.fromRow = this.UNSELECTED;
  this.toRow = this.UNSELECTED;
  this.state = this.STATES.SELECT_FROM;
  this.addEvent('cellenter', this._enter);
  this.addEvent('cellclick', this._click);
}
DOMTableRangeSelect.prototype = Object.create(DOMTable.prototype);
DOMTableRangeSelect.prototype.constructor = DOMTableRangeSelect;
DOMTableRangeSelect.prototype.classHover = "hover";
DOMTableRangeSelect.prototype.classActive = "active";
/**
 * @const class constant to indicate index of unselected bound
 */
DOMTableRangeSelect.prototype.UNSELECTED = -1;

/**
 * @const class constants set to indicate state of current selection
 */
DOMTableRangeSelect.prototype.STATES = {
  SELECT_FROM: 0,
  SELECT_TO: 1,
  SELECT_NONE: 2
};

/**
 * gets row of a table 
 * @param {number} row_idx
 * @return {HTMLTableRowElement}
 * @private
 */
DOMTableRangeSelect.prototype.getRow = function(row_idx) {
  if (row_idx == "sumRow") {
    var rr = this._table.rows;
    return rr[rr.length-1];
  }
  return DOMTable.prototype.getRow.call(this, row_idx);
};

/**
 * gets row of a table 
 * @param {number} row_idx
 * @param {string} className new class name
 * @private
 */
DOMTableRangeSelect.prototype.updateRowClass = function(row_idx, className) {
  var row = this.getRow(row_idx);
  var cl = this.hoveredRows[row_idx];
  if (className) {
    if (cl != className) {
      if (cl) row.classList.remove(cl);
      row.classList.add(className);
    }
  } else {
    if (cl) row.classList.remove(cl);
  }
  this.hoveredRows[row_idx] = className;
};

/**
 * event handler for cellenter
 * @private
 */
DOMTableRangeSelect.prototype._enter = function(evt) {
  if (evt.y < 0) return;
  if (evt.y >= this.rowcount) return;
  switch(this.state) {
    case this.STATES.SELECT_FROM:
      for (var r = 0, l = this.rowcount; r <= l; r++) {
        if (r == evt.y) {
          this.updateRowClass(r, this.classHover);
        } else {
          this.updateRowClass(r, "");
        }
      }
      break;
    case this.STATES.SELECT_TO:
      var low, high;
      if (this.fromRow < evt.y) {
        low = this.fromRow;
        high = evt.y;
      } else {
        low = evt.y;
        high = this.fromRow;
      }
      for (var r = 0; r < low; r++) {
        this.updateRowClass(r, "");
      }
      this.updateRowClass(low, this.classActive);
      for (var r = low+1; r < high; r++) {
        this.updateRowClass(r, this.classHover);
      }
      this.updateRowClass(high, this.classActive);
      for (var r = high+1; r <= this.rowcount; r++) {
        this.updateRowClass(r, "");
      }
      break;
    case this.STATES.SELECT_NONE: break;
  }
};

/**
 * event handler for click
 * @private
 */
DOMTableRangeSelect.prototype._click = function(evt) {
  if (evt.y < 0) return;
  if (evt.y >= this.rowcount) return;
  switch(this.state) {
    case this.STATES.SELECT_FROM:
      this._table.style.cursor = "n-resize";
      this.state = this.STATES.SELECT_TO
      this.fromRow = evt.y;
      break;
    case this.STATES.SELECT_TO:
      this._table.style.cursor = "";
      this.state = this.STATES.SELECT_NONE
      if (evt.y < this.fromRow) {
        this.toRow = this.fromRow;
        this.fromRow = evt.y;
      } else {
        this.toRow = evt.y;
      }
      this.fireEvent("rangeChange", {
        low: this.fromRow,
        high: this.toRow
      });
      break;
    case this.STATES.SELECT_NONE:
      this._table.style.cursor = "cell";
      this.state = this.STATES.SELECT_FROM;
      this.toRow = this.UNSELECTED;
      this.fromRow = this.UNSELECTED;
      for (var r = 0, l = this.rowcount; r <= l; r++) {
        this.updateRowClass(r, "");
      }
      this.fireEvent("rangeChange", {
        low: undefined,
        high: undefined
      });
      break;
  }
};

/**
 * sets selection range
 * @param {number} low index of a row
 * @param {number} high index of a row
 */
DOMTableRangeSelect.prototype.setRange = function(low, high) {
  this.state = this.STATES.SELECT_NONE;
  this.fromRow = low;
  this.toRow = high;
  for (var r = 0; r < low; r++) {
    this.updateRowClass(r, "");
  }
  this.updateRowClass(low, this.classActive);
  for (var r = low+1; r < high; r++) {
    this.updateRowClass(r, this.classHover);
  }
  this.updateRowClass(high, this.classActive);
  for (var r = high+1; r <= this.rowcount; r++) {
    this.updateRowClass(r, "");
  }
  this.fireEvent("rangeChange", {
    low: this.fromRow,
    high: this.toRow
  });
};


/* view helper */
var TableHelper = {
  cellNiceFixedFactory: function(digits) {
    return (function(cell, value) {
      if (value) {
        cell.innerHTML = value.toFixed ? value.toFixed(digits).replace(/(\.)?0+$/, "") : value;
      } else {
        cell.innerHTML = "&mdash;";
      }
    });
  },
  convertFactory: function(convertFunction) {
    return (function(cell, value) {
      cell.innerHTML = convertFunction(value);
    });
  },
  trivial: function(cell, value) {
    cell.innerHTML = value;
  }
}