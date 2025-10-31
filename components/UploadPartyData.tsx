import React, { useState } from 'react';
import { useToast } from './common/Toast';
import { uploadParties, addAuditLog } from '../services/firebaseService';
import { Party } from '../types';
import ConfirmationModal from './common/ConfirmationModal';

// These are imported from the global scope from index.html
declare const XLSX: any;

const UploadPartyData: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [parsedParties, setParsedParties] = useState<Omit<Party, 'id'>[]>([]);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const { showToast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleParse = () => {
        if (!selectedFile) {
            showToast('Please select a file first.', 'error');
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                // header: 1 creates an array of arrays
                const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

                // Skip header row(s), find the first row with a valid name
                let firstRowIndex = json.findIndex(row => row && row[5] && typeof row[5] === 'string' && row[5].trim().length > 2);
                if (firstRowIndex === -1) {
                     showToast('Could not find a valid header or data in the file. Ensure column F contains party names.', 'error');
                     setIsUploading(false);
                     return;
                }
                
                // Start parsing from the row after the header
                const dataRows = json.slice(firstRowIndex + 1);

                const parties: Omit<Party, 'id'>[] = dataRows.map(row => ({
                    // D=3, F=5, G=6, H=7, K=10, P=15, T=19 (0-indexed)
                    city: row[3]?.toString().trim() || '',
                    name: row[5]?.toString().trim() || '',
                    address1: row[6]?.toString().trim() || '',
                    address2: row[7]?.toString().trim() || '',
                    email: row[10]?.toString().trim() || '',
                    whatsappNumber: row[15]?.toString().trim().replace(/[^0-9]/g, '') || '',
                    gstin: row[19]?.toString().trim() || '',
                    address3: '', // address3 is not in the upload spec
                })).filter(party => party.name); // Filter out any rows that didn't have a name

                if (parties.length === 0) {
                    showToast('No valid party data could be extracted. Please check the file format and content.', 'error');
                    setIsUploading(false);
                    return;
                }

                setParsedParties(parties);
                setIsConfirmModalOpen(true);

            } catch (error) {
                console.error(error);
                showToast('An error occurred while parsing the file.', 'error');
            } finally {
                setIsUploading(false);
            }
        };

        reader.onerror = () => {
             showToast('Failed to read the file.', 'error');
             setIsUploading(false);
        };

        reader.readAsArrayBuffer(selectedFile);
    };

    const confirmUpload = async () => {
        setIsConfirmModalOpen(false);
        if (parsedParties.length === 0) return;
        
        setIsUploading(true);
        try {
            await uploadParties(parsedParties);
            await addAuditLog('UPLOAD_PARTIES', `Uploaded and replaced ${parsedParties.length} parties from file: ${selectedFile?.name}.`);
            showToast(`${parsedParties.length} parties have been successfully uploaded and saved.`, 'success');
            setSelectedFile(null); // Reset file input
        } catch (error: any) {
            showToast(`Upload failed: ${error.message}`, 'error');
        } finally {
            setIsUploading(false);
        }
    };
    
    return (
        <div className="container mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-brand-gold mb-6 border-b-2 border-brand-gold pb-2">Upload Party Data</h2>

            <div className="bg-brand-gray p-8 rounded-lg shadow-lg border-2 border-brand-light-gray space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">Instructions</h3>
                    <p className="text-sm text-gray-400 mt-2">
                        Upload an Excel (.xlsx) file to bulk update the party master list. The system will read data based on the following column mapping:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-300 mt-3 space-y-1 pl-2">
                        <li>Column <span className="font-mono text-brand-gold">D</span>: City</li>
                        <li>Column <span className="font-mono text-brand-gold">F</span>: Party Name</li>
                        <li>Column <span className="font-mono text-brand-gold">G</span>: Address Line 1</li>
                        <li>Column <span className="font-mono text-brand-gold">H</span>: Address Line 2</li>
                        <li>Column <span className="font-mono text-brand-gold">K</span>: Email</li>
                        <li>Column <span className="font-mono text-brand-gold">P</span>: Mobile Number</li>
                        <li>Column <span className="font-mono text-brand-gold">T</span>: GSTIN</li>
                    </ul>
                     <p className="text-xs text-yellow-400 mt-4 border-l-4 border-yellow-400 pl-3">
                        <span className="font-bold">Important:</span> This action will completely replace all existing party data with the content from your file.
                    </p>
                </div>

                <div className="pt-4">
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">Select Excel File</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-brand-light-gray border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-400">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-brand-gray rounded-md font-medium text-brand-gold hover:text-yellow-300 focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                                {selectedFile ? selectedFile.name : 'XLSX, XLS up to 10MB'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="button"
                        onClick={handleParse}
                        disabled={!selectedFile || isUploading}
                        className="w-full py-3 px-6 border border-transparent bg-brand-gold text-brand-dark rounded-md shadow-sm text-sm font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-gold disabled:opacity-50"
                    >
                        {isUploading ? 'Processing...' : 'Upload and Replace Data'}
                    </button>
                </div>
            </div>
             {isConfirmModalOpen && (
                 <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={confirmUpload}
                    title="Confirm Data Replacement"
                    message={`You have successfully parsed ${parsedParties.length} parties from the file. Are you sure you want to replace all existing party data with this new data? This action cannot be undone.`}
                />
            )}
        </div>
    );
};

export default UploadPartyData;