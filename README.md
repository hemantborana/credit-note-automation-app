# CN Management System

A comprehensive, cloud-native solution for streamlined credit note generation and management, built with a modern frontend and a serverless Google Workspace backend.

## Overview

This application provides a robust platform for businesses to manage their credit note (CN) lifecycle efficiently. It addresses the common challenges of manual CN creation, tracking, and distribution by providing a centralized, automated system. The user-friendly interface allows for quick data entry, while the powerful backend handles PDF generation, data logging, cloud storage, and automated email distribution.

The system is designed for accountability and ease of use, featuring advanced analytics, recurring templates, and a full audit trail to ensure transparency and control over financial operations.

---

## Core Features

-   **Interactive Dashboard:** A central hub with key performance indicators (KPIs) like monthly CN volume and total amount. Includes advanced filtering by date range and a powerful search across CN number, party name, and purpose.
-   **Secure Credit Note Generation:** An intuitive form for creating new credit notes with automatic calculation of credit amounts and rounding.
-   **Automated PDF Creation:** Generates professional, company-branded PDF documents for each credit note in both party-facing and printer-friendly formats.
-   **Cloud Integration:**
    -   **PDF Storage:** Automatically saves all generated PDFs to a designated Google Drive folder.
    -   **Data Logging:** Logs every credit note detail into a master Google Sheet, creating a comprehensive and searchable ledger.
    -   **Email Automation:** Automatically emails the credit note PDF to the party, Head Office, and a designated printer email address.
-   **Party Management (CRUD):** A dedicated interface to Add, View, Edit, and Delete party information, including contact and address details.
-   **Recurring Templates:** Save and load predefined templates for recurring schemes, pre-filling the party, purpose, and CN percentage to accelerate monthly data entry.
-   **Dedicated Reports & Analytics:** A visual reports section with charts for year-over-year analysis of credit note amounts and volume, plus a breakdown of top parties by credit amount.
-   **Comprehensive Audit Log:** Tracks all significant user actions (CN creation, resending, party updates, etc.) with timestamps, providing a complete and filterable history for accountability.
-   **Intelligent Date Period Selection:** Smart "Quarter" and "Month" buttons automatically calculate and fill in the previous financial period dates, reducing manual entry and errors.
-   **Centralized Settings:** Easily manage company details (name, address, GSTIN) that appear on all official documents.

## Tech Stack & Architecture

This project utilizes a modern, serverless architecture that leverages the power of Google's ecosystem for a cost-effective and scalable solution.

#### **Frontend**

-   **Framework:** React with TypeScript
-   **Styling:** Tailwind CSS for a responsive, utility-first design.
-   **PDF Generation:** `jsPDF` and `jsPDF-AutoTable` for client-side PDF creation.

#### **Backend & Services**

-   **Database:** Google Firebase (Realtime Database) for storing party information, application settings, templates, and the audit log.
-   **Business Logic & API:** Google Apps Script acts as the serverless backend, handling the core processing logic.
-   **File Storage:** Google Drive for securely storing all generated PDF credit notes.
-   **Data Ledger:** Google Sheets for maintaining a comprehensive, spreadsheet-based log of all credit notes.
-   **Email Service:** Gmail (via `MailApp` Service) for automated email dispatch to parties and internal stakeholders.

### System Flow

1.  **User Interaction:** The user interacts with the React single-page application (SPA).
2.  **Data Persistence:** Party, settings, and template data are managed directly with the Firebase Realtime Database.
3.  **CN Creation:** The user fills out the "Create CN" form. On submission, the React app generates two base64-encoded PDFs (party and printer copies).
4.  **Backend Processing:** The CN data and PDF strings are sent to the Google Apps Script web app endpoint.
5.  **Google Apps Script Orchestration:** The script performs the following actions:
    -   Saves the PDFs to the specified Google Drive folder.
    -   Appends a new row with all CN details and the Drive PDF link to the master Google Sheet.
    -   Sends the party-facing PDF via email to the customer.
    -   Sends the printer-friendly PDF to the Head Office and printer email addresses.
6.  **Confirmation:** The script returns a success or error message to the React app, which then notifies the user.
7.  **Audit Trail:** An entry for the action is saved to Firebase.

---

## Setup and Deployment

Follow these steps to set up and run the project.

### Prerequisites

-   A Google Account with access to Google Drive, Google Sheets, and Gmail.
-   A Google Firebase project.

### Step 1: Firebase Setup

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  In your project, go to **Build > Realtime Database**. Create a new database in **locked mode** (you will set rules later if needed).
3.  Go to **Project Settings** (click the gear icon).
4.  Under the **General** tab, scroll down to "Your apps". Click the web icon (`</>`) to add a new web app.
5.  After registering the app, Firebase will provide you with a `firebaseConfig` object.
6.  Copy this object and paste it into the `services/firebaseService.ts` file, replacing the existing placeholder config.

### Step 2: Google Apps Script Setup

This is the core of the backend logic.

1.  **Create Google Sheet:** Create a new Google Sheet. Name it "CN_Ledger".
    -   Copy the **Sheet ID** from its URL: `.../spreadsheets/d/`**`[SHEET_ID]`**`/edit...`
    -   In the first row, create the following headers exactly:
        `cn_number`, `date`, `party_name`, `party_address1`, `party_address2`, `party_city`, `period_from`, `period_to`, `month`, `purpose`, `net_sales`, `cn_percentage`, `credit_amount`, `round_off`, `final_amount`, `party_email`, `party_whatsapp`, `pdf_link`, `sent_to_party_at`, `sent_to_ho_at`, `sent_to_printer_at`, `last_resent_to_party_at`, `last_resent_to_ho_at`

2.  **Create Google Drive Folder:** Create a new folder in Google Drive where the PDFs will be stored. Name it "Credit_Notes".
    -   Open the folder and copy the **Folder ID** from its URL: `.../folders/`**`[FOLDER_ID]`**

3.  **Create the Script:**
    -   In your Google Sheet, go to **Extensions > Apps Script**.
    -   Delete any boilerplate code and paste the entire content of the `appscript_codename.txt` file into the editor.
    -   Update the `GLOBAL_CONFIG` object at the top of the script with your Sheet ID, Folder ID, and desired email addresses.

4.  **Deploy the Script:**
    -   Click **Deploy > New deployment**.
    -   Select Type: **Web app**.
    -   Description: "CN Management System API".
    -   Execute as: **Me**.
    -   Who has access: **Anyone**.
    -   Click **Deploy**.
    -   **Authorize access** when prompted. You may need to go through an "unsafe app" warning. Click "Advanced" and proceed.
    -   After deployment, copy the **Web app URL**.

5.  **Connect Frontend to Backend:**
    -   Open `services/googleScriptService.ts` in the project.
    -   Paste the copied Web app URL into the `SCRIPT_URL` constant.

### Step 3: Running the Application

This application is designed as a static web app. To run it, simply open the `index.html` file in a modern web browser. All modules are loaded via import maps and CDN links, requiring no local build step.

## Author

-   **Hemant Borana**
