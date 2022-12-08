function show(el, yes) {
	if (yes) {
		if ('hidden' in el) {
			el.hidden = false;
		} else {
			el.removeAttribute('hidden');
		}
	} else {
		if ('hidden' in el) {
			el.hidden = true;
		} else {
			el.setAttribute('hidden', '');
		}
	}
}
var report;
var hashToCheck;
log_wrapper.onpaste = function (event) {
	show(success, false);
	show(parse_error, false);
	if (event.clipboardData) {
		log_text.value = event.clipboardData.getData('text/plain');
		if (navigator.userAgent.indexOf('Firefox') !== -1) {
			event.preventDefault();
			this.innerHTML = event.clipboardData.getData('text/html');
		}
	} else if (window.clipboardData) {
		log_text.value = window.clipboardData.getData("Text");
	}
    setTimeout(function () {
		log_text.focus();
		runParse();
    });
}

var base64abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function compress(str) {
	var chunks = {};
	var out = '';
	for (var i = 0; i < str.length-4; i++) {
		var last = str.slice(i, i+4);
		if (!(last in chunks)) {
			chunks[last] = [i];
			out += str[i];
			continue;
		}
		var index = chunks[last].slice(-1)[0];
		var offset = i - index;
		if (offset >= 2048) {
			out += str[i];
			continue;
		}
		var j = 0;
		while (j < 127
			&& i+j < str.length
			&& str[index+j] === str[i+j]
		) {
			var clast = str.slice(i+j, i+j+4);
			if (!(clast in chunks)) {
				chunks[clast] = []
			}
			chunks[clast].push(i+j);
			j++;
		}
		var size = j;
		var block = (size << 11) + offset;
		var hexets = [block >> 12, (block >> 6) & 0x3F, block & 0x3F];
		out += "~" + hexets.map(function (b) { return base64abc[b]; }).join('');
		i += j - 1;
	}
	out += str.slice(i);
	return out;
}

function decompress(str) {
	var ABC = {};
	[].forEach.call(base64abc, function (c, i) {
		ABC[c] = i;
	});
	var out = '';
	for (var i = 0; i < str.length; i++) {
		if (str[i] === '~') {
			if (str[i+3] === '~') {
				var hexets = [
					64,
					ABC[str[++i]],
					ABC[str[++i]],
				];
			} else {
				var hexets = [
					ABC[str[++i]],
					ABC[str[++i]],
					ABC[str[++i]],
				];
			}
			var block = (hexets[0] << 12) + (hexets[1] << 6) + hexets[2];
			var size = block >> 11;
			var offset = block & ((1 << 11) - 1);
			while (size--) {
				out += out[out.length-offset];
			}
		} else {
			out += str[i];
		}
	}
	return out;
}

function runParse() {
	try {
		report = parse();
		if (!report) return;
		reports.push(report);
		submit(report);
		show(log_wrapper, false);
	} catch (e) {
		console.error(e);
		show(parse_error, true);
	}
}

function parse() {
	var reportLegends = $$('#reportWrapper')[0];
	var reportKingdoms = $$('#reportSingle')[0];
	var reportClassic = null;
	if (reportLegends) {
		return legends.parse(reportLegends);
	} else if (reportKingdoms) {
		return kingdoms.parse(reportKingdoms);
	} else if (reportClassic) {
		return null;
	}
}

function copyLink() {
	log_link.select();
	if (document.execCommand('copy')) {
		show(copy_result_good, true);
		setTimeout(function () {
			show(copy_result_good, false);
		}, 3000);
		log_link.selectionEnd = 0;
	} else {
		show(copy_result_fail, true);
		setTimeout(function () {
			show(copy_result_fail, false);
		}, 3000);
	}
}

function redactIds(side) {
	side.allianceId = 0;
	side.playerId = 0;
	side.villageId = 0;
}
function redactNames(side) {
	side.allianceName = '';
	side.playerName = '';
	side.villageName = '';
}
function cleanUp(report) {
	var lt = visibilitySettings._linkLevel;
	if (lt < 3) { delete report.hashCode; }
	if (lt < 2) { delete report.reportId; }
	if (lt < 1) { delete report.server; }
	var atk = visibilitySettings._attacker;
	if (atk.names < 2) { redactIds(report.attacker); }
	if (atk.names < 1) { redactNames(report.attacker); }
	var def = visibilitySettings._defender;
	if (def.names < 2) { redactIds(report.defender); }
	if (def.names < 1) { redactNames(report.defender); }
	report.items.forEach(function (item, i) {
		var side = i ? 'defender' : 'attacker';
		if (visibilitySettings['_' + side]._troops < 1) {
			item.troops = [];
		}
	});
}

