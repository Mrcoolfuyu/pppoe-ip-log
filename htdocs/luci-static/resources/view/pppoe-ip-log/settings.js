'use strict';
'require view';
'require form';
'require fs';
'require ui';

function interfaceChoices() {
	return fs.exec('/usr/sbin/pppoe-ip-log', [ 'interfaces' ])
		.then(function (res) {
			var names = String(res.stdout || '').split('\n'),
			    out = { 'auto': _('Automatic (all PPPoE interfaces)') },
			    i;

			for (i = 0; i < names.length; i++)
				if (names[i] !== '')
					out[names[i]] = names[i];

			return out;
		})
		.catch(function () {
			return { 'auto': _('Automatic (all PPPoE interfaces)') };
		});
}

return view.extend({
	load: function () {
		return interfaceChoices();
	},

	render: function (data) {
		var choices = data || { 'auto': _('Automatic (all PPPoE interfaces)') },
		    m, s, o;

		m = new form.Map('pppoe-ip-log', _('PPPoE IP Log'),
			_('Record the public IP address of the monitored PPPoE interfaces whenever it changes.'));

		s = m.section(form.NamedSection, 'main', 'settings', _('General settings'));
		s.anonymous = false;

		o = s.option(form.Flag, 'enabled', _('Enable logging'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.ListValue, 'interface', _('Monitored interface'));
		o.default = 'auto';
		for (var k in choices)
			o.value(k, choices[k]);
		o.rmempty = false;

		o = s.option(form.Value, 'interval', _('Poll interval'),
			_('How often the current address is compared, in seconds.'));
		o.datatype = 'uinteger';
		o.default = '30';
		o.rmempty = false;

		o = s.option(form.Value, 'max_entries', _('Maximum log entries'),
			_('The oldest entries are discarded when this limit is reached. Use 0 for unlimited.'));
		o.datatype = 'uinteger';
		o.default = '500';
		o.rmempty = false;

		o = s.option(form.Flag, 'public_ip_lookup', _('Query public IP address'),
			_('Also discover the public-facing IPv4 address from an external echo service. ' +
			  'Useful when the WAN sits behind carrier-grade NAT (CGNAT) and only a 100.64.0.0/10 address is visible locally. ' +
			  'Disabled by default; the public address columns are only shown while this is enabled.'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.DynamicList, 'echo_url', _('Public IP echo URL(s)'),
			_('One or more URLs that return the caller IPv4 address as plain text. ' +
			  'They are tried in order until one succeeds.'));
		o.rmempty = true;

		return m.render();
	}
});
