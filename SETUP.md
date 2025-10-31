# 🧱 CN Management System — Setup & Configuration Guide

This guide explains how to configure, connect, and run the CN Management System from scratch.

---

## 📋 Prerequisites

Before setup, ensure you have:

- A **Google Account** (Drive, Sheets, Gmail access)
- A **Firebase Project** (Realtime Database)
- A **modern browser** (Chrome / Edge)
- Access to edit Google Apps Script

---

## ⚡ Step 1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new **project**
3. Go to **Build → Realtime Database** → create a database
4. Under **Project Settings → General**, scroll to **Your apps**
5. Click **Web icon (</>)** → register a new web app
6. Copy the provided `firebaseConfig`
7. Paste and update it in:

/services/firebaseService.ts


### 🔧 Lines to Edit:
7 - apiKey: "YOUR_FIREBASE_API_KEY",
8 - authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
9 - databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
10 - projectId: "YOUR_PROJECT_ID",
11 - storageBucket: "YOUR_PROJECT_ID.appspot.com",
12 - messagingSenderId: "YOUR_SENDER_ID",
13 - appId: "YOUR_APP_ID"


---

## ⚙️ Step 2: Google Apps Script Backend Setup

1. Create a new **Google Sheet** named `CN_Ledger`
2. Copy its **Sheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
3. In Row 1, add headers exactly as below:

cn_number, date, party_name, party_address1, party_address2, party_city,
period_from, period_to, month, purpose, net_sales, cn_percentage,
credit_amount, round_off, final_amount, party_email, party_whatsapp,
pdf_link, sent_to_party_at, sent_to_ho_at, sent_to_printer_at,
last_resent_to_party_at, last_resent_to_ho_at


4. Create a Google Drive folder named **Credit_Notes**
5. Copy its **Folder ID** from:  
   `https://drive.google.com/drive/folders/[FOLDER_ID]`

6. In the Google Sheet → **Extensions → Apps Script**
7. Delete all boilerplate code
8. Paste content from:  
appscript_codename.txt
9. Update configuration values as below.

---

### 🔧 Lines to Edit in `appscript_codename.txt`:

| Line | Key | Description |
|------|-----|--------------|
| 25 | `sheet_id` | Your Google Sheet ID |
| 26 | `sheet_name` | Name of the sheet tab (e.g., "Sheet1") |
| 27 | `drive_folder_id` | Google Drive folder ID for PDFs |
| 28 | `headoffice_mail` | Email ID of Head Office |
| 29 | `printer_mail` | Email ID of Printer |
| 253 | `company_name` | Company or Business Name |
| 254 | `company_address` | Address Line (Full Address) |
| 255 | `company_mobile` | Business Contact Number |
| 256 | `company_mail` | Business Email Address |
| 257 | `company_gstin` | GST Number |

After editing, **Deploy the Script**:

1. Click **Deploy → New Deployment**
2. Type: *Web App*
3. Description: `CN Management System API`
4. Execute as: **Me**
5. Access: **Anyone**
6. Click **Deploy**, authorize access, and copy the **Web App URL**

---

## 🌐 Step 3: Connect Frontend to Backend

1. Open:
/services/googleScriptService.ts

2. Replace the existing URL with your Apps Script Web App URL.

### 🔧 Line to Edit:
3 - const SCRIPT_URL = "YOUR_GOOGLE_SCRIPT_URL";



---

## 🚀 Step 4: Running the App

This is a **static PWA**, no build step required.

- Open `index.html` directly in your browser  
  **or**
- Deploy it to GitHub Pages / Netlify / Firebase Hosting

---

## 🧪 Step 5: Test Checklist

| Component | Expected Output |
|------------|----------------|
| Create CN | Generates PDFs and emails |
| Google Drive | PDF copies saved |
| Google Sheet | Row appended |
| Gmail | CNs sent to recipients |
| Firebase | Logs created in Realtime Database |
| Dashboard | Updates with CN metrics |

---

## 🧠 Troubleshooting

| Issue | Cause | Fix |
|-------|--------|------|
| No PDFs in Drive | Wrong Folder ID | Recheck Drive ID in Apps Script |
| Data missing in Sheet | Wrong Sheet ID | Verify Sheet ID and name |
| Emails not sent | Missing authorization | Re-deploy and reauthorize |
| “Undefined” CN number | Firebase not connected | Recheck Firebase config keys |
| App not loading | Missing script URLs | Confirm all service configs |

---

## ✅ Success

Once all components pass testing, your **CN Management System (PWA)** is live, fully automated, and production-ready.

---

## 👨‍💻 Author

**Hemant Borana**  
BCA Final Year Student | Aspiring Data & Business Analyst | Developer & Entrepreneur  

---