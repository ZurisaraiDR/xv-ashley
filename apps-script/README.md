# RSVP to Google Sheets

`Code.gs` receives each RSVP from the invitation and appends a row to a sheet named
**Confirmaciones**: date (Cancún time), name, attending, guests, message.

## Deploy (once, about 5 minutes)

1. In Google Drive, create a blank Google Sheet, e.g. "XV Ashley · Confirmaciones".
2. In the sheet: **Extensions → Apps Script**.
3. Replace the editor contents with `Code.gs` from this folder and click **Save**.
4. **Deploy → New deployment** → gear icon → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy** and authorize with your Google account. Google shows "Google hasn't verified
   this app" because the script is yours and unpublished: **Advanced → Go to … (unsafe)** → **Allow**.
6. Copy the **Web app URL** (ends in `/exec`).
7. Paste it in `js/config.js`:

   ```js
   export const RSVP_ENDPOINT = 'https://script.google.com/macros/s/…/exec';
   ```

8. Check it: opening the URL in a browser shows `{"ok":true,"message":"Confirmaciones listas"}`.
   Then send a test RSVP from the invitation; a **Confirmaciones** tab appears with the row.

## Changing the script later

Edit, save, then **Deploy → Manage deployments → pencil → Version: New version → Deploy**.
This keeps the same URL; "New deployment" would create a different one.

## Excel

**File → Download → Microsoft Excel (.xlsx)** at any time.

## References

- Web apps: https://developers.google.com/apps-script/guides/web
- Deployments: https://developers.google.com/apps-script/concepts/deployments
- Content service (JSON): https://developers.google.com/apps-script/guides/content
- LockService: https://developers.google.com/apps-script/reference/lock/lock-service
