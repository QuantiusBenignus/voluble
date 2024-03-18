# Voluble
Let your GNOME desktop speak to you.

Voluble is a simple GNOME shell extension that brings a natural-sounding human-like voice to the desktop notifications used to alert the GNOME user of desktop events, appointments, e-mails, etc. Here is an example video:


https://github.com/QuantiusBenignus/voluble/assets/120202899/2e0d9d5e-0c18-4f8c-9219-11b3bc0e5a2d


Voluble is not an accessibility tool, it does not mean to replace tools like Orca which expose functionality needed by users with disabilities. It simply enhances the desktop notifications by reading them outloud, in the absence of (or in addition to) any sound that might accompany the notification. This way, the user will be properly alerted and will not risk missing even the most transient of notifications, clearly hearing what the computer has to say, even when not looking. A driving reason for creating this extension has been the ability to hear notifications for appointments and to-do's from the [Joplin note-taking app](https://joplin-app.org).


### Piper
Unlike the default installation of the afforementioned Orca (and speech-dispatcher in the background), Voluble uses a modern neural text-to-speech (TTS) engine called Piper. Among the multiple (and growing) choices of human-sounding neural TTS options, Piper is fast and lightweight for its decent quality (a quantum leap from the default espeak-ng in speech dispatcher). 
For a [quick start](#quick-start), we can set up Voluble to use Piper directly, completely ignoring the infrastructure provided by speech dispatcher. 
If instead, we do not want to go rogue and prefer to play nice with the system logic, it is actually possible to use [speech dispatcher](#speech-dispatcher-integration) to call Piper as a backend synthesizer to speak out-loud the notifications but we need to register Piper as a valid backend module first. The advantage with Piper set as the default speech synthesizer in speech dispatcher is that accessibility tools like Orca will then also sound nice. Just pressing `Super + Alt +S` will start Orca with Piper and we will hear clear human-like voice as we navigate the GNOME GUI. 

### Quick Start

- Download Piper from the [GitHub releases page](https://github.com/rhasspy/piper/releases). It can be run with Python, but the binary releases are suggested here as they can give an edge of performance in this scenario.
- Download the desired voice files (a .onnx and a json file per each voice) for the language(s) of choice. As of this writing, [30 languages](https://github.com/rhasspy/piper?tab=readme-ov-file#voices) are supported. You can listen to samples and download files [here](https://rhasspy.github.io/piper-samples/). Once downloaded, make sure that each .json file is named exactly like its corresponding  .onnx voice file.
- Make a symbolic link in your $PATH (say, in `~/.local/bin`) to the `piper` executable:
```
 ln -s ~/ghcode/piper/piper ~/.local/bin/piper
```
- Install the Voluble GNOME shell extension 
	-- either with one click install from the [GNOME extension website](goe).
	
	-- or manually, by clonning the code from github:
```
git clone https://github.com/QuantiusBenignus/voluble
cd voluble
unzip blurt@quantiousbenignus.local.zip -d $HOME/.local/share/gnome-shell/extensions/
gnome-extensions enable blurt@quantiusbenignus.local

```

- Download the helper script voluble for this extension (if not cloned already), place it in your $PATH and make it executable, for example:
```
cd ~/.local/bin && wget voluble  && chmod +x voluble
```
That is it, now the extension should work by speaking out-loud in human-like voice all that the computer has to say via notifications.

### Speech Dispatcher Integration
Speech Dispatcher is a core accessibility tool designed to facilitate speech synthesis for people with visual impairments. It acts as a bridge between client applications (programs that produce spoken text) and software synthesizers (programs that convert text into speech).
Speech Dispatcher would typically come preinstalled in many Linux distributions with the espeak-ng TTS engine as the default. The result does not sound good at all when compared with the quality of the new neural TTS engines. Here is a comparison, justifying the integration of Piper withg speech dispatcher:
<div class="font-monospace pt8 bg-light" style="display: flex;">
With espeak-ng:
	
https://github.com/QuantiusBenignus/voluble/assets/120202899/3a84d722-e9ef-4120-afff-0b9224e188a3

With Piper: 

https://github.com/QuantiusBenignus/voluble/assets/120202899/fea8bce4-9fcc-430d-a4d9-d1a75add8b9f


  
- Configuration files are located at /etc/speech-dispatcher/speechd.conf for system-wide settings and ~/.config/speech-dispatcher/ for per-user preferences.
-  The `spd-conf` tool allows you to modify configuration options interactively.
- Integration with Synthesizers (TTS engines)  is done via module configuration, but unfortunatelly, the preconfigured modules sound unnatural, robotic and not quite intelligible.
- It is possible with some work to configure Piper to work with Speech Dispatcher.
	1. First create a generic local (per user) setup with the `spd-conf` tool.
	2. Then register Piper as a valid TTS module by editing `~/.config/speech-dispatcher/speechd.conf`.
	3. Then create a suitable `piper.conf` file in `~/.config/speech-dispatcher/modules/`
	4. The newly created setup can then be tested with `spd-say`, for example:
`$ spd-say "Your computer can now speak to you nicely"
- Now all you have to do is set the option in the CONFIG block of the `voluble` helper  script to use speech-dispatcher instead of calling piper directly.

### To-Do

- [ ] Add automatic translation for the extension GUI

### Credits

- Michael Hansen for making PIper a relatively low-resource, good-quality speech synthesizer.
- The maintainers of the GNOME project.

