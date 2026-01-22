# Image Gallery (local)

This project is a static image gallery with a simple Node.js backend for authentication.

Quick start (Windows / PowerShell):

1. Install dependencies:

```powershell
npm install
```

2. Start the server:

```powershell
npm start
```

3. Open http://localhost:3000 in your browser.

Features added:
- Multiple categories with upload buttons
- Lightbox viewer
- Menu with category badges and counts
- Search (category-first)
- Sign up / Sign in pages with sqlite-backed user storage (server runs on port 3000)

Notes:
- This backend is minimal and intended for local development only.
- Change `JWT_SECRET` via environment variable for production.
- Uploaded images are stored only in the browser memory (Data URLs) and are not persisted.

Optional: link sign-in / sign-up events to Google Sheets
1. Create a Google Spreadsheet and note its ID (from URL).
2. In Google Apps Script, create a new project, paste the contents of `apps_script.gs`, replace `YOUR_SPREADSHEET_ID` with your ID.
3. Deploy the Apps Script as a Web App (execute as: Me, who has access: Anyone).
4. Copy the Web App URL and paste it into `SHEET_ENDPOINT` in `signin.html` and `signup.html` (or set it dynamically).

This will log sign-in / sign-up events to the spreadsheet rows.

If you want persistence of images or per-user galleries, I can add file uploads or store images in the DB or an S3-compatible store next.
