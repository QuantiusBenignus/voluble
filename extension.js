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
        unmuted = true;
        
        _init() {
            super._init(0.0, _('Voluble indicator'));
            this.vol_tmp_filepath = GLib.build_filenamev([GLib.get_user_runtime_dir(), 'voluble.tmp']);
            
            this.icon = new St.Icon({
                icon_name: 'audio-volume-overamplified-symbolic-rtl',
                style_class: 'system-status-icon',
            });
            this.add_child(this.icon);
            
            // Read Selection
            const itemR = new PopupMenu.PopupMenuItem(_('💬 Read Selection'));
            itemR.connect('activate', this._readSelection.bind(this));
            this.menu.addMenuItem(itemR);
            
            // Summarize Selection
            this.itemS = new PopupMenu.PopupMenuItem(_('✍ Summarize Selection'));
            this.itemS.connect('activate', this._summarizeSelection.bind(this));
            this.menu.addMenuItem(this.itemS);

            // Mute TTS
            this.itemED = new PopupMenu.PopupMenuItem(_('🔇 Mute TTS'));
            this.itemED.connect('activate', this._toggleTTS.bind(this));
            this.menu.addMenuItem(this.itemED);
            
            // Shut up
            this.itemSU = new PopupMenu.PopupMenuItem(_('🛑 Stop Speaking'));
            this.itemSU.connect('activate', this._shutUP.bind(this));
            this.menu.addMenuItem(this.itemSU);

            // About
            this.itemA = new PopupMenu.PopupMenuItem(_('🦜 About'));
            this.itemA.connect('activate', () => {
                this._notifyVoluble(
                    _('About Voluble.'),
                    _('Voluble announces your desktop notifications out-loud, can read you the text you selected, or even provide you with a summary, with the help of a local AI. You can find more details and leave feedback on GitHub.'),
                    'lang-variable-symbolic'
                );
            });
            this.menu.addMenuItem(this.itemA);
        }

        _toggleTTS() {
            this.unmuted = !this.unmuted;
            this.itemED.label.text = this.unmuted ? _('🔇 Mute TTS') : _('🔊 Unmute TTS');
            this.icon.set_icon_name(
                this.unmuted ? 'audio-volume-overamplified-symbolic-rtl' : 'audio-volume-muted-symbolic-rtl'
            );
        }

        // Helper function to run voluble with text and arguments
        _runVoluble(text, args = []) {
            try {
                const file = Gio.File.new_for_path(this.vol_tmp_filepath);
                const encoder = new TextEncoder();
                const bytes = encoder.encode(text);
                
                const [ok, etag] = file.replace_contents(
                    bytes,
                    null,
                    false,
                    Gio.FileCreateFlags.REPLACE_DESTINATION,
                    null
                );
                
                if (ok) {
                    const command = ['voluble'].concat(args);
                    const proc = Gio.Subprocess.new(command, Gio.SubprocessFlags.NONE);
                    proc.wait_check_async(null, null);
                }
            } catch (e) {
                logError(e, 'Error running voluble');
            }
        }
        // Function ShutUP, to stop speech currently in progress
        _shutUP() {
            const command = ['pkill', '-SIGINT', '(ap|p)lay'];
            const proc = Gio.Subprocess.new(command, Gio.SubprocessFlags.NONE);
            proc.wait_check_async(null, null);
        }
    
        _summarizeSelection() {
            St.Clipboard.get_default().get_text(St.ClipboardType.PRIMARY, (clipboard, text) => {
                if (text) {
                    this._runVoluble(text, ['-s']);
                }
            });
        }

        _extractNotificationInfo(notification) {
            const title = notification.title;
            const description = notification.body || notification.bannerBodyText || ' ';
            const textToProcess = `${title} ${description}`;
            
            this._runVoluble(textToProcess);
        }

        _readSelection() {
            St.Clipboard.get_default().get_text(St.ClipboardType.PRIMARY, (clipboard, text) => {
                if (text) {
                    this._runVoluble(text);
                }
            });
        }

        _notifyVoluble(msg, details, icon) {
            // Create a custom multiline notification on pressing About
            let source = new MTray.Source("Voluble Notification", icon);
            Main.messageTray.add(source);
            let notification = new MTray.Notification(source, msg, details);
            notification.setTransient(true);
            source.showNotification(notification);
        }
    }
);

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
        this.mtid = null;
    }

	enable() {
		this._ctux = new Voluble();
		Main.panel.addToStatusArea(this._uuid, this._ctux);
		this.mtid = Main.messageTray.connect('source-added', (_, source) => {
			let sid = source.connect('notification-added', (_, notification) => {
				source.disconnect(sid);
				if (this._ctux.unmuted && notification.source.policy.showBanners) {
					this._ctux._extractNotificationInfo(notification);
				}
			});
		});
	}

    disable() {
        if (this._ctux) {
            this._ctux.destroy();
            this._ctux = null;
        }
        if (this.mtid) {
            Main.messageTray.disconnect(this.mtid);
            this.mtid = null;
        }
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
