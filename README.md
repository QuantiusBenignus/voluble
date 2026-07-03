# <img src="assets/voluble.png" height="56px" width="56px"> **Voluble – Let Your GNOME Desktop Speak and Respond to You**  

*Version 2.0 (July 2026)*  

Voluble is a GNOME Shell extension plus a companion helper script that turns desktop notifications, mouse‑selection, or piece of highlighted text into natural‑sounding speech.  It now ships with **multilingual support, on‑the‑fly language switching, local LLM summarisation/translation/explanation, and a proofreading mode**.  

---  

## Table of Contents  

1. [Features](#features)  
2. [Quick‑Start Installation](#quick-start-installation)  
3. [Configuration – USER BLOCK](#configuration‑user‑block)  
4. [How It Works (Overview)](#how-it-works)  
5. [Screencasts & Example Media](#screencasts--example-media)  
6. [Advanced Usage (LLM, FastText, Sox, Speech‑Dispatcher)](#advanced-usage)  
7. [Tips & Tricks](#tips--tricks)  
8. [Uninstall / Reset](#uninstall--reset)  
9. [Credits & License](#credits--license)  

---  

## Features  

| Feature | Description | NEW? |
|---------|-------------|------|
| **Human‑like voice for GNOME notifications** | Uses the lightweight neural TTS engine **Piper** for good-quality (for the purpose) speech. | |
| **Read mouse selection** | Highlight any text on the screen → Voluble reads it aloud, handling well mixed language text that may make larger models stumble. | |
| **Mute / Unmute** | Toggle voice output without disabling the extension. | |
| **Do‑Not‑Disturb awareness** | Automatically silences speech when the system DND switch is on. | |
| **Multilingual, on‑the‑fly language detection** | When `fasttext` is installed, Voluble detects the language of intelligently chunked text and **automatically switches to the appropriate Piper model**. | **YES** |
| **Summarise selected text** (`voluble -s`) | Sends the highlighted text to a local LLM (Gemma 4‑E4B, Gemma 3‑4B, etc.) and reads back a concise summary. | **YES** |
| **Translate selected text** (`voluble -t`) | Same pipeline as summarise, but the LLM returns a translation into a configurable target language of your choice. | **YES** |
| **Explain / “teach‑back”** (`voluble -e`) | LLM produces a short expert‑style explanation of the selected passage. | **YES** |
| **Proofread and replace** (`voluble -p`) | LLM returns a JSON object with `{ "correction": "...", "brief": "..." }`. The corrected text is copied to the clipboard, and the brief is spoken. | **YES** |
| **Local server to CLI fallback e.g. `llama‑completion`** | If a server is running on `localhost:8080` the script prefers it; otherwise it falls back to the CLI. | **YES** |
| **Optional use of `sox` or `spd‑say`** | Choose your audio backend (`aplay`, `play`, `sox`, or Speech‑Dispatcher). | |
| **Integration with Joplin‑Today script** | (Optional) Summarise today’s Joplin tasks at session start. | |
| **Extensible “commitments”** | Random, friendly “I’m on it…” messages spoken before the LLM runs. | **YES** |

---  

**"Practice what you preach: A demo of Voluble's features, created by Voluble."**
As a prelude to the next section, this short clip demonstrates Voluble’s capabilities by using one of its core features to explain the project itself (pleasse, turn the sound ON):
<video id="codedemo" src="https://github.com/user-attachments/assets/f4081fa6-818b-4f49-9118-5e44958efdc6" width="640" height="auto" controls>
</video>

---

## Screencasts & Example Media  

| Feature | Description | Screencast |
|---------|-------------|-----------|
| **Multilingual `Read-Aloud` on‑the‑fly** | A fictional scene in the Italian Alps – an Italian clerk, a Chinese tourist, a French traveler, an American, and a Russian speak over each other. Voluble detects and switches languages instantly. | <video src="https://github.com/user-attachments/assets/c2322439-e8c8-456a-9d5a-6a6bd1729c64" width="640" height="auto" controls>🎞️ Multilingual Demo (Italian Alps)</video>|
| **Summarise Chinese newspaper** | Select a paragraph from a Chinese newspaper, press *`Voluble → Summarise`*. The LLM returns an English summary which is spoken. | 🎞️ **[Summarise Chinese → English](assets/voluble_summary_crosslingua.mp4)** |
| **Translate to French** | Highlight a Spanish paragraph, press *`Voluble → Translate`*. The result is spoken in French. | 🎞️ **[Translate Spanish → French](assets/voluble_translate_fr.mp4)** |
| **Explain a technical excerpt** | Select complex text or a snippet of code, press *`Voluble → Elucidate`*. The LLM explains it in plain language. | 🎞️ **[Explain Code Snippet - previous section](#screencasts--example-media)** |
| **Proofread edited text** | Highlight a badly‑written paragraph, press *`Voluble → Proofread`*. The corrected text lands in the clipboard, and a brief “I fixed punctuation and grammar...” is spoken. | <video src="https://github.com/user-attachments/assets/e27e0ed3-15aa-4891-9775-006f67d20eb6" controls>🎞️ Proofread Text</video> |
| **Joplin‑Today integration** | At login, the script reads a summary of today’s Joplin tasks. |🎞️ **(see video below, section 7 in Advanced Usage)** |

---  

## Quick‑Start Installation  

> **NOTE** – The steps below assume a **zsh** environment (the main script ships with a zsh shebang).  If you prefer **bash**, you will have to rewrite any (many) Zsh‑specific syntax fields accordingly.

1. **Install required system packages**  

   ```bash
   sudo apt install sox fasttext jq wl-clipboard xsel aplay  # Debian/Ubuntu
   # or the equivalent for your distro
   ```

2. **Install the GNOME extension**  

   *One‑click:*  
   <a href="https://extensions.gnome.org/extension/6849/voluble/"><img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" height="60"></a>  

   *Manual:*  

   ```bash
   git clone https://github.com/QuantiusBenignus/voluble
   cd voluble
   unzip voluble@quantiusbenignus.local.zip -d "$HOME/.local/share/gnome-shell/extensions/"
   gnome-extensions enable voluble@quantiusbenignus.local
   ```

3. **Download the helper script**  

   ```bash
   mkdir -p "$HOME/.local/bin"
   cd "$HOME/.local/bin"
   wget https://raw.githubusercontent.com/QuantiusBenignus/voluble/main/voluble
   chmod +x voluble
   ```

4. **Download Piper and Piper models**  

   *Download Piper and the desired voice files (a .onnx and a json file per each voice) for the languages of choice. As of this writing, [40+ languages](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/VOICES.md) are supported. You can listen to samples and download files [here](https://rhasspy.github.io/piper-samples/). Once downloaded, make sure that each .json file is named exactly like its corresponding  .onnx model file.*

   ```bash
   # Download the compiled binary (extract and create a symbolic link to `piper`) , e.g.:
   wget https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz
   ln -s $HOME/Apps/github/piper/piper $HOME/.local/bin/piper
   # Check https://rhasspy.github.io/piper-samples/ for language samples.
   # Example – Choose and download a few models into $HOME/AI/Models/Piper
   mkdir -p "$HOME/AI/Models/Piper"
   cd "$HOME/AI/Models/Piper"
   wget https://huggingface.co/rhasspy/piper-voices/blob/main/da/da_DK/talesyntese/medium/da_DK-talesyntese-medium.onnx
   wget https://huggingface.co/rhasspy/piper-voices/resolve/main/da/da_DK/talesyntese/medium/da_DK-talesyntese-medium.onnx.json
   # or use your browser, e.g.: https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/davefx/medium/
   # …add any other models you like to support voluble's multilingual capabilities.
   ```
5. **Set up a local LLM to use the AI features:** Download [llama.cpp](https://github.com/ggml-org/llama.cpp) (or any other inference engine that exposes a OpenAI-compatible API, or can be run in a single-shot mode from the command line - e.g. [llamafile](https://github.com/Mozilla-Ocho/llamafile) )
6. **Edit the USER CONFIGURATION BLOCK** (see next section).
7. **Run the extension script (no flags) from the command line to check the dependencies:** `$>voluble`
8. **Restart GNOME** (log out/in or press `Alt+F2`, type `r`, press **Enter**) and test the extension by clicking **“Read Aloud”** in the Voluble menu.  

---  

## Configuration – USER BLOCK  

Open `~/.local/bin/voluble` in your favourite editor and locate the **USER CONFIGURATION BLOCK** (around line 130).  Adjust the variables to match your environment:

| Variable | What to set | Example |
|----------|-------------|---------|
| `use_sox` | `1` to use `sox` (`play`) instead of `aplay`. | `use_sox=0` |
| `use_spd` | `1` to route audio through **Speech‑Dispatcher** (`spd-say` - no auto LID). | `use_spd=0`|
| `use_fasttext` | `1` enables automatic language detection (LID). | `use_fasttext=1` |
| `MODELDIR` | Base directory where you keep all models. | `MODELDIR="$HOME/AI/Models"` |
| `PIPERDIR` | Sub‑directory that contains the **Piper** *.onnx* files. | `PIPERDIR="$MODELDIR/Piper"` |
| `TTSM` (assoc. array) | Map *language* → *model file*. Add or remove entries for any language you want. | See the script; e.g. add `"Italian"="it_IT-paola-medium.onnx"` |
| `LCLANG` (assoc. array) | Reverse map **ISO‑639‑1** → *display name* (used by fasttext). | `"it"="Italian"` |
| `lang` | Primary UI language (fallback when detection fails). | `lang="English"` |
| `trans_lang` | Target language for the `-t` (translate) mode. | `trans_lang='French'` |
| `LLModel` | Full path to the **GGUF** model you want the LLM to use. | `LLModel="$MODELDIR/gemma-4-E4B-it-qat-UD-Q4_K_XL.gguf"` |
| `lid_model` | Path to the fasttext language‑identification model. | `lid_model="${FASTTEXT_MODEL:-$MODELDIR/Piper/lid.176.bin}"` |
| `llam` | Executable name for the LLM CLI (default `llama-completion`). | `llam="llama-completion"` |
| `llamargs` | CLI arguments for your LLM.  Adjust for your engine if needed. | `(-t 7 --temp 0.6 …)` |
| `LLM_SERVER` | URL of a local OpenAI‑compatible server (e.g. `http://localhost:8080`). | `LLM_SERVER="http://localhost:8080"` |
| `commitments` | Friendly “I’m on it…” strings spoken when the LLM runs. | add any you like |

> **Tip** – After you finish editing the block, run `voluble` once with no arguments. It will print **“All dependencies are satisfied.”** if everything is in place.

---  

## How It Works (Overview)  
At its core, Voluble enhances desktop notifications by reading them aloud, in the absence of (or in addition to) any sound that might accompany the notification. This way, the user will be properly alerted and will not risk missing even the most transient of notifications, clearly hearing what the computer has to say, even when not looking. Creating an intelligent auditory route for text in `PRIMARY SELECTION`, further expands its capabilities. 

1. **Voluble GNOME extension** intercepts a notification or a mouse‑selection and writes the text to `$XDG_RUNTIME_DIR/voluble.tmp`.  
2. **The helper script (`voluble`)** is invoked by the extension.  
3. If **fasttext** is enabled, the script splits the text into sentences, runs each through `fasttext predict`, and selects the appropriate Piper model on‑the‑fly.  
4. If a **LLM** is requested (`-s`, `-t`, `-e`, `-p`):  

   * The script first tries a local server (`$LLM_SERVER`).  
   * If the server is unavailable, it falls back to the `llama‑completion` CLI with the model you configured.  
   * The LLM returns either a plain summary/translation/explanation **or** a JSON object (proofread mode).  

5. The final text (or the proofreading `brief` JSON field) is sent to Piper and spoken.  
6. In **proofread mode** the corrected text is also copied to the clipboard (`wl-copy` on Wayland, `xsel` on X11) and can be pasted directly over the selected text.  

---  

## Advanced Usage  

### 1. Switching Audio Back‑ends  

```bash
# Use Sox/Play (better for large files)
use_sox=1

# Use Speech‑Dispatcher (integrates with Orca etc. - In the context of LID, this has become less desirable and more of an extraneous setup.)
use_spd=1
```

### 2. Interacting from the command line  

```
#Use the command line to supply textual payload (questions, program outputs, other text) for voluble's tools (e.g. Elucidate - will explain the recent ):
journalctl -p err --since "yesterday" | fx -p
```

The zsh function `fx` (-p loads the PRIMARY SELECTION), along with its mirror `xf` and other tools, is available as part of the [zshelf](https://github.com/QuantiusBenignus/zshelf) repository (a zsh-centric local LLM interaction suite ).

### 3. Adding a New Language  

1. **Download the model** (e.g. `nl_NL‑mls-medium.onnx`).  
2. **Add entries** to the two associative arrays:  

   ```zsh
   TTSM["Dutch"]="nl_NL-mls-medium.onnx"
   LCLANG["nl"]="Dutch"
   ```

4. Because the extension has not changed you do not need to **Restart the extension** (`gnome-extensions restart voluble`).

### 4. Custom LLM Server  

If you run a local **llama.cpp server**, or **vLLM** that speaks the OpenAI Chat Completion API, just set:  

```zsh
LLM_SERVER="http://localhost:11434"
```

The script will generally work with any OpenAI compatible API.

### 5. Proofread Mode Details  

- The LLM **must** return pure JSON (no markdown fences).  
- The script strips any surrounding `````json````` fences automatically.  
- Example system prompt (built‑in) forces the model to obey the schema.  
- The corrected text is placed on the clipboard; you can paste it anywhere (`Ctrl+V` or `Super+V`), incl. directly over the selection.  

### 6. Using `fasttext` for Language Detection  

If `fasttext` is **not** installed, Voluble falls back to the primary configured language (`$lang`).  
To install fasttext and the language‑identification model:

```bash
sudo apt install fasttext
mkdir -p "$HOME/AI/Models/Piper"
wget -O "$HOME/AI/Models/Piper/lid.176.bin" \
     https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.bin
```

The script automatically picks up `$FASTTEXT_MODEL` if you set that environment variable.

###  7. **For users of Joplin. Spoken summary at stratup of the tasks due soon. Uses the optional python script `joplintoday.py`.**
One of the many reasons for creating this extension was the need to hear the contents of notifications for appointments and to-do's from the [Joplin](https://joplinapp.org) note-taking app. A video [demonstration](./joplin-example.md).

Notification - Tasks in the next 12 hrs | Notification Audio 
:-: | :-:
![joplin-tasks-today](https://github.com/QuantiusBenignus/voluble/assets/120202899/4b728921-f675-4882-81bc-6ad6f71619ac) | <video src="https://github.com/QuantiusBenignus/voluble/assets/120202899/c37329c5-93fb-4a99-9e34-3bad7c8cde5a" width=160/>

You can simply invoke the python script by adding it to you startup applications. On most Linux desktops, placing a .desktop file in ~/.config/autostart/ will do the trick. Here is a sample `~/.config/autostart/joplintoday.desktop` file:
```
[Desktop Entry]
Type=Application
Exec=/home/YourUsername/.local/bin/joplintoday.py
Hidden=false
NoDisplay=true
X-GNOME-Autostart-enabled=true
Name=JoplinToday

```
(Linux only, will not work with encrypted database).

---  

## Tips & Tricks  

| Tip | Command |
|-----|---------|
| **Stop a runaway read** | `pkill -SIGINT voluble && pkill play || pkill aplay`  (or `pkill -SIGINT spd-say`) |
| **Create an alias** | `alias shutup='pkill -SIGINT voluble && pkill play || pkill aplay'` |
| **Add a custom commitment** | Edit the `commitments` array – any line will be spoken before the LLM runs. Only registered languages. |
| **Debug dependencies** | Run `voluble` (no flags) from a terminal; you’ll catch any dependency issues. |
| **Disable dependency check**| After setup is complete, comment out the `depends` function call at the beggining of main() to avoid the check on each run.|
| **Change sample rate** (for custom low‑quality models) | Should be handled automatically by the script |
| **Use Wayland clipboard** | The script automatically picks `wl-copy` when `$XDG_SESSION_TYPE` is `wayland`. |
| **Log all processed texts** | The helper appends each raw selection to `$XDG_RUNTIME_DIR/promf`. You can tail it: `tail -f $XDG_RUNTIME_DIR/promf`. Persistent for the session. |
|**Testing voluble from CLI**|To test `voluble [-s -e -t -p]` meaningfully from the command line,  `$XDG_RUNTIME_DIR/voluble.tmp` (which is emptied on exit), must be repopulated. |

---  

## Uninstall / Reset  

```bash
# 1. Remove the GNOME extension
gnome-extensions disable voluble@quantiusbenignus.local
gnome-extensions uninstall voluble@quantiusbenignus.local

# 2. Delete the helper script and model folder (optional)
rm -f "$HOME/.local/bin/voluble"
rm -rf "$HOME/AI/Models/Piper"

# 3. Clean up the temporary file
rm -f "$XDG_RUNTIME_DIR/voluble.tmp"
```

If you want to keep the models but start fresh, simply delete the helper script and re‑install it.

---  
### Speech Dispatcher Integration
<h4>(Optional Step - click to expand)</h4>
<details>

Speech Dispatcher is a core accessibility tool designed to facilitate speech synthesis for people with visual impairments. It acts as a bridge between client applications (programs that produce spoken text) and software speech synthesizers (programs that convert text into speech).
Speech Dispatcher would typically come preinstalled in many Linux distributions with the espeak-ng TTS engine as the default. The result does not sound good at all when compared with the quality of the new neural TTS engines. Here is a comparison, justifying the integration of Piper with speech dispatcher:

With espeak-ng | With Piper 
:-: | :-:
<video src="https://github.com/QuantiusBenignus/voluble/assets/120202899/3a84d722-e9ef-4120-afff-0b9224e188a3" width=160/> | <video src="https://github.com/QuantiusBenignus/voluble/assets/120202899/fea8bce4-9fcc-430d-a4d9-d1a75add8b9f" width=160/>

- Configuration files (speechd.conf) are located in /etc/speech-dispatcher/ for system-wide settings and ~/.config/speech-dispatcher/ for per-user preferences.
- The `spd-conf` tool allows one to modify configuration options interactively or create per-user speech dispatcher configuration.
- Integration with synthesizers (TTS engines)  is done via module configuration, but unfortunatelly, the supplied preconfigured modules sound unnatural, robotic and not quite intelligible.
- It is possible, with some work, to configure Piper as a TTS module for Speech Dispatcher.
	1. First create a generic local (per user) speech-dispatcher setup with the `spd-conf` tool, using `sd_generic` as the default module.
 	2. Then register Piper as a valid TTS module by editing the just-created `~/.config/speech-dispatcher/speechd.conf`. Most stuff can be left as is (all is well commented). An excerpt of the relevant parameters in my case shown here:
     
	```
 		# The Default language with which to speak
 		# Note that the spd-say client in particular always sets the language to its
 		# current locale language, so this particular client will never pick this configuration.
 		
 		DefaultLanguage   en-US
		 
 		# Pulse audio is the default and recommended sound server. OSS and ALSA
 		# are only provided for compatibility with architectures that do not
 		# include Pulse Audio. 
 
 		AudioOutputMethod   alsa
 
 		# The next ones are instrumental, find them in their respective sections
 		
 		AddModule "piper"              "sd_generic"   "piper.conf"
 		DefaultModule piper
 		LanguageDefaultModule "en"  "piper"
 		LanguageDefaultModule "fr"  "piper"
	```

	3. Then create a suitable `piper.conf` file in `~/.config/speech-dispatcher/modules/`. Here is an example `piper.conf` [adapted for my case from here](https://github.com/brailcom/speechd/issues/866#issuecomment-1869106771):
 
	```
		Debug 0
		GenericExecuteSynth "printf %s \'$DATA\' | piper --length_scale 1 --sentence_silence 0 --model ~/Store/Models/piper/$VOICE --output-raw | aplay -r 16000 -f S16_LE -t raw -"
		# Using low quality voices to respect the 16000 rate for aplay in the command above is perfectly fine.
		
		GenericCmdDependency "piper"
		GenericCmdDependency "aplay"
		GenericCmdDependency "printf"
		GenericSoundIconFolder "/usr/share/sounds/sound-icons/"
		GenericPunctNone ""
		GenericPunctSome "--punct=\"()<>[]{}\""
		GenericPunctMost "--punct=\"()[]{};:\""
		GenericPunctAll "--punct"
		
		#GenericStripPunctChars  ""

		GenericLanguage  "en" "en_US" "utf-8"
		GenericLanguage  "en" "en_GB" "utf-8"
		GenericLanguage  "fr" "fr_FR" "utf-8"
		
		AddVoice        "en"    "MALE1"         "en_US-lessac-low.onnx"
		AddVoice        "en"    "FEMALE1"       "en_US-amy-low.onnx"
		AddVoice        "fr"    "MALE1"         "fr_FR-gilles-low.onnx"
		AddVoice        "en"    "MALE2"         "en_GB-alan-low.onnx"
		
		DefaultVoice    "en_US-lessac-low.onnx"
	```

	4. The newly created setup can then be tested with `spd-say`, for example:

		`$ spd-say "Your computer can now speak to you nicely"`

- Now all you have to do is set the option `use_spd=1` in the CONFIG block of the `voluble` helper  script to use speech-dispatcher instead of calling piper directly.
</details>

---
## To-Do

- [ ] Add automatic translation for the extension GUI
- [ ] Implement a blacklist for "must be silent" notifications
- [x] Create an automatic LID preprocessor/router
- [x] Make aware of system-wide "Do not Disturb"
- [x] Add extension code for ver. 45+ of the GNOME shell

---

## Credits & License  

* **Quantius Benignus** – original author & maintainer (© 2025‑2026)  
* **Michael Hansen** – Piper author (low‑resource neural TTS)  
* **GGML‑org** – llama.cpp / LLM inference engine  
* **FastText** – language identification model  

The code is released under the **MIT License** – see the `LICENSE` file in the repository.  

---  

*Happy listening! 🎧*  
