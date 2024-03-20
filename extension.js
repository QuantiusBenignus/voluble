/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const GETTEXT_DOMAIN = 'voluble-indicator-extension';
const { GObject, St, Gio, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const MTray = imports.ui.messageTray;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const _ = ExtensionUtils.gettext;


const Voluble = GObject.registerClass(
class Voluble extends PanelMenu.Button {
	_init() {
		super._init(0.0, _('Voluble indicator'));
		this.free = true; //Flag to lock only the voluble thread while speaking
		this.enabled = true; // Flag to keep track of Muted/Unmuted state
		this.vol_tmp_filepath = GLib.build_filenamev([GLib.get_user_runtime_dir(), 'voluble.tmp']);
		this.icon1 = new St.Icon({
			icon_name: 'audio-volume-overamplified-symbolic-rtl',
			style_class: 'system-status-icon',
		});
		this.add_child(this.icon1);

		this.itemED = new PopupMenu.PopupMenuItem(_('🐧 Mute TTS'));
		this.itemED.connect('activate', this._toggleTTS.bind(this));
		this.menu.addMenuItem(this.itemED);

		let item2 = new PopupMenu.PopupMenuItem(_('🐧 About'));
		item2.connect('activate', () => {
			//Main.notify(_('Voluble announces your desktop notifications out-loud. \n You can find more details and leave feedback on GitHub'));
			this._notifyVoluble(_('About Voluble.'), _('Voluble announces your desktop notifications out-loud. \n You can find more details and leave feedback on GitHub.'), 'lang-variable-symbolic');
		});
		this.menu.addMenuItem(item2);
/*  Is this code actually needed (are there persistent/resident sources to track?) 
		const existingSources = Main.messageTray.getSources();
		existingSources.forEach((source) => {
			source.connect('notification-added', (_, notification) => {
				this._extractNotificationInfo(notification);
			});
		});
*/
		Main.messageTray.connect('source-added', (_, source) => {
			source.connect('notification-added', (_, notification) => {
			if (this.free && this.enabled) {
				this._extractNotificationInfo(notification);
			}
			});
		});
	}

	_toggleTTS() {
		// Toggle extension state
		this.enabled = !this.enabled;
		// Update menu item label
		this.itemED.label.text = _(this.enabled ? '🐧 Mute TTS' : '🐧 Unmute TTS');
		this.icon1.set_icon_name(this.enabled ? 'audio-volume-overamplified-symbolic-rtl' : 'audio-volume-muted-symbolic-rtl'); 
		// Perform any other actions based on extension state
	}

	_extractNotificationInfo(notification) {
		// Extract title and description from the notification
		const title = notification.title;
		const description =  notification.body || notification.bannerBodyText || ' ';
		try {
			this.free = false;
			const file = Gio.File.new_for_path(this.vol_tmp_filepath);
			const textenc = new TextEncoder();
			const bytes = textenc.encode(title+' '+description);
			const [ok, etag] = file.replace_contents(bytes, null, false,
				Gio.FileCreateFlags.REPLACE_DESTINATION, null);
			if (ok) {
				try {
					const proc = Gio.Subprocess.new(['voluble'],Gio.SubprocessFlags.NONE);
					const success = proc.wait_check_async(null, () => {this.free = true;});
				} catch (e) {
					logError(e, 'Error spawning voluble!');
					this.free = true;
				}
				}
		} catch (e) {
			logError(e, 'I/O error!');
		}
	}

	_notifyVoluble(msg, details, icon) {
		// Create a custom multiline notification on pressing About
		let source = new MTray.Source("Voluble Notification", icon);
		Main.messageTray.add(source);
		// Create the notification
		let notification = new MTray.Notification(source, msg, details);
		notification.setTransient(true);
		// Show the notification
		source.showNotification(notification);
	}

});

class Extension {
	constructor(uuid) {
		this._uuid = uuid;
		ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
		
	}

	enable() {
		this._ctux = new Voluble();
		Main.panel.addToStatusArea(this._uuid, this._ctux);
	}

	disable() {
		if (this._ctux) {
			this._ctux.destroy();
			this._ctux = null;
		}
	}
}

function init(meta) {
	return new Extension(meta.uuid);
}