var content = $$('.content')[0];
var visibilitySettings = {
	_linkLevel: 1,
	_allowedFull: false,
	_attacker: { _names: 1, _troops: 1 },
	_defender: { _names: 1, _troops: 1 }
};

function showPrivacyControls() {
	var node, labels;
	node = $$('.visibility_settings--global')[0];
	labels = $$('label', node);
	if (!report.hashCode) node.removeChild(labels[3]);
	if (!report.reportId) node.removeChild(labels[2]);
	changeGlobal(visibilitySettings._linkLevel);
	changeNames('attacker', visibilitySettings._attacker._names);
	changeNames('defender', visibilitySettings._defender._names);

	node = $$('.visibility_settings--attacker .troops')[0];
	if (report.items[0].troops[0] === null) {
		$$('input', node)[0].checked = false;
		$$('input', node)[0].disabled = true;
		node.classList.add('disabled');
	}

	node = $$('.visibility_settings--defender .troops')[0];
	if (report.items[1].troops[0] === null) {
		$$('input', node)[0].checked = false;
		$$('input', node)[0].disabled = true;
		node.classList.add('disabled');
	}
}

function submit(report, save) {
	var cl = content.classList;
	cl.remove('t3');
	cl.remove('t4');
	cl.remove('t4-old');
	cl.remove('t5');
	var v = getNumVersion(report);
	cl.add('t' + v);
	if (v === 4 && old_style.checked) {
		cl.add('t4-old');
	}
	show(try_again, false);
	show(parse_error, false);
	if (save) {
		cleanUp(report);
		report.overrides = {};
		$$(".info-switch").forEach(function (elt) {
			var key = elt.dataset.key;
			var value = +elt.value;
			if (!(key in report.overrides)) {
				report.overrides[key] = [];
			};
			report.overrides[key].push(value);
		});
	}
    fetch('/areport.php', {
		method: 'POST',
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: (save ? "save=&" : "") + "data=" + encodeURIComponent(JSON.stringify(report))
	})
	.then(function (r) {
		if (r.status > 200) {
			if (r.status in {500:1,404:1,403:1}) {
				show(try_again, true);
			} else {
				show(parse_error, true);
			}
			return;
		}
		if (save) {
			r.text().then(function (packed) {
				content.classList.remove('editing');
				report.overrides = {};
				$$(".info-switch").forEach(function (elt) {
					var text = elt.tagName === 'SELECT'
						? elt.options[elt.selectedIndex].innerText
						: elt.innerText;
					elt.parentNode.replaceChild(
						document.createTextNode(text),
						elt
					);
				});
				show(success, true);
				if (hashToCheck) {
					Cookie.write('bug-' + hashToCheck, '2', { duration: 365 });
					hashToCheck = null;
				}
				// strip BOM from reposonse
				report.link = packed.replace(/^\ufeff/, '');
				var links = reports
					.map(function (r) { return r.link; })
					.join(',');
					// .replace(/_/g, '/');
				if (reports.length > 1) {
					var ll = compress(links);
					if (ll.match(/~..~/)) {
						window.onerror("bad compresson: " + links, 'http://travian.kirilloid.ru/parser.js', 1, 1, { stack: links });
					} else if (decompress(ll) !== links) {
						window.onerror("unreversable compresson: " + links, 'http://travian.kirilloid.ru/parser.js', 1, 1, { stack: links });
					} else {
						links = '~A' + ll;
					}
				}
				if (links.length > 1800) {
					log_bind.checked = false;
					log_bind.disabled = true;
					log_bind.title = 'Link is too lonig, cannot add more';
				} else {
					log_bind.disabled = false;
					log_bind.title = '';
				}
				log_link.value = location.origin + location.pathname + '?log=' + links;
				// reset inputs
				log_text.value = '';
				show(log_wrapper, true);
				show(log_form, true);
				show(log_bind.parentNode, true);
			});
		} else {
			r.text().then(function (html) {
				var idx = reports.length - 1;
				var wrapper = document.createElement('div');
				wrapper.setAttribute('role', 'tabpanel');
				wrapper.tabindex = 0;
				wrapper.id = 'tp' + idx;
				wrapper.setAttribute('aria-labelledby', 't' + idx);
				wrapper.className = 'report';
				wrapper.innerHTML = html;
				if (!log_bind.checked) {
					$$('#report')[0].innerHTML = '';
					tabs.innerHTML = '';
					reportIdx = -1;
				}
				var cls = {scan:'eye',raid:'cap',atck:'atk'}[report.type];
				var tabContent = '<img src="img/x.gif" class="icon--scalable stats ' + cls +'">';
				$$('#report')[0].appendChild(wrapper);
				addTab(idx, tabContent);
				content.classList.add('editing');
				updateLinks(report, idx);
				showStats(report);
				showPrivacyControls();
			});
		}
	})
	.catch(function () {
		show(try_again, true);
	})
	.then(function () {
		if (!save) {
			show(log_form, false);
			log_wrapper.innerHTML = '';
			log_wrapper.contentEditable = true;
		}
	});
}

