import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

// Assume _() is defined elsewhere for translations if needed
const _ = (str) => str;

const NOTIFICATION_PROCESSED_TIMEOUT_SECONDS = 20; // How long to keep notification ID

export default class Voluble extends Extension {
    _connections = [];
    _processedNotificationIds = new Set(); // Store IDs of processed notifications
    _notificationTimeouts = new Map();     // Store timeout source IDs (notification.id -> timeoutId)
    unmuted = true;
    vol_tmp_filepath = GLib.build_filenamev([GLib.get_user_runtime_dir(), 'voluble.tmp']);

    _runVoluble(text, commandArgs = []) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text);
        try {
            const file = Gio.File.new_for_path(this.vol_tmp_filepath);
            const [ok, etag] = file.replace_contents(bytes, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
            if (ok) {
                const command = ['voluble', ...commandArgs];

                let proc = Gio.Subprocess.new(
                    command,
                    Gio.SubprocessFlags.NONE
                );

                proc.wait_check_async(null, (source, res) => {
                    try {
                        source.wait_check_finish(res);
                        // log(`Voluble process finished successfully...`);
                    } catch (e) {
                        logError(e, `Voluble process was terminated for text: ${text.substring(0,50)}...`);
                        // this._notifyVoluble('Voluble Error', e.message);
                    }
                });
            } else {
                 //logError(new Error('Failed to write to voluble tmp file'), 'Error in runVoluble');
                 this._notifyVoluble('Voluble Error', _('Could not write temporary file.'));
            }
        } catch (e) {
            //logError(e, 'Error in runVoluble (process creation or file write)');
            this._notifyVoluble('Voluble Error', _('Failed to run Voluble command:') + ' ' + e.message);
        }
    }

    _toggleTTS() {
        this.unmuted = !this.unmuted;
        this.itemED.label.text = this.unmuted ? _('🔇 Mute Voluble') : _('🔊 Unmute Voluble');
        this._indicator.icon.set_icon_name(this.unmuted ? 'audio-volume-overamplified-symbolic-rtl' : 'audio-volume-muted-symbolic-rtl');
    }

    _shutUP() {
        try {
             const command = ['sh', '-c', 'pkill -SIGINT "voluble" && pkill -SIGINT "aplay" || pkill -SIGINT "play" || pkill -SIGINT "spd-say"'];
             //spd-say takes a few seconds to shut down. the others are faster.
             const proc = Gio.Subprocess.new(command, Gio.SubprocessFlags.NONE);
             //proc.wait_check_async(null); // Not checking.
        } catch (e) {
             logError(e, "Failed to stop TTS playback.");
        }
    }

    _summarizeSelection() {
        St.Clipboard.get_default().get_text(St.ClipboardType.PRIMARY, (clipboard, text) => {
            if (text) {
                this._runVoluble(text, ['-s']);
            } else {
                this._runVoluble('Please, select text first!');
            }
        });
    }

    _explainSelection() {
        St.Clipboard.get_default().get_text(St.ClipboardType.PRIMARY, (clipboard, text) => {
            if (text) {
                this._runVoluble(text, ['-e']);
            } else {
                this._runVoluble('Please, select text first!');
            }
        });
    }

     //Translate to a target language different than the locale language. 
    _translateSelection() {
        St.Clipboard.get_default().get_text(St.ClipboardType.PRIMARY, (clipboard, text) => {
            if (text) {
                this._runVoluble(text, ['-t']);
            } else {
                this._runVoluble('Please, select text first!');
            }
        });
    }
    
     //Correct typos, grammar and style of selected text. When ready, user can paste the corrected text over. 
    _proofreadSelection() {
        St.Clipboard.get_default().get_text(St.ClipboardType.PRIMARY, (clipboard, text) => {
            if (text) {
                this._runVoluble(text, ['-p']);
            } else {
                this._runVoluble('Please, select text first!');
            }
        });
    }

     _readSelection() {
        St.Clipboard.get_default().get_text(St.ClipboardType.PRIMARY, (clipboard, text) => {
            if (text) {
                this._runVoluble(text);
            } else {
                this._runVoluble('Please, select text first!');
            }
        });
    }

    _extractNotificationInfo(notification) {
        const title = notification.title || ' '; // Ensure not null
        const description = notification.body || notification.bannerBodyText || ' '; // Ensure not null
        const textToProcess = `${title}. ${description}`; 
        this._runVoluble(textToProcess);
    }
    
    _notifyVoluble(msg, details, icon_name = 'dialog-information-symbolic') {
        const systemSource = MessageTray.getSystemSource();
        if (!systemSource) {
            log(`Voluble: Could not get systemSource: ${msg}`);
            return;
        }
    
        // Set urgency *in the constructor* — the only way in GNOME 48+
        const notification = new MessageTray.Notification({
            source: systemSource,
            title: msg,
            body: details,
            'is-transient': true,
            urgency: MessageTray.Urgency.LOW,
        });
    
        // Set icon *after* construction (required in GNOME 48+)
        const gicon = Gio.ThemedIcon.new_from_names([icon_name]);
        try {
            notification.addIcon(gicon);
        } catch (e) {
            notification.gicon = gicon;
        }
    
        systemSource.addNotification(notification);
    }

    _onNotificationAdded(source, notification) {
        // Muted? Do not disturb?
        if (!this.unmuted || !notification.source?.policy?.showBanners) {
            return;
        }
        // Check if already processed
        const notificationId = notification.id;
        if (this._processedNotificationIds.has(notificationId)) {
            // console.log(`Voluble: Ignoring already processed notification ID: ${notificationId}`);
            return; // Already processed, do nothing
        }
        // Cleanup
        // console.log(`Voluble: Processing notification ID: ${notificationId}`);
        this._processedNotificationIds.add(notificationId);
        // Remove existing timeout for this ID if somehow present (shouldn't happen often)
        if (this._notificationTimeouts.has(notificationId)) {
             GLib.Source.remove(this._notificationTimeouts.get(notificationId));
        }
        // Schedule removal from the set after a delay
        const timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, NOTIFICATION_PROCESSED_TIMEOUT_SECONDS, () => {
            this._processedNotificationIds.delete(notificationId);
            this._notificationTimeouts.delete(notificationId);
            // console.log(`Voluble: Removed notification ID ${notificationId} from processed set after timeout.`);
            return GLib.SOURCE_REMOVE; // Ensure the timeout runs only once
        });
        this._notificationTimeouts.set(notificationId, timeoutId);
        this._extractNotificationInfo(notification);
    }
    
    enable() {
        //log(`Enabling ${this.metadata.name}`);
        this._connections = []; 
        this._processedNotificationIds = new Set();
        this._notificationTimeouts = new Map();

        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        this._indicator.icon = new St.Icon({
            icon_name: this.unmuted ? 'audio-volume-overamplified-symbolic-rtl' : 'audio-volume-muted-symbolic-rtl', // Reflect initial state
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(this._indicator.icon);

        const itemR = new PopupMenu.PopupMenuItem(_('💬 Read Aloud'));
        itemR.connect('activate', this._readSelection.bind(this));
        this._indicator.menu.addMenuItem(itemR);

        const itemS = new PopupMenu.PopupMenuItem(_('💎 Summarize'));
        itemS.connect('activate', this._summarizeSelection.bind(this));
        this._indicator.menu.addMenuItem(itemS);

        const itemE = new PopupMenu.PopupMenuItem(_('🤏 Elucidate'));
        itemE.connect('activate', this._explainSelection.bind(this));
        this._indicator.menu.addMenuItem(itemE);

        const itemT = new PopupMenu.PopupMenuItem(_('🌐 Translate'));
        itemT.connect('activate', this._translateSelection.bind(this));
        this._indicator.menu.addMenuItem(itemT);

        const itemP = new PopupMenu.PopupMenuItem(_('✍ Proofread'));
        itemP.connect('activate', this._proofreadSelection.bind(this));
        this._indicator.menu.addMenuItem(itemP);
        
        const separator = new PopupMenu.PopupSeparatorMenuItem();
        this._indicator.menu.addMenuItem(separator);
        
        const itemSU = new PopupMenu.PopupMenuItem(_('🛑 Stop Speaking'));
        itemSU.connect('activate', this._shutUP.bind(this));
        this._indicator.menu.addMenuItem(itemSU);
        
        this.itemED = new PopupMenu.PopupMenuItem(this.unmuted ? _('🔇 Mute Voluble') : _('🔊 Unmute Voluble'));
        this.itemED.connect('activate', this._toggleTTS.bind(this));
        this._indicator.menu.addMenuItem(this.itemED);
        
        const separator2 = new PopupMenu.PopupSeparatorMenuItem();
        this._indicator.menu.addMenuItem(separator2);
        
        const itemA = new PopupMenu.PopupMenuItem(_('🦜 About'));
        itemA.connect('activate', () => {
            this._notifyVoluble(
                'About',
                _('Voluble announces desktop notifications, reads selected text, provides summaries and translates using local AI. Feedback on GitHub.'),
                 'help-about-symbolic'
            );
        });
        this._indicator.menu.addMenuItem(itemA);

        Main.panel.addToStatusArea(this.uuid, this._indicator);

        const notificationHandler = this._onNotificationAdded.bind(this); // Bind once

        const systemSource = MessageTray.getSystemSource();
        if (systemSource) {
            const connId = systemSource.connect('notification-added', notificationHandler);
            this._connections.push([systemSource, connId]); // Track connection
        }
        // Sources added while active
        const trayConnId = Main.messageTray.connect('source-added', (tray, source) => {
            const srcId = source.connect('notification-added', notificationHandler);
            this._connections.push([source, srcId]); // Track connection to this specific source
        });
        this._connections.push([Main.messageTray, trayConnId]); // Track connection to the tray itself

        log(`${this.metadata.name} enabled.`);
    }

    disable() {
        //log(`Disabling ${this.metadata.name}`);
        // Disconnect all signals
        for (const [sourceObject, connectionId] of this._connections) {
            try {
                // Check if the object still exists and has a disconnect method
                if (sourceObject && typeof sourceObject.disconnect === 'function' && connectionId) {
                   sourceObject.disconnect(connectionId);
                }
            } catch (e) {
                logError(e, `Error disconnecting signal ID ${connectionId} from ${sourceObject}`);
            }
        }
        this._connections = [];
        // Remove pending timeouts
        for (const timeoutId of this._notificationTimeouts.values()) {
            GLib.Source.remove(timeoutId);
        }
        this._notificationTimeouts.clear();
        this._processedNotificationIds.clear();
        // Destroy UI
        this._indicator?.destroy();
        this._indicator = null;
        this.itemED = null;        
        try {
             const file = Gio.File.new_for_path(this.vol_tmp_filepath);
             file.delete(null);
        } catch(e) {
             // Ignore errors deleting temp file
        }
        log(`${this.metadata.name} disabled.`);
    }
}
