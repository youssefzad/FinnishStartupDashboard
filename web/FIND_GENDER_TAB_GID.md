# How to Find the GID for employees_gender Tab

## Steps:

1. **Open your Google Sheet:**
   https://docs.google.com/spreadsheets/d/1NijsXpZhMMqJAWGFcznZJPE2QJ93TPleC1AydJp-7Ps/edit

2. **Click on the "employees_gender" tab** at the bottom of the sheet

3. **Look at the URL in your browser** - it will change to something like:
   ```
   https://docs.google.com/spreadsheets/d/1NijsXpZhMMqJAWGFcznZJPE2QJ93TPleC1AydJp-7Ps/edit#gid=123456789
   ```

4. **Copy the number after `#gid=`** - that's your GID (e.g., `123456789`)

5. **Add it to your `.env` file:**
   ```env
   VITE_EMPLOYEES_GENDER_GID=123456789
   ```
   (Replace `123456789` with your actual GID)

6. **Restart your dev server:**
   - Stop it (Ctrl+C)
   - Start it again: `npm run dev`

7. **Refresh your browser** - the gender data should now appear!

## Alternative: Check Browser Console

If you open the browser console (F12), the code will try to automatically find the tab and log the GID if it finds it. Look for messages like:
- "Found employees_gender tab at GID: X"
- "Add this to your .env file: VITE_EMPLOYEES_GENDER_GID=X"