function clear2() {
	$$('#report')[0].removeChild($$('#report .report:last-child')[0]);
	log_wrapper.innerHTML = '';
	show(log_wrapper, true);
	log_text.value = '';
	show(log_form, true);
	show(stats, false);
	reports.pop();
	report = undefined;
	content.classList.remove('editing');
}

function changeGlobal(level) {
	if (level === 3 && !visibilitySettings._allowedFull) {
		if (confirm("Are you sure to share full report link?\nWhat is shared by that link is handled in the game.")) {
			visibilitySettings._allowedFull = true;
		} else {
			return;
		}
	}
	visibilitySettings._linkLevel = level;
	$$('.report:last-child .header .link').css('display', level ? '' : 'none');
	var link = $$('.report:last-child .header .link a')[0];
	var href = window[report.version].generateLink(report, level);
	if (link) {
		link.href = 'https://' + href;
		link.textContent = href;
	}
}
function changeNames(side, level) {
	visibilitySettings['_' + side]._names = level;
	if (level === 2) {
		visibilitySettings._linkLevel = Math.min(1, visibilitySettings._linkLevel);
		$$('.report:last-child .' + side + '-link').forEach(function (a) {
			a.href = a.dataset.href;
		});
	} else {
		$$('.report:last-child .' + side + '-link').forEach(function (a) {
			a.removeAttribute('href');
		});
	}
	$$('.report:last-child .' + side + '-info')
		.toggleClass('names-hidden', level === 0);
	var vilName = $$(".vilName")[+(side === 'defender')];
	if (vilName) vilName.innerHTML = level ? (report[side].villageName || '[?]') : '???';
}
function changeTroops(side, level) {
	visibilitySettings['_' + side]._troops = level;
	$$('.report:last-child .' + side + '-troops')
		.toggleClass('troops-hidden', level === 0);
}
document.addEventListener('change', function (event) {
	var el = event.target;
	if (el.name === 'global') {
		changeGlobal(+el.value);
	}
	if (el.name === 'attacker' || el.name === 'defender') {
		if (el.type === 'checkbox') {
			changeTroops(el.name, +el.checked);
		} else {
			changeNames(el.name, +el.value);
		}
	}
	if (el.className === 'info-switch') {
		var prev = el.previousElementSibling;
		if (prev.classList.contains('building')) {
			prev.className = prev.className.replace(/g\d+/, 'g' + el.value);
		}
	}
});
try_again_button.addEventListener('click', function () {
	submit(report);
});
log_report_button.addEventListener('click', function () {
    fetch('/areport.php', {
		method: 'POST',
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: "report=" + encodeURIComponent(log_wrapper.innerHTML)
	}).then(function(r) {
		return r.json();
	}).then(function (data) {
		Cookie.write('bug-' + data.hash, '1', { duration: 365 });
		if (!data.dup) {			
			alert("Saved for analysis, we'll inform you");
			window.onerror("unparsed report: " + data.hash, 'http://travian.kirilloid.ru/report.php', 1, 1);
		} else {
			alert("Already reported");
		}
	});
});
log_copy.addEventListener('click', copyLink);

function reprocessReport() {
	var hash = this.dataset.report;
	fetch('/areport.php?reportHash=' + hash)
		.then(function(r) { return r.text(); })
		.then(function(text) {
			log_wrapper.innerHTML = text;
			hashToCheck = hash;
			runParse();
		});
}

