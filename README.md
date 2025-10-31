# 💼 CN Management System (PWA)
*A Smart Credit Note Automation Platform for Businesses*

---

### 📘 Overview

The **CN Management System** is a **Progressive Web App (PWA)** designed to automate and simplify the creation, tracking, and distribution of Credit Notes (CN).  
It replaces manual paperwork with a cloud-integrated, automated workflow using **React**, **Firebase**, and **Google Apps Script**.

Developed for real business use, the app ensures professional PDF generation, automatic record logging, and instant multi-recipient email dispatch — achieving full operational transparency and efficiency.

---

### 🧭 Navigation Overview

The sidebar includes the following sections:

- **Dashboard**  
- **Create CN**  
- **Party Management**  
- **Upload Party Data**  
- **Templates**  
- **Reports & Analytics**  
- **Audit Log**  
- **Settings**

---

### 🖥️ Dashboard

- Displays KPIs for the current month:  
  - **Total CNs**  
  - **Total Amount**  
  - **Average CN Amount**
- Built-in **search and date filter**
- Lists **10 most recent credit notes**
- Quick access to detailed CN records

---

### 🧾 Create CN

Create a new credit note with intuitive automation:

| Field | Description |
|-------|--------------|
| **Load Template** | Quickly load pre-saved CN details |
| **Party** | Search from Firebase party list |
| **CN Number** | Auto-generated from Firebase |
| **CN Date** | Defaults to current date |
| **Scheme Period Type** | Choose **Quarter / Month / Custom** |
| **Scheme From / To** | Auto-filled based on period type |
| **Month / Period Label** | Auto-generates narration |
| **Purpose / Narration** | Editable text field |
| **Type** | Default: “Net Sales Based Incentive” |
| **Net Sales Amount (Excl. GST)** | Entered manually |
| **Credit Note %** | Custom percentage input |
| **Calculation Summary** | Auto-calculates credit, round-off & final amount |

Additional options:
- **Save as Template**
- **Preview CN** (modal preview)
- **Generate & Send CN**  
  → Generates PDFs, emails all recipients, logs data in Sheets & Firebase.

---

### 🧍 Party Management

- Search parties by **name or city**
- Add / Edit / Delete party details
- View issued CNs for a selected party in a modal view  
- Editable fields: Name, City, Address, Email, Mobile
- Data stored in **Firebase** and cached via **IndexedDB** for offline access

---

### 📤 Upload Party Data

- Upload `.xlsx` files directly exported from ERP systems  
- Automatically replaces or updates existing Firebase party data  
- File format follows pre-defined column mapping

---

### 🧩 Templates

- Save recurring CN setups for monthly/quarterly schemes  
- Template fields: Name, Party, Narration, Credit Note %  
- Integrated template search and management

---

### 📊 Reports & Analytics

Visual analytics provide key business insights:

- **Credit Amount Issued (Last 12 Months)** → Bar chart  
- **Number of CNs Issued (Last 12 Months)** → Bar chart  
- **Top 10 Parties by Total Credit Amount** → Table view

All charts update dynamically using stored ledger data.

---

### 🕵️ Audit Log

Tracks every user action for accountability and audit:

| Timestamp | Action | Details |
|------------|---------|----------|
| 31 Oct 2025 | UPLOAD PARTIES | Uploaded 540 parties from file: partymst_82.xls |
| 31 Oct 2025 | CREATE CN | CN KA-EN-CN21 created for POSHAK RETAIL ₹5,456 |
| 31 Oct 2025 | CREATE CN | CN KA-EN-CN22 created for POSHAK RETAIL ₹907 |

Includes date range filter and reset functionality.

---

### ⚙️ Application Settings

Used for customizing the company details shown on all PDFs and official documents.

| Field | Description |
|--------|--------------|
| Company Name | Business display name |
| Contact Info | Phone number |
| Address Line 1 / 2 | Full business address |
| GSTIN | GST registration number |
| UDYAM | MSME registration ID |
| State Code | Applicable state code |

All values are prefilled and editable.  
*(Test or demo data used in this repository — real business data removed for security.)*

---

### 🧩 Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | React + TypeScript + Tailwind CSS |
| **PWA Features** | Service Worker + IndexedDB + Manifest |
| **PDF Engine** | jsPDF + jsPDF-AutoTable |
| **Backend (Serverless)** | Google Apps Script |
| **Database** | Firebase Realtime Database |
| **File Storage** | Google Drive |
| **Data Ledger** | Google Sheets |
| **Email Dispatch** | Gmail (MailApp API) |

---

### ⚙️ Architecture Workflow

1. User fills CN form and generates CN  
2. PDFs (party & printer copies) are generated client-side  
3. CN data and PDFs are sent to Google Apps Script API  
4. Apps Script:
   - Saves PDFs to Google Drive  
   - Logs data into Google Sheet ledger  
   - Sends emails to Party, Head Office, and Printer  
5. Firebase logs the CN creation event for audit  
6. App confirms success to the user  

---

### 🧱 Setup & Deployment

Setup instructions are available in [`SETUP.md`](SETUP.md).

---

### 🧑‍💻 Author

**Hemant Borana**  
🎓 BCA Final Year Student | 📊 Aspiring Data/Business Analyst | 💼 Entrepreneurial Developer  

> Concept, workflow, and business logic by me.  
> Developed using **Google AI Studio** in just 2 days.  
> Currently deployed and in active use within our business operations.

---

### 🧠 Highlights

- Fully functional business PWA  
- Google ecosystem integration  
- Replaces manual CN workflows  
- Automated email + PDF + logging pipeline  
- Designed and implemented in record time

---

### 🪪 License

MIT License — Open for learning and demonstration purposes.

---

### 🗒️ Note

This repository is a **sanitized public version** of a private business project.  
All API keys, credentials, and real company data have been removed or replaced with demo placeholders.
