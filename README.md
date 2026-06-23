# Study Blueprint V34 — Profile + Exam Target Cloud Sync

This version starts Phase 2B.

## Added
- Keeps all V32 database foundation models.
- Adds auto-login and auth form hotfix using Amplify Data models.
- Profile still saves locally as a browser fallback.
- Profile page now shows cloud sync status.
- Includes the mobile landing/delete/auth hotfix.

## Notes
- Profile photo still stays local until the Storage/S3 phase.
- Topic progress, timer, tasks and PYQ sync will be added in later phases.
- If cloud sync is not ready during deploy, the app falls back to local browser data.


## V34 hotfix

- Automatically opens the dashboard when a saved login session exists.
- Fixes mobile landing header overflow by hiding the extra Get Started nav button on small screens.
- Restores the Amplify Create account form instead of showing a blank card.
- Keeps V33 profile and exam target cloud sync.