function showTab(n) {
	var tabEl = $$("#tabs .tab")[n];
	tabEl.classList.add('active');
	tabEl.removeAttribute('tabindex');
	tabEl.setAttribute('aria-selected', 'true');
	tabEl.focus();
	show($$("#report .report")[n], true);
}
function hideTab(n) {
	if (n === -1) return;
	var tabEl = $$("#tabs .tab")[n];
	tabEl.classList.remove('active');
	tabEl.setAttribute('tabindex', '-1');
	tabEl.setAttribute('aria-selected', 'false');
	show($$("#report .report")[n], false);
}
function activateTab(n) {
	if (n === -1) return;
	if (n >= reports.length) return;
	if (n === reportIdx) return;
	hideTab(reportIdx);
	showTab(reportIdx = n);
	updateLinks(reports[reportIdx], reportIdx);
	showStats(reports[reportIdx]);
}
function addTab(idx, content) {
	var tab = document.createElement('button');
	tab.setAttribute('role', 'tab');
	tab.id = 't' + idx;
	tab.tabindex = -1;
	tab.dataset.index = idx;
	tab.setAttribute('aria-controls', 'tp' + idx);
	tab.className = 'tab';
	tab.innerHTML = content;
	tabs.appendChild(tab);
	show(tabs, idx > 0);
	show(log_single, idx > 0);
	activateTab(idx);
}

tabs.addEventListener('click', function (event) {
	var tgt = event.target;
	if (tgt.getAttribute('role') !== 'tab') {
		tgt = tgt.parentNode;
	}
	if (tgt.getAttribute('role') !== 'tab') { return; }
	activateTab(+tgt.dataset.index);
});
tabs.addEventListener('keydown', function (event) {
	var l = reports.length;
	if (/^\d$/.test(event.key)) {
		activateTab(+event.key);
	} else switch (event.key) {
		case 'Home':
			activateTab(l - 1);
			break;
		case 'Left':
		case 'ArrowLeft':
			if (event.composed && event.metaKey) {
				activateTab(0);
			} else {
				activateTab((reportIdx - 1 + l) % l);
			}
			break;
		case 'End':
			activateTab(l - 1);
			break;
		case 'Right':
		case 'ArrowRight':
			if (event.composed && event.metaKey) {
				activateTab(l - 1);
			} else {
				activateTab((reportIdx + 1) % l);
			}
			break;
	}
});
old_style.addEventListener('click', function() {
	if (report && report.version === 'legends') {
		content.classList.toggle('t4-old', this.checked);
		Cookie.write('rcs', +this.checked, { duration: 365 });
	}
});
$$(".report-fixed-button").on('click', reprocessReport);

function calcTZ(serverTime, am) {
	var isoTime = new Date().toISOString().slice(11,19);
	var timeDiff = (
		timeS2I(serverTime) + (am === 'pm') * 43200 - timeS2I(isoTime)
	) / 3600;
	return Math.round(timeDiff * 4) / 4;
}

function domain2lang(domain) {
	var m;
	m = domain.match(/arabiat[sx]\d+\.travian.com/);
	if (m) return 'ar';
	m = domain.match(/t[sx]\d+\.balkan\.travian\.com/);
	if (m) return 'sl';
	m = domain.match(/\.travian(?:\.com?)?\.(\w+)/);
	if (m) return {
		sa:'ar',eg:'ar',
		bg:'bg',  ba:'bs',
		cz:'cs',
		dk:'da',  de:'de',
		gr:'el',
		com:'en',uk:'en',us:'en',au:'en',
		net:'es', cl:'es-CL',
		ee:'et',
		fi:'fi',  fr:'fr',  ir:'fa',
		il:'he',  hr:'hr',  hu:'hu',
		id:'id',  it:'it',
		jp:'ja',
		lt:'lt',  lv:'lv',
		my:'ms',
		nl:'nl',  no:'no',
		pl:'pl',  pt:'pt', br:'pt-BR',
		ro:'ro',  ru:'ru',
		sk:'sk',  si:'sl',  rs:'sr',  se:'sv',
		th:'th',  tr:'tr',
		vn:'vi',
		tw:'zh-TW',
	}[m[1]] || 'en';
	var m = domain.match(/([a-z]+)\dn?(x3)?\.kingdoms\.com/);
	if (m) return {com:'en',test:'en',nordic:'da',us:'en',}[m[1]] || m[1];
	return 'en';
}

function lang2langClass(lang) {
	return {
		fa: 'arabic',
		ar: 'arabic',
		ru: 'cyrillic',
		bg: 'cyrillic',
		// he: 'hebrew',
		el: 'greek',
		ja: 'latin',
		th: 'latin',
		vi: 'latin',
		zh: 'latin',
	}[lang] || 'latin';
}

var sui = [3, 3, 2, -1, 3, 3, 2];
function deduceType(report) {
	var attacker = report.items[0];
	if (attacker.troops.every(function (u, i) {
		return u === 0 || sui[attacker.tribe] === i;
	})) return 'scan';
	if (attacker.troops.some(function (u, i) {
		return u !== attacker.losses[i];
	})) return 'raid';
	return 'atck';
}

