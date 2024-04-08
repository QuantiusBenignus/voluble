#!/usr/bin/env python3
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
#Summary of the Joplin To-Dos which have alarms set for the next 12 hours. 
#This tool works best with "Voluble" the GNOME shell extension that reads your Joplin notifications outloud.
#When run at desktop startup, will read outloud with human-like voice all upcoming To-Dos, before Joplin is started.
 
import os
import sqlite3
from datetime import datetime, timedelta
from subprocess import run, PIPE
from glob import glob

# This is the location of your Joplin database and configuration files:
JDIR = os.path.expanduser("~/.config/joplin-desktop")
# This checks if Joplin is running (the /tmp mount point exists):
pattern = "/tmp/scoped_dir??????"
# Look for tasks due in the next 43200 seconds (12 hrs):
lkahead = 43200

def get_due_tasks():
    conn = sqlite3.connect(os.path.join(JDIR, "database.sqlite"))
    cursor = conn.cursor()

    # Find tasks due in the next 12 hours
    now = datetime.now()
    future = now + timedelta(seconds=lkahead)
    cursor.execute("SELECT (todo_due/1000),title,body FROM alarms T1 JOIN notes T2 ON T1.note_id = T2.id WHERE T1.trigger_time BETWEEN ? AND ? ORDER BY T1.trigger_time ASC LIMIT 10", (now.timestamp() * 1000, future.timestamp() * 1000))
    notifications = cursor.fetchall()
    conn.close()

    return notifications

def main():
    if any(glob(pattern)):
        print("Joplin is running!")
        return

    notifications = get_due_tasks()
    
    if notifications:
        singleNotify = 'First.'
        for timestamp, title, body in notifications:
            timestamp = "Due at " + datetime.fromtimestamp(timestamp).strftime("%H:%M") + ". "
            singleNotify += f"\n{timestamp}{title}.\n {body}"

        run(["notify-send", "Tasks due in the next 12 hours.", singleNotify], stdout=PIPE, stderr=PIPE)

if __name__ == "__main__":
    main()
