# RepRise Super App Production Implementation Pack

This ZIP is a merge-ready implementation pack for an existing Android app named RepRise.

It includes:
- Firebase Authentication: email/password, password reset, anonymous guest login, logout.
- Firestore private user sync structure and rules.
- Offline-first Room database.
- Sync queue and WorkManager sync worker.
- Target-based 30-day workout planner.
- Monthly repeat logic.
- Weight loss / gain / muscle / strength / general fitness logic.
- High-frequency priority muscle logic.
- Injury, age, and BMI safety logic.
- Workout logging, history, progress basics.
- Premium dark Jetpack Compose UI.
- Hilt dependency injection.

Default package:
com.reprise.app

Do not put Firebase Admin private keys, payment secret keys, or any backend secret inside Android app.

Firebase setup:
1. Create Firebase project.
2. Add Android app with the same package name.
3. Download google-services.json.
4. Put it inside app/google-services.json.
5. Enable Firebase Auth: Email/password and Anonymous.
6. Enable Cloud Firestore.
7. Deploy firebase/firestore.rules.

Build:
./gradlew clean build
./gradlew test
