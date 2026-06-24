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
