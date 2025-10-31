import { CreditNoteData, SheetRowData } from '../types';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_b4ao4_Bv_QMgozv9Z8SXMPY4rbDiNxXiwA-9A7vBqfL0OjgDe1KAd8RqcbRqYPoPgw/exec';

interface ProcessPayload {
    cnData: CreditNoteData;
    partyPdfBase64: string;
    printerPdfBase64: string;
}

// A helper function to handle responses from the Google Apps Script
const handleScriptResponse = async (response: Response) => {
    // Try to parse the JSON response, regardless of the HTTP status code,
    // as our script sends error details in the body.
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        // If the response is not JSON, it's an unexpected server error (e.g., HTML error page).
        throw new Error(`HTTP error ${response.status}: Server returned a non-JSON response. Check the script deployment and logs.`);
    }

    if (!response.ok || (data && data.success === false)) {
        // Construct a detailed error message from the script's JSON response
        const errorMessage = data.message || 'An unknown error occurred.';
        const errorDetail = data.errorDetail ? ` Details: ${data.errorDetail}` : '';
        throw new Error(`${errorMessage}${errorDetail}`);
    }
    
    return data;
};


export const processCreditNote = async (payload: ProcessPayload): Promise<any> => {
    try {
        // FIX: Removed the 'Content-Type' header to avoid CORS preflight issues with Google Apps Script.
        // The body is sent as a string, which the script correctly parses.
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            // No 'headers' object needed here for this simple POST.
            body: JSON.stringify({ action: 'processCN', ...payload }),
        });

        return await handleScriptResponse(response);

    } catch (error) {
        console.error('Error calling Google Apps Script (processCreditNote):', error);
        // The error is re-thrown so the component can catch it and display it.
        throw error;
    }
};

export const getCreditNotes = async (): Promise<SheetRowData[]> => {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getCreditNotes`, {
            method: 'GET',
            mode: 'cors',
        });
        
        const data = await handleScriptResponse(response);
        
        if (data.success && Array.isArray(data.data)) {
            // Reverse to show newest first
            return data.data.reverse();
        }
        
        return [];
    } catch (error) {
        console.error('Error calling Google Apps Script (getCreditNotes):', error);
         // The error is re-thrown so the component can catch it and display it.
        throw error;
    }
};

export const resendCreditNote = async (cnData: SheetRowData, recipient: 'party' | 'ho'): Promise<any> => {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ action: 'resendCN', cnData, recipient }),
        });
        return await handleScriptResponse(response);
    } catch (error) {
        console.error(`Error calling Google Apps Script (resendCreditNote to ${recipient}):`, error);
        throw error;
    }
}