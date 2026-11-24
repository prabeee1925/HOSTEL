HOSTEL POWER — ANDROID + iPHONE NATIVE APP SOURCE

IMPORTANT: This package is a cross-platform native-app SOURCE PROJECT, not a ready-made APK or iPhone install file. It replaces the website-only timer with device-scheduled local notifications using Capacitor. A phone's operating system can display these reminders while Hostel Power is closed or the screen is locked, provided notifications and required phone settings are enabled.

ALARM SOUND / RINGTONE OPTIONS
- Students can choose and preview one of five included original notification tones: Classic Bell, Digital Beep, Double Chime, Gentle Chime, and My Custom Tone.
- The selected tone is saved on that phone and used by the scheduled reminders. Changing the tone refreshes future reminders for that student on that phone.
- Android creates a separate notification channel for each tone because Android notification-channel sound settings cannot be changed after a channel is first created. If a student previously changed that channel's sound in Android Settings, the phone may continue to use the setting they chose there.
- iPhone notification sounds are bundled WAV files. iOS requires custom alert sounds to be on the device and shorter than 30 seconds; these included tones are short WAV files.
- This source version offers a choice of included custom tones. Importing an arbitrary MP3/M4A from Files as a locked-screen notification sound is not included; Android and iOS handle user-imported notification audio differently.
- The Preview button plays the selected sound while the app is open. The Test selected alarm sound button schedules a real device notification a few seconds later.

WHAT THE REMINDERS DO
- 5 minutes before the student's leaving time
- At the leaving time
- 2, 4, 6, 8 and 10 minutes after the leaving time (five follow-up reminders)
- The app schedules up to 8 days ahead (56 reminders maximum per student phone, under iOS's 64-pending-notification limit).
- The schedule is refreshed when the app is opened or returns to the foreground. It keeps an 8-day rolling window, so students should open the app at least once during that period.
- If the student marks the shared room OFF on this phone, today's remaining reminders are canceled; future days stay scheduled.
- When the app is open, a roommate's OFF update from Firebase also cancels today's remaining reminders on this phone.

IMPORTANT SHARED-ROOM LIMIT
If another roommate marks the room OFF while this student's app is completely closed, this phone cannot immediately know about that remote change using local notifications alone. It cancels the remaining reminders when this app next resumes and syncs with Firebase. To stop alarms immediately on every locked roommate phone, a separate server push setup (for example, Firebase Cloud Messaging plus a trusted server trigger) is required. Do not claim instant remote cancellation in a review until that is added.

PHONE LIMITATIONS
- Android: the user must allow notifications and grant the “Alarms & reminders” / exact-alarm special setting. Android battery-saving/Doze behavior and manufacturer settings can still affect delivery timing. The app uses exact scheduled notifications; it does not run a permanent background loop.
- iPhone: the user must allow notifications and Lock Screen/Sounds. iOS delivers scheduled local notifications while the app is not running, but Focus, Scheduled Summary, Silent mode, and the user's notification settings can affect sound or when the alert is shown. This is a notification alarm, not a system Clock alarm and cannot override Silent/Focus restrictions.
- The browser/GitHub Pages PWA version cannot provide the same dependable local scheduled reminders. The alarms require the native Android/iPhone build from this project.

PART A — WHAT YOU NEED
1. A Windows or Mac computer for Android builds, with Node.js 22 and Android Studio installed.
2. For iPhone builds, a Mac with Xcode is required. You cannot compile an iPhone app on Windows.
3. Internet access for installing the Capacitor packages once.
4. Your Firebase project config is already copied into firebase-config.js. Keep that file in the project and do not replace its values unless you are moving to another Firebase project.

PART B — BUILD AND RUN ON ANDROID (WINDOWS OR MAC)
1. Extract this ZIP to a normal folder (not inside the ZIP preview).
2. Open Command Prompt/Terminal in the extracted folder.
3. Run: npm install
4. Run: npm run android:add
   This creates the Android Studio project and adds the exact-alarm permission plus the notification sound resource.
5. Run: npm run sync:android
6. Run: npm run open:android
7. Android Studio opens. Connect an Android phone with USB debugging enabled, choose the phone, and press Run.
8. On the phone, allow notifications. When Android opens the Alarms & reminders settings page, enable it for Hostel Power and return to the app.
9. Sign in as the student, set a leaving time, tap “Enable / check phone alarms”, then tap “Test the alarm sound”. Lock the screen and check the test notification.

To make an APK in Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s). Android Studio will show the APK path when the build finishes.

PART C — BUILD AND RUN ON iPHONE (MAC ONLY)
1. On a Mac, extract the same ZIP and open Terminal in the folder.
2. Run: npm install
3. Run: npm run ios:add
4. Run: npm run sync:ios
5. Run: npm run open:ios
6. In Xcode, select the App target > Signing & Capabilities, choose your Apple development team, connect an iPhone, and press Run.
7. On the iPhone, allow notifications and enable Lock Screen and Sounds for Hostel Power. Choose and preview a ringtone, set the student's leaving time, then tap “Enable / check phone alarms”. Use “Test selected alarm sound” and lock the phone to test.

A distributable iPhone app normally requires Apple signing and distribution (for example, TestFlight). Xcode is needed to build and sign it.

PART D — UPDATING THE WEB VERSION
The existing GitHub Pages website can still be built with: npm install && npm run build
The deployable web files are in the dist folder. This web build remains useful for the admin/browser dashboard, but it does NOT gain native background alarms when opened in Safari/Chrome. The alarm feature requires the compiled Android/iOS app.

FIREBASE / ROOM LOGIC
- Student example: Prabi, Room A-193.
- Students in a shared room use one room document and appear together on the admin dashboard.
- A student's ON report is attributed to that student; an OFF report updates the shared appliance state for all members.
- Firebase config and room data structure are preserved from the prior project.

TECHNICAL NOTES
- The app uses Capacitor 8 and @capacitor/local-notifications 8.3+.
- Android exact alarms require SCHEDULE_EXACT_ALARM permission. The script scripts/patch-android-manifest.cjs adds it and copies all WAV files in assets/sounds into Android's res/raw folder after the Android project is generated.
- The same WAV files are also in public/ for previews and offline use. The script scripts/patch-ios-sounds.cjs also adds them to the iOS app target's Copy Bundle Resources phase, where iOS system notifications can find them.
- iOS uses Apple's local notification system through Capacitor. No Calendar import is used.
- For current platform requirements, consult the official Capacitor Local Notifications and Android alarm documentation.