var legends = {
	generateLink: function (report, level) {
		var href = report.server;
		if (level >= 2) href += '/berichte.php?id=' + report.reportId;
		if (level >= 3) href += '|' + report.hashCode;
		return href;
	},
	_report: {},
	_side: {},
	parse: function(root) {
		this._report = { version: 'legends', items: [], };
		var parsed = 0;
		$$('.troopHeadline').forEach(function (hl) {
			var info = this._parseHeader(hl);
			if (!info) { return; }
			if (parsed === 0) {
				this._report.attacker = info;
			} else if (parsed === 1) {
				this._report.defender = info;
			}
			parsed++;
		}, this);
		this._report.info = this._parseInfo($$('.additionalInformation')[0]);
		$$('#log_wrapper .role').forEach(this._parseSide, this);
		this._report.title = (
			$$('.header .subject .text', root)[0] || // old reports
			$$('#log_wrapper .header .headline .subject')[0] || // new reports
			$$('#log_wrapper .subject')[0] // new reports - firefox
		).innerText;
		this._report.type = deduceType(this._report);
		this._parseGlobals(root);
		this._parseTime(root);
		return this._report;
	},
	_parseGlobals: function() {
		var link = $$('a[href$=".php"]', log_wrapper)[0];
		if (link) {
			var domain = link.hostname;
			this._report.server = domain;
			this._report.language = domain2lang(domain);
			this._report.languageClass = lang2langClass(this._report.language);
		}
		var activeVillage = $$('a[href*="newdid="].active')[0];
		if (!activeVillage) return;
		var m = activeVillage.search.match(/&id=([^&]+)/);
		if (!m) return;
		var parts = decodeURIComponent(m[1]).split('|');
		this._report.reportId = +parts[0];
		this._report.hashCode = parts[1];
	},
	_parseTime: function(elt) {
		/* var amElt = $$('#servertime .enTimeAppendix')[0];
		var serverTime = $$('#servertime .timer')[0].textContent.trim();
		if (serverTime) {
			this._report.tz = calcTZ(serverTime, amElt && amElt.textContent);
		} else {
			this._report.tz = 0;
		} */
		this._report.timeStr = (
			$$('.header .time .text', elt)[0] ||
			$$('#log_wrapper .time .text')[0] // Firefox
		).textContent;
	},
	_parseSide: function(elt) {
		if (!elt.querySelector('.units')) return;
		this._side = {};
		this._parseUnits(elt);
		this._report.items.push(this._side);
	},
	_parseHeader: function (elt) {
		var el, m, link, info = {};
		el = $$('span:first-child', elt)[0];
		if (el
		&& !el.classList.contains('noAlliance')
		&& !el.classList.contains('player')) { // nature is w/o alliance
			link = $$('a', el)[0];
			m = link.href.match(/allianz\.php\?aid=(\d+)/)
			 || link.href.match(/alliance\/(\d+)/);
			info.allianceName = link.innerText;
			if (m) info.allianceId = +m[1];
		}
		link = $$('.player', elt)[0];
		if (!link) return false;
		info.playerName = link.textContent;
		if (link.href) {
			m = link.href.match(/profile\/(\d+)/);
			if (m) info.playerId = +m[1];
		}
		link = $$('.village', elt)[0];
		if (!link) return false;
		if (link.href) {
			m = link.href.match(/karte\.php\?d=(\d+)/)
			 || link.href.match(/map\/(\d+)/);
			info.villageName = link.textContent;
			if (m) info.villageCoordsId = +m[1];
		}
		return info;
	},
	_parseUnits: function (elt) {
		$$('.units', elt).forEach(function (line, i) {
			var rowIconElt = $$('th i', line)[0];
			if (!rowIconElt) {
				var icons = $$('.uniticon .unit', line);
				if (!icons.length) {
					icons = $$('img.unit', line);
				}
				$$('.tribeIcon', line)
				this._side.tribe = Math.floor(icons[0].className.match(/u(\d+)/)[1] / 10);
				if (!this._report.unitNames) {
					this._report.unitNames = icons
						.slice(0, 10)
						.map(function (e) { return e.alt });
				}
				return;
			}
			rowIcon = rowIconElt.className;
			switch (rowIcon) {
			case 'troopCount':
				var nums = $$('.unit', line).map(function (e) {
					return e.textContent === '?' ? null : +e.textContent.trim();
				});
				this._side.troops = nums; 
				break;
			case 'troopDead':
				var nums = $$('.unit', line).map(function (e) {
					return +e.textContent.trim();
				});
				this._side.losses = nums;
				break;
			case 'troopWounded':
				var nums = $$('.unit', line).map(function (e, j) {
					return +e.textContent.trim();
				});
				this._side.wounded = nums;
				break;
			case 'trap':
				var nums = $$('.unit', line).map(function (e, j) {
					return +e.textContent.trim();
				});
				this._side.trapped = nums;
				break;
			}
		}, this);
		if (this._side.wounded && !this._side.trapped) {
			this._side.wounded.forEach(function (n, i) {
				this._side.losses[i] += n;
			}, this);
		}

	},
	_parseInfo: function (elt) {
		var info = { buildings: [], lines: [] };
		$$('.infos .gebIcon', elt).forEach(function (img) {
			var m = img.className.match(/\bg(\d+)Icon\b/);
			var buildingId = m && +m[1];
			var details = $$('b', img.parentElement).map(function (b) {
				return b.innerText; })
			.filter(Boolean)
			.map(Number)
			.filter(function (e) { return !isNaN(e); });
			if (details.length === 1) {
				info.buildings.push([buildingId, +details]);
			}
		});
		$$('.unit', elt).forEach(function (img) {
			if (/u\d?9/.test(img.className)) {
				info.loyalty = $$('b', img.parentElement)
					.map(function (b) { return +b.innerText; });
			}
		});
		$$('tbody', elt).forEach(function (body) {
			if (body.className === 'goods') {
				// if (body.querySelector('.carry')) {
				var resources = [].concat(
					$$('.resourceWrapper .value', body),
					$$('.res .rArea', body)
				).map(function (e) { return +e.textContent; });
				if (resources.length === 4) {
					info.resources = resources;
				}
				var cranny = $$('.rArea .g23Icon', body)[0];
				if (cranny) {
					info.cranny = +cranny.nextSibling.textContent;
				}
			} else if (body.className === 'infos') {
				$$('td', body).forEach(function (elt) {
					if (elt.innerText) {
						[].push.apply(
							info.lines,
							elt.innerText
								.trim()
								.replace(/\r(?=(\n|$))/g, '$1')
								.split('\n')
						);
					}
				});
			}
		});
		if (info.loyalty && info.loyalty.length === 0) delete info.loyalty;
		if (info.lines.length === 0) delete info.lines;
		if (info.buildings.length === 0) delete info.buildings;
		return info;
	},
};

