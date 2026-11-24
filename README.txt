SMART HOSTEL ELECTRICITY - SHARED ONLINE VERSION (MODERN UI)
The refreshed interface uses a modern navy/purple dashboard style with responsive layouts for phones. All phones save rooms to one online database (Firebase). Each student registers their name and room number once. Their phone remembers their member profile. On a new phone, enter the room number and tap the already-registered name. The warden dashboard shows one card per room with every member listed inside. Up to 10 students can register under the same room number, each with a separate name and leaving time. Light and fan states are shared by the room: ON is attributed to the student who marked it ON; when any member marks it OFF, every member sees OFF.

FILES (keep all together): index.html, firebase-config.js, manifest.webmanifest, sw.js, icon-192.png, icon-512.png, README.txt

A. CREATE THE FREE ONLINE DATABASE (laptop, once, about 10 minutes)
 1. Go to console.firebase.google.com and sign in with a Google account.
 2. Add project > name it "hostel" > turn OFF Google Analytics > Create project.
 3. Left menu: Build > Firestore Database > Create database.
    Location: asia-south1 (Mumbai). Start in PRODUCTION mode > Create.
 4. Open the Rules tab. Delete everything there and paste this, then click Publish:

      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /rooms/{room} {
            allow read, write: if true;
          }
        }
      }

 5. Click the gear icon > Project settings. Scroll to "Your apps" > click the web icon </> >
    nickname "hostel" > Register app. (Do not tick Firebase Hosting.)
 6. You will see a block called firebaseConfig. Copy the six values (apiKey, authDomain,
    projectId, storageBucket, messagingSenderId, appId).
 7. Open firebase-config.js in Notepad and replace each PASTE_... with your value. Keep the quotes. Save.

B. PUT THE FILES ON GITHUB PAGES
 In your repository: Add file > Upload files > drag ALL SEVEN files (replace the old ones) > Commit changes.
 Wait 1-2 minutes. Your link: https://YOURUSERNAME.github.io/REPOSITORYNAME/
 On each phone, if you see old behaviour, close the app fully and open it again.

C. INSTALL ON PHONES
 Android: open the link in Chrome > menu (3 dots) > Install app.
 iPhone: open the link in Safari > Share > Add to Home Screen.

D. ADMIN (warden only)
 On YOUR phone open the link with #admin on the end, for example
   https://YOURUSERNAME.github.io/HOSTEL/#admin
 Create a PIN. The Admin tab then stays on that phone. Do not share the #admin link.

E. NOTES
 - Example registration: Prabi, room A-193. Room numbers with or without spaces/hyphens are normalized before grouping. The admin dashboard groups every member with the same room number into one room card.
 - ON is attributed to the member who reported ON. OFF is room-wide: one member marking an appliance OFF updates that appliance to OFF for everyone in the room. The warden can mark both appliances OFF for the whole room after checking it.
 - The app needs internet the first time. After that it keeps working with the last data it saw.
 - SECURITY: the rules above let anyone who has the app read and change rooms. That is fine
   for a college project. Do not store private information. The admin PIN only hides the
   dashboard on that phone.
 - SCALE: a student phone reads and writes only its own room. Only the admin phone (after the PIN)
   reads all rooms, so hundreds of students fit in Firebase's free plan. Check the limits in your
   Firebase console (Usage tab) if you go above about 1000 rooms or open the admin dashboard very often.
 - If the app shows "Setup not finished", firebase-config.js still has PASTE_ values.
 - If it shows "permission-denied", the rules in step A4 were not published.
