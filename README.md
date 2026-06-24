# Study Blueprint V35 Auth Layout Hotfix

This version keeps V33/V34 database and profile sync work, and replaces the Amplify prebuilt auth UI with a controlled custom auth form to avoid blank/shifted create-account screens.

## Fixes
- Create account blank/shifted form fixed with custom sign in/sign up UI.
- Back button text changed to "Back to Study Blueprint".
- Mobile auth form layout improved.
- Saved login auto-dashboard behavior retained.
- Profile cloud sync foundation retained.

## Deploy
Upload all extracted files/folders to the GitHub repository root and let AWS Amplify deploy.


## V36 small stability cleanup

- Sidebar logo tagline fit improved.
- Delete My Data removed from sidebar and moved into Profile > Account Actions.
- Profile unnecessary cloud/privacy boxes removed from the visible profile card.
- City and preferred content rows removed from the visible details list.
- Remaining non-required profile fields show an Optional label.
- Added a safer typed confirmation before deleting account/data.

## V37 fixed desktop shell

- Keeps the left sidebar fixed while dashboard pages scroll.
- Keeps the top welcome/search bar fixed while scrolling.
- Adds slimmer, cleaner scrollbars across the app.
- Keeps mobile bottom navigation behavior unchanged.



## V38 AI Tutor disabled / Coming Soon

- AI Tutor frontend chat box removed and replaced with a professional Coming Soon panel.
- AI quick action and sidebar card now show Coming Soon / View Status instead of asking questions.
- Backend askAi query and Lambda wiring removed from Amplify data/backend to avoid Gemini quota/API problems.
- Existing dashboard, profile cloud sync foundation, auth, contact, privacy, and layout fixes retained.

Deploy by uploading all extracted files/folders to the GitHub repository root.


## V40 final logo update
- Replaced the old Study Blueprint logo across the public landing page, auth screens, legal pages, sidebar, favicon and app icons.
- Removed the separate old sidebar logo/tagline text so the new final logo is used consistently.
- Kept AI Tutor disabled as Coming Soon and retained previous build fixes.


## V41 Landing Trust Strip Merge

- Replaced the old plain stat boxes with an interactive trust strip.
- Merged the old metrics: Smart, 3 core subjects, 270+ topics, Mobile friendly dashboard.
- Added the new brand points: Trustworthy, Focused, Progress-driven, App-ready.
- Kept existing V40 final logo and AI Tutor coming-soon/build-fix work.
