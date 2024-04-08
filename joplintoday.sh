#!/bin/sh
# Copyright (c) 2024 Quantius Benignus
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
#--------------------------------------------------------------------------
#Summary notification of the Joplin To-Dos which have alarms set for the next 12 hours. 
#This tool works best with "Voluble" the GNOME shell extension that reads your Joplin notifications outloud.
#When run at desktop startup, will read outloud with human-like voice all upcoming To-Dos, before Joplin is started.

#This is the location of your Joplin database and configuration files:
JDIR="$HOME/.config/joplin-desktop"
#This checks if Joplin is running (the /tmp mount point exists):
pattern="/tmp/scoped_dir??????"
#Look for tasks due in the next 43200 seconds (12 hrs): 
lkahead="43200"

# Directory for temporary files that get erased on shutdown
tmpdir="/dev/shm"
# Prefix for temporary file
prefix="joplin_notifications"

#Wait for the previous notifications to be spoken:
finish_speaking() {
    while pidof -q play aplay; do
        sleep 1
    done
}

if [ -d "$pattern" ]; then
    echo "Joplin is running!" && exit 0 
else
#if [ -f "$JDIR/database.sqlite" ]; then
#No user input (to prevent SQL injection attacks).
    notifications=$(sqlite3 -separator '. ' "$JDIR/database.sqlite" 'SELECT (todo_due/1000),title,body FROM alarms T1 
JOIN notes T2 ON T1.note_id = T2.id WHERE T1.trigger_time BETWEEN (strftime("%s", "now") * 1000) AND ((strftime("%s", "now") + '$lkahead') * 1000) 
ORDER BY T1.trigger_time ASC LIMIT 10;')
    
    if [ -n "$notifications" ]; then
        singleNotify='First.'
        # Create temporary file in /dev/shm/. Required to make it work under most shells (dash).
        tmpfile="$tmpdir/$prefix.$$"
        echo "$notifications" > "$tmpfile"
        
        # Read each line of the notification list
        while IFS= read -r line; do
            timestamp=${line%%.*}
            timestamp="Due at $(date -d "@$timestamp" +"%H:%M"). "
            title_n_body=${line#*.}
            singleNotify="$singleNotify\n$timestamp$title_n_body"
        done < "$tmpfile"
        
        # Clean up temporary file
        #rm "$tmpfile"
        
        finish_speaking
        notify-send 'Tasks due in the next 12 hours.' "$singleNotify"
    fi
fi
