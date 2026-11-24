SMART HOSTEL ELECTRICITY - SETUP GUIDE

FILES (keep all six together): index.html, manifest.webmanifest, sw.js, icon-192.png, icon-512.png, README.txt

A. PUT IT ONLINE (laptop, once) - GitHub Pages, free
 1. Sign up at github.com.
 2. + (top right) > New repository > name: hostel > Public > Create repository.
 3. Click "uploading an existing file". Drag the SIX FILES (not the folder) in. Click Commit changes.
 4. Settings > Pages > Branch: main, folder: / (root) > Save.
 5. Wait 1-2 minutes. Your link: https://YOURUSERNAME.github.io/hostel/
 (Alternative: app.netlify.com/drop - drag the folder, get a link.)

B. INSTALL ON THE PHONE
 Android: open the link in Chrome > menu (3 dots) > Install app.
 iPhone: open the link in Safari > Share > Add to Home Screen. Open it from the home screen.
 Open it in Chrome/Safari itself, not inside WhatsApp.

C. STUDENT USE
 1. Register (name + room number).
 2. Set leaving time.
 3. Step 3: Turn on notifications, then "Add alarm to my phone calendar" and save the file.
    The calendar alarm is the reliable one when the phone is locked.
 4. Before leaving: choose OFF for light and fan, press "I'm leaving the room".

D. ADMIN (warden only)
 Students do not see the Admin tab. On YOUR phone open:
   https://YOURUSERNAME.github.io/hostel/#admin
 The Admin tab then stays on that phone. The first PIN you enter becomes your PIN.
 Do not share the #admin link.

E. UPDATING LATER
 Upload the changed files again (same names). Change the number in sw.js
 ("hostel-power-v3" to v4) so phones pick up the update.

F. LIMITS
 - Data is stored on each phone only. The warden sees only rooms registered on the warden's phone.
   Seeing every student's phone needs a shared server.
 - Notifications from the app are not guaranteed when the app is closed. Use the calendar alarm too.