var kingdoms = {
	generateLink: function (report, level) {
		var href = report.server;
		if (level >= 2) href += '/reportId:' + report.time.toString(16) + report.reportId;
		if (level >= 3) href += '/tokenId:' + report.hashCode;
		return href;
	},
	_report: {},
	_side: {},
	parse: function(root) {
		this._report = { version: 'kingdoms', items: [] };
		this._report.attacker = this._parseHeader($$('.actionFrom').slice(-1)[0]);
		this._report.defender = this._parseHeader($$('.actionTo').slice(-1)[0]);
		this._report.info = this._parseInfo(root);
		$$('.troopsDetailContainer').forEach(this._parseSide, this);
		this._report.type = this._parseType();
		this._parseGlobals(root);
		this._parseTime(root);
		return this._report;
	},
	_parseType: function() {
		var type = +$$('.troopsDetailContainer .reportIcon')[0]
			.getAttribute('tooltip-data')
			.match(/\d+$/)[0];
		return {
			3: 'atck',
			4: 'raid',
			5: 'rein',
			6: 'scan',
		   47: 'sieg',
		}[type] || 'atck';
	},
	_parseGlobals: function() {
		$$('[src^="http"]', log_wrapper).some(function (elt) {
			var src = elt.getAttribute('src');
			if (src.charAt(0) === "'") return false;
			var domain = src.split('/', 3)[2];
			if (domain === 'cdn.traviantools.net') return false;
			this._report.server = domain;
			this._report.language = domain2lang(domain);
			this._report.languageClass = lang2langClass(this._report.language);
			return true;
		}, this);
	},
	_parseTime: function(elt) {
		var timeElt = $$(".reportDate [i18ndt]")[1];
		var time = +timeElt.getAttribute('i18ndt');
		this._report.time = time;
		var timeDelta = timeS2I(timeElt.textContent) - time % 86400;
		if (timeDelta < -43200) { timeDelta += 86400; }
		this._report.tz = timeDelta / 3600;
	},
	_parseSide: function(elt) {
		this._side = {};
		this._parseUnits(elt);
		this._report.items.push(this._side);
	},
	_parseHeader: function (elt) {
		var info = {};
		var kingdom = $$('.playerAndKingdom [ng-if*="KingdomId"]', elt)[0];
		if (kingdom) {
			info.allianceName = kingdom.innerText.slice(1, -1);
		}
		var link = $$('.playerAndKingdom .playerLink', elt)[0];
		info.playerName = link.textContent;
		info.playerId = Math.max(0, +link.getAttribute('playerid'));
		var vil = $$('.fromVillage a', elt)[0];
		info.villageName = vil.innerText;
		info.villageCoordsId = Math.max(0, +vil.getAttribute('villageid'));
		return info;
	},
	_parseUnits: function (elt) {
		function stripHiddenSymbols(e) {
			var str = e.textContent.trim().replace(/[\u202d\u202c]/g, '');
			if (str === '-') return 0;
			if (str === '?') return null;
			if (str.endsWith('k')) return str.replace(/k$/, '000');
			return +str;
		}
		var troopsTable = $$('.troopsTable', elt)[0];
		['roman', 'teuton', 'gaul', 'nature', 'natar'].forEach(function (cls, i) {
			if (troopsTable.classList.contains(cls)) {
				this._side.tribe = i;
			}
		}, this);
		this._side.troops = $$('.originalTroops td', elt).map(stripHiddenSymbols);
		var trapped = $$('.trappedTroops tr:last-child td', elt).map(stripHiddenSymbols);
		if (trapped.length) { this._side.trapped = trapped; }
		var losses = $$('.lostTroops td', elt).map(stripHiddenSymbols);
		if (losses.length) { this._side.losses = losses; }
	},
	_parseInfo: function (elt) {
		var info = {
			buildings: [],
			lines: []
		};
		$$('.infoContainer .buildingInfo')
			.filter(function (e) { return e.getAttribute('ng-if') === 'infoModules.damage'; })
			.map(function (e) {
				var gid = +$$('.buildingLarge', e)[0]
					.getAttribute('tooltip-translate')
					.match(/Building_(\d+)/)[1];
				var lvls = e.innerText.match(/\d+/g).map(Number);
				info.buildings.push([gid, lvls[0], lvls[1]]);
			});
		$$('.infoContainer .resources').forEach(function (e) {
			info.resources = e.textContent.match(/\d+/g).map(Number);
			var tooltipShow = e.getAttribute('tooltip-show');
			if (tooltipShow) {
				tribute = JSON.parse(tooltipShow);
				tribute.length = 4;
				info.tribute = Array.from(tribute).slice(1);
			}
		});
		[].push.apply(info.lines,
			$$('.infoContainer .infoTable tr[ng-repeat^="infoText"] td')
				.map(function (e) { return e.innerText; })
		);
		$$('.infoContainer .treasures').forEach(function (e) {
			var nums = e.innerText.match(/\d+/g).map(Number);
			info.treasures = nums[0];
			info.fromRobbers = false;
			if (nums.length > 1) {
				info.victoryPoints = nums[1];
			}
		});
		$$('.infoContainer .stolenGoods').forEach(function (e) {
			info.fromRobbers = true;
			info.treasures = +e.innerText;
		});
		$$('.spyInfo[tooltip-translate*="Cranny"]').forEach(function (e) {
			info.cranny = +e.innerText;
		});
		$$('.spyInfo[tooltip-translate*="Treasury"]').forEach(function (e) {
			info.treasury = +e.innerText;
		});
		if (info.lines.length === 0) delete info.lines;
		if (info.buildings.length === 0) delete info.buildings;
		return info;
	},
}

