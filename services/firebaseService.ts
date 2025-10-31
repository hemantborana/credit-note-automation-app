import { Party, CompanySettings, Template, AuditLogEntry } from '../types';

// These are imported from the global scope from index.html
declare const firebase: any;

const firebaseConfig = {
  apiKey: "AIzaSyD75VN0x6DLmKljSMKOqXgVYFIuU_X7g7c",
  authDomain: "ka-oms-new.firebaseapp.com",
  databaseURL: "https://ka-oms-new-default-rtdb.firebaseio.com",
  projectId: "ka-oms-new",
  storageBucket: "ka-oms-new.firebasestorage.app",
  messagingSenderId: "528745660731",
  appId: "1:528745660731:web:277e4e0ae6382d2378771e",
  measurementId: "G-B7EEVXQ2TG"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();

const PARTY_DATA_PATH = '/PARTYDATA_CN_MAILER';

// --- Party Functions ---
export const getParties = async (): Promise<Party[]> => {
  try {
    const snapshot = await database.ref(PARTY_DATA_PATH).once('value');
    const data = snapshot.val();
    if (data) {
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).sort((a, b) => a.name.localeCompare(b.name)); // Sort parties alphabetically
    }
    return [];
  } catch (error) {
    console.error("Error fetching parties:", error);
    throw error;
  }
};

export const addParty = async (partyData: Omit<Party, 'id'>): Promise<string> => {
    try {
        const newPartyRef = database.ref(PARTY_DATA_PATH).push();
        await newPartyRef.set(partyData);
        return newPartyRef.key;
    } catch (error) {
        console.error("Error adding party:", error);
        throw error;
    }
};

export const updateParty = async (partyId: string, partyData: Omit<Party, 'id'>): Promise<void> => {
    try {
        await database.ref(`${PARTY_DATA_PATH}/${partyId}`).update(partyData);
    } catch (error) {
        console.error("Error updating party:", error);
        throw error;
    }
};

export const deleteParty = async (partyId: string): Promise<void> => {
    try {
        await database.ref(`${PARTY_DATA_PATH}/${partyId}`).remove();
    } catch (error) {
        console.error("Error deleting party:", error);
        throw error;
    }
};

export const updatePartyEmail = async (partyId: string, email: string): Promise<void> => {
    try {
        await database.ref(`${PARTY_DATA_PATH}/${partyId}/email`).set(email);
    } catch (error) {
        console.error("Error updating party email:", error);
        throw error;
    }
}

export const uploadParties = async (parties: Omit<Party, 'id'>[]): Promise<void> => {
    try {
        const updates: { [key: string]: Omit<Party, 'id'> } = {};
        parties.forEach(party => {
            const newKey = database.ref(PARTY_DATA_PATH).push().key;
            if (newKey) {
                 updates[newKey] = party;
            }
        });
        // This atomic operation overwrites everything at the path with the new set of parties.
        await database.ref(PARTY_DATA_PATH).set(updates);
    } catch (error) {
        console.error("Error bulk uploading parties:", error);
        throw error;
    }
};


// --- CN Counter Functions ---
export const getCnCounter = async (): Promise<number> => {
    try {
        const snapshot = await database.ref('/cnCounter').once('value');
        return snapshot.val() || 0;
    } catch (error) {
        console.error("Error fetching CN counter:", error);
        throw error;
    }
};

export const incrementCnCounter = async (): Promise<void> => {
    try {
        await database.ref('/cnCounter').transaction((currentValue) => {
            return (currentValue || 0) + 1;
        });
    } catch (error) {
        console.error("Error incrementing CN counter:", error);
        throw error;
    }
};

// --- Settings Functions ---
export const getSettings = async (): Promise<CompanySettings> => {
    const defaultSettings: CompanySettings = {
        name: "KAMBESHWAR AGENCIES",
        addressLine1: "Upper Ground Floor, Shop No. 6, Essar Trade Centre",
        addressLine2: "Shashikant Narvekar Road, Morod, Mapusa, North Goa - 403507",
        contactInfo: "Phone: 0832-2266714 / 9422593814 / 9423546561",
        gstin: "30AOEPB9968G1ZZ",
        udyam: "UDYAM-GA-01-0014437",
        stateCode: "30 (Goa)"
    };
    try {
        const snapshot = await database.ref('/settings').once('value');
        const data = snapshot.val();
        return data ? { ...defaultSettings, ...data } : defaultSettings;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return defaultSettings; // Return defaults on error
    }
};

export const updateSettings = async (settings: CompanySettings): Promise<void> => {
    try {
        await database.ref('/settings').update(settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
};

// --- Template Functions ---
export const getTemplates = async (): Promise<Template[]> => {
  try {
    const snapshot = await database.ref('/cnTemplates').once('value');
    const data = snapshot.val();
    if (data) {
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }
};

export const addTemplate = async (templateData: Omit<Template, 'id'>): Promise<string> => {
    try {
        const newTemplateRef = database.ref('/cnTemplates').push();
        await newTemplateRef.set(templateData);
        return newTemplateRef.key;
    } catch (error) {
        console.error("Error adding template:", error);
        throw error;
    }
};

export const updateTemplate = async (templateId: string, templateData: Omit<Template, 'id'>): Promise<void> => {
    try {
        await database.ref(`/cnTemplates/${templateId}`).update(templateData);
    } catch (error) {
        console.error("Error updating template:", error);
        throw error;
    }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
    try {
        await database.ref(`/cnTemplates/${templateId}`).remove();
    } catch (error) {
        console.error("Error deleting template:", error);
        throw error;
    }
};

// --- Audit Log Functions ---
export const addAuditLog = async (action: string, details: string, timestamp?: string): Promise<void> => {
  try {
    const newLogRef = database.ref('/auditLog').push();
    const logEntry: Omit<AuditLogEntry, 'id'> = {
      timestamp: timestamp || new Date().toISOString(),
      action,
      details,
    };
    await newLogRef.set(logEntry);
  } catch (error) {
    console.error("Error adding audit log:", error);
    // Don't throw, as this is a background task and shouldn't block the UI
  }
};

export const getAuditLogs = async (): Promise<AuditLogEntry[]> => {
  try {
    const snapshot = await database.ref('/auditLog').once('value');
    const data = snapshot.val();
    if (data) {
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // Sort newest first
    }
    return [];
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};