# 💼 CN Management System  
*A Smart Credit Note Automation Platform for Businesses*  

---

### 📘 Overview  

The **CN Management System** is a modern, cloud-native solution that automates the entire credit note (CN) lifecycle — from creation to distribution.  
It streamlines credit note generation, PDF creation, and multi-channel email dispatch using **React**, **Firebase**, and **Google Apps Script**.  

Originally built for a real business use case, this app replaces manual CN workflows with a single automated process, ensuring **accuracy, transparency, and operational efficiency**.

---

### 🚀 Features  

- **Interactive Dashboard** – View CN summaries, filter by date, and search across credit notes.  
- **Automated CN Creation** – Simple form with real-time amount and rounding calculations.  
- **Professional PDF Output** – Generates company-branded PDFs (party copy & printer copy).  
- **Google Workspace Integration**  
  - 📄 PDFs auto-saved to Google Drive  
  - 📊 All CN data logged to Google Sheets  
  - 📧 Auto-emailing to Party, Head Office, and Printer  
- **Party Management (CRUD)** – Add, edit, or delete party details with ease.  
- **Recurring Templates** – Save pre-filled setups for recurring CN types.  
- **Analytics Dashboard** – Charts for trends, top parties, and quarterly summaries.  
- **Comprehensive Audit Log** – Tracks every significant action for accountability.  
- **Smart Date Selection** – Instantly fills in previous month/quarter dates.  

---

### 🧩 Tech Stack  

| Layer | Technology |
|-------|-------------|
| **Frontend** | React + TypeScript + Tailwind CSS |
| **PDF Engine** | jsPDF + jsPDF-AutoTable |
| **Backend** | Google Apps Script (serverless API) |
| **Database** | Firebase Realtime Database |
| **Storage** | Google Drive |
| **Ledger** | Google Sheets |
| **Email Service** | Gmail (MailApp Service) |

---

### ⚙️ System Workflow  

1. User creates a CN via web app.  
2. App generates two PDFs — party copy & printer copy.  
3. CN data and PDFs are sent to the Google Apps Script backend.  
4. Backend (Apps Script):  
   - Saves PDFs in Drive  
   - Logs CN data in Google Sheets  
   - Sends emails to respective recipients  
5. Returns confirmation back to the web app.  
6. Firebase logs the action for audit trail.  

---

### 🧱 Setup & Deployment  

Setup instructions have been moved to [`SETUP.md`](SETUP.md) for clarity.  

---

### 📈 Example Use Case  

> Designed for a business that issues **quarterly and monthly credit notes** to its tied-up partners.  
> The app automates the entire CN creation and distribution pipeline, improving efficiency and record accuracy.  

---

### 👨‍💻 Author  

**Hemant Borana**  
BCA Final Year Student • Aspiring Data & Business Analyst • Entrepreneurial Developer  

> Project concept and workflow by me.  
> Developed using **Google AI Studio** for rapid prototyping and integration.

---

### 🧠 Key Learnings  

- End-to-end process automation  
- Full-stack integration using Google’s ecosystem  
- Real-world workflow digitization  
- Serverless deployment and low-cost scalability  

---

### 📸 Screenshots  

*(Add screenshots of your dashboard, CN form, and sample PDFs here.)*  

---

### 🪪 License  

MIT License — Open for learning and demo purposes.  

---

### 🗒️ Note  

This repository is a **sanitized public version** of a private internal project.  
All sensitive credentials and company data have been removed for security reasons.  
