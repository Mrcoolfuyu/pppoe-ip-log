'use strict';
'require view';
'require fs';
'require poll';
'require ui';

var STATUS_PATH = '/etc/pppoe-ip-log/status.json';
var LOG_PATH = '/etc/pppoe-ip-log/history.log';

function parseLog(text) {
	var lines = String(text || '').split('\n'),
	    rows = [],
	    i, line, f;

	for (i = 0; i < lines.length; i++) {
		line = lines[i].replace(/\r$/, '').replace(/\s+$/, '');
		if (line === '')
			continue;

		f = line.split('\t');
		if (f.length < 5)
			continue;

		if (f.length >= 7) {
			rows.push({
				epoch: parseInt(f[0], 10),
				time: f[1],
				iface: f[2],
				prevPub: f[3],
				nextPub: f[4],
				prevIf: f[5],
				nextIf: f[6]
			});
		} else {
			/* legacy format: interface address only */
			rows.push({
				epoch: parseInt(f[0], 10),
				time: f[1],
				iface: f[2],
				prevPub: null,
				nextPub: null,
				prevIf: f[3],
				nextIf: f[4]
			});
		}
	}

	return rows;
}

function humanDuration(secs) {
	var d, h, m, s;

	if (secs == null || isNaN(secs) || secs < 0)
		return null;

	secs = Math.floor(secs);
	d = Math.floor(secs / 86400);
	h = Math.floor((secs % 86400) / 3600);
	m = Math.floor((secs % 3600) / 60);
	s = secs % 60;

	if (d > 0)
		return d + 'd ' + h + 'h ' + m + 'm';
	if (h > 0)
		return h + 'h ' + m + 'm';
	if (m > 0)
		return m + 'm ' + s + 's';
	return s + 's';
}

function table(headers) {
	var tr = E('tr', { 'class': 'tr table-titles' }),
	    tbl = E('table', { 'class': 'table' }),
	    i;

	for (i = 0; i < headers.length; i++)
		tr.appendChild(E('th', { 'class': 'th' }, headers[i]));

	tbl.appendChild(tr);
	return tbl;
}

function emptyRow(tbl, colspan, text) {
	tbl.appendChild(E('tr', { 'class': 'tr' }, [
		E('td', { 'class': 'td', 'colspan': colspan }, E('em', {}, text))
	]));
	return tbl;
}

return view.extend({
	handleSave: null,
	handleSaveApply: null,
	handleReset: null,

	load: function () {
		return Promise.all([
			fs.read(STATUS_PATH).catch(function () { return null; }),
			fs.read(LOG_PATH).catch(function () { return ''; })
		]);
	},

	renderStatus: function (status) {
		var ifaces = (status && status.interfaces) || [],
		    now = status ? status.now : 0,
		    tbl = table([
				_('Interface'),
				_('Current address'),
				_('Public address'),
				_('Since'),
				_('Held for')
			]),
		    i, it, held;

		if (ifaces.length === 0)
			return emptyRow(tbl, 5, _('No data available.'));

		for (i = 0; i < ifaces.length; i++) {
			it = ifaces[i];
			held = (now && it.changed) ? humanDuration(now - it.changed) : null;

			tbl.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, it.interface || '-'),
				E('td', { 'class': 'td' }, it.up ?
					E('strong', {}, it.address || '-') :
					E('em', {}, _('no address'))),
				E('td', { 'class': 'td' }, (it.up && it.public_address) ?
					it.public_address : E('em', {}, _('unknown'))),
				E('td', { 'class': 'td' }, (it.up && it.changed_str) ? it.changed_str : '-'),
				E('td', { 'class': 'td' }, (it.up && held) ? held : '-')
			]));
		}

		return tbl;
	},

	renderHistory: function (rows) {
		var tbl = table([
				_('Time'),
				_('Interface'),
				_('Previous public'),
				_('New public'),
				_('Interface IP')
			]),
		    i, r, ifText;

		if (rows.length === 0)
			return emptyRow(tbl, 6, _('No address changes have been recorded yet.'));

		/* newest first */
		for (i = rows.length - 1; i >= 0; i--) {
			r = rows[i];
			ifText = [
				(r.prevIf && r.prevIf !== '-') ? r.prevIf : _('none'),
				' → ',
				r.nextIf || '-'
			];

			tbl.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, r.time || '-'),
				E('td', { 'class': 'td' }, r.iface || '-'),
				E('td', { 'class': 'td' }, (r.prevPub && r.prevPub !== '-') ?
					r.prevPub : E('em', {}, _('unknown'))),
				E('td', { 'class': 'td' }, E('strong', {}, (r.nextPub && r.nextPub !== '-') ?
					r.nextPub : E('em', {}, _('unknown')))),
				E('td', { 'class': 'td' }, ifText)
			]));
		}

		return tbl;
	},

	render: function (data) {
		var status = null,
		    rows = parseLog(data[1]);

		try {
			status = JSON.parse(data[0]);
		} catch (e) {
			status = null;
		}

		var body = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('PPPoE IP Log') +
				((status && status.version) ? ('  (v' + status.version + ')') : '')),
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Current status')),
				E('div', { 'id': 'pipl-status' }, this.renderStatus(status))
			]),
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Address change history')),
				E('div', { 'id': 'pipl-history' }, this.renderHistory(rows)),
				E('div', { 'style': 'margin-top:1em' }, [
					E('button', {
						'class': 'cbi-button cbi-button-neutral',
						'click': this.refresh.bind(this)
					}, _('Refresh now')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-negative',
						'click': this.handleClearRequest.bind(this)
					}, _('Clear log'))
				])
			])
		]);

		poll.add(this.refresh.bind(this), 10);

		return body;
	},

	refresh: function () {
		var self = this;

		return Promise.all([
			fs.read(STATUS_PATH).catch(function () { return null; }),
			fs.read(LOG_PATH).catch(function () { return ''; })
		]).then(function (data) {
			var status = null;

			try {
				status = JSON.parse(data[0]);
			} catch (e) {
				status = null;
			}

			var oldStatus = document.getElementById('pipl-status'),
			    oldHistory = document.getElementById('pipl-history');

			if (oldStatus && oldStatus.appendChild) {
				oldStatus.innerHTML = '';
				oldStatus.appendChild(self.renderStatus(status));
			}

			if (oldHistory && oldHistory.appendChild) {
				oldHistory.innerHTML = '';
				oldHistory.appendChild(self.renderHistory(parseLog(data[1])));
			}
		});
	},

	handleClearRequest: function () {
		var self = this;

		ui.showModal(_('Clear log'), [
			E('p', {}, _('Delete all recorded IP address changes? The current address will be recorded again immediately.')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-neutral',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': ui.createHandlerFn(self, 'handleClear')
				}, _('Clear'))
			])
		]);
	},

	handleClear: function () {
		ui.hideModal();

		return fs.exec('/usr/sbin/pppoe-ip-log', [ 'clear' ])
			.then(this.refresh.bind(this))
			.catch(function (err) {
				ui.addNotification(null, E('p', {},
					_('Unable to clear the log:') + ' ' + (err.message || err)));
			});
	}
});