function getNumVersion(report) {
	return {
		classic: 3,
		legends: 4,
		kingdoms: 5
	}[report.version];
}

function calcStats(report) {
	if (report) {
		var ver = getNumVersion(report);
		var tver = 't' + ver;
		show(stats, true);
		var offStats = armyStats(tver, 'off', undefined, report.items[0]);
		var defStats = report.items.slice(1)
			.reduce(armyStats.bind(null, tver, 'def'), getInitialStats());
	} else {
		var offStats = getInitialStats();
		var defStats = getInitialStats();
	}
	// total attack / def
	var ap = offStats.combat;
	var dp = defStats.combat;
	ap.t = ap.i + ap.c;
	dp.t = Math.round((dp.i * ap.i + dp.c * ap.c) / ap.t);
	// swap expirience fields
	var exp = offStats.exp;
	offStats.exp = defStats.exp;
	defStats.exp = exp;
	// FIXME: add support for broken links (report=null)
	/*
	offStats.heroes = report.items[0].troops[10];
	defStats.heroes = report.items.slice(1).reduce(function (a, i) {
		return a + (i.troops && i.troops[10]);
	}, 0); */
	return [offStats, defStats];
}

function showStats(report) {
	var root = document.getElementById('stats');
	root.className = '';
	function format(value, pow) {
		if (!value) return '&mdash;';
		value = Math.round(value / Math.pow(1e3, pow)) + '';
		value = value.replace(/(.*?)(.{1,3})$/, '$1&thinsp;<small>$2</small>');
		return value + ' kM'.charAt(pow);
	}
	function formatTime(t, s) {
		if (!t) return '&mdash;';
		if (s) return (t / 86400).toFixed(Math.max(0, 3 - s));
		var p = timeI2S(t).split(':');
		return p[0] + ':' + p[1] + (':' + p[2]).small();
	}
	function totalTime(t) {
		return t.i + t.c + t.s;
	}
	var el, els;
	var stats = calcStats(report);

	if (stats[0].cost.sum() === 0 && stats[1].cost.sum() === 0) {
		root.classList.add('zero-resources');
	}
	if (totalTime(stats[0].time) === 0 && totalTime(stats[1].time) === 0) {
		root.classList.add('zero-time');
	}

	var combatMax = Math.max(stats[0].combat.t, stats[1].combat.i, stats[1].combat.c);
	var combatPow = (combatMax > 3e5)
				  + (combatMax > 3e8);
	var resMax = Math.max(stats[0].cost.sum(), stats[1].cost.sum());
	var resPow = (resMax > 3e5)
			   + (resMax > 3e8);
	var upkeepMax = Math.max(stats[0].upkeep, stats[1].upkeep);
	var upkeepPow = +(upkeepMax > 3e5);

	var timeMax = Math.max(totalTime(stats[0].time), totalTime(stats[1].time));
	var timePow = Math.max(0, Math.floor(Math.log10(timeMax / 36000)));

	for (var i = 0; i < 2; i++) {
		var s = stats[i];
		el = $$("#stats .combat")[i];
		els = $$('span', el);
		if (report && report.type === 'scan') {
			root.classList.add('scan');
			els[0].innerHTML = format(s.combat.s, combatPow);
		} else {
			els[0].innerHTML = format(s.combat.t, combatPow);
			els[1].innerHTML = format(s.combat.i, combatPow);
			els[2].innerHTML = format(s.combat.c, combatPow);
		}

		var percentToShow;
		if (s.unknown && s.total === 0) {
			percentToShow = '?';
		} else if (s.total === 0) {
			percentToShow = '0 %';
		} else {
			var percent = (s.lost / s.total * 100);
			var log = Math.ceil(Math.log(s.total) * Math.LOG10E) - 2;
			var precision = Math.max(0, Math.min(log, 2));
			percentToShow = percent
				.toFixed(percent && precision)
				.replace(/(\.\d??)0+$/, '$1')
				.replace(/\.$/, '') + ' %';
		}
		$$('#stats .percent')[i].innerHTML = percentToShow;

		el = $$("#stats .resources")[i];
		els = $$('span', el);
		for (var r = 0; r < 4; r++) {
			els[r+1].innerHTML = format(s.cost[r], resPow);
		}
		els[0].innerHTML = format(s.cost.sum(), resPow);

		el = $$("#stats .time")[i];
		els = $$('span', el);
		els[0].innerHTML = formatTime(totalTime(s.time), timePow);
		els[1].innerHTML = formatTime(s.time.i, timePow);
		els[2].innerHTML = formatTime(s.time.c, timePow);
		els[3].innerHTML = formatTime(s.time.s, timePow);

		// var exp = s.heroes ? Math.round(s.exp / s.heroes) : '&mdash;';
		$$("#stats .exp span")[i].innerHTML = s.exp;
		$$("#stats .upkeep span")[i].innerHTML = format(s.upkeep, upkeepPow);
	}
	$$('#stats').css('display', '');
}

function updateLinks(report, idx) {
	if (!report) { return; }
	var ver = getNumVersion(report);
	log_single.value = "http://travian.kirilloid.ru/report.php?log=" + report.link;
	// generate links
	if (report.items[0].troops[0] !== null) {
		var offStats = calcStats(report)[0];
		$$('[id="warsim_link"]')[idx].hash = warsimLink(report, ver);
		$$('[id="offcalc_link"]')[idx].hash = offCalcLink(report, offStats);
	} else {
		$$(".toolbar")[idx].style.display = 'none';
	}
}


