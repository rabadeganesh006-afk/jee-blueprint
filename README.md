# Study Blueprint V32 - Database Foundation

Phase 2A database foundation has been added.

What changed:
- Added full Amplify Data models for profile, preferences, exam target, topic progress, flagged topics, study sessions, timer goals, PYQ progress, tasks, activity logs, study material progress, test attempts, contact messages, delete-data requests, feedback, and content catalog models.
- Student-owned records use owner-based authorization.
- Catalog/content records are read-only for signed-in users for now.
- Frontend is intentionally not fully connected to the database yet. This version is the backend foundation only.

Next phase:
- V33 will connect Profile + Exam Target to the database.
