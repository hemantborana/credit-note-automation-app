# 🧱 CN Management System — Setup & Deployment Guide  

This guide explains how to set up and run the CN Management System from scratch.  

---

## 📋 Prerequisites  

Before you begin, ensure you have:  
- A **Google Account** with access to Google Drive, Google Sheets, and Gmail  
- A **Firebase Project** (Realtime Database)  
- A modern web browser (Chrome/Edge)  

---

## ⚡ Step 1: Firebase Setup  

1. Go to [Firebase Console](https://console.firebase.google.com).  
2. Create a **new project**.  
3. Navigate to **Build → Realtime Database** and create a new database.  
4. Go to **Project Settings → General tab**.  
5. Scroll to “Your Apps” → click **Web icon (</>)** → register your app.  
6. Copy the `firebaseConfig` object provided by Firebase.  
7. Paste it into:  
