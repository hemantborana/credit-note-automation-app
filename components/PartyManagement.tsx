import React, { useState, useEffect, useMemo } from 'react';
import { Party } from '../types';
import { getParties, addParty, updateParty, deleteParty, addAuditLog } from '../services/firebaseService';
import { useToast } from './common/Toast';
import PartyFormModal from './common/PartyFormModal';
import ConfirmationModal from './common/ConfirmationModal';
import SkeletonLoader from './common/SkeletonLoader';
import PartyLedgerModal from './common/PartyLedgerModal';

const PartyManagement: React.FC = () => {
    const [parties, setParties] = useState<Party[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedParty, setSelectedParty] = useState<Party | null>(null);
    const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);
    const [partyForLedger, setPartyForLedger] = useState<Party | null>(null);

    const { showToast } = useToast();

    const fetchParties = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedParties = await getParties();
            setParties(fetchedParties);
        } catch (err) {
            setError('Failed to fetch parties from the database.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParties();
    }, []);

    const filteredParties = useMemo(() => {
        return parties.filter(party =>
            party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            party.city.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [parties, searchTerm]);

    const handleAdd = () => {
        setSelectedParty(null);
        setIsModalOpen(true);
    };

    const handleEdit = (party: Party) => {
        setSelectedParty(party);
        setIsModalOpen(true);
    };
    
    const handleDelete = (party: Party) => {
        setPartyToDelete(party);
        setIsConfirmModalOpen(true);
    };

    const handleViewLedger = (party: Party) => {
        setPartyForLedger(party);
        setIsLedgerOpen(true);
    };

    const confirmDelete = async () => {
        if (!partyToDelete) return;
        try {
            await deleteParty(partyToDelete.id);
            await addAuditLog('DELETE_PARTY', `Party '${partyToDelete.name}' was deleted.`);
            showToast(`Party '${partyToDelete.name}' deleted successfully.`, 'success');
            await fetchParties(); // Refresh the list
        } catch (error: any) {
            showToast(`Error deleting party: ${error.message}`, 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setPartyToDelete(null);
        }
    };

    const handleSave = async (partyData: Omit<Party, 'id'>) => {
        try {
            if (selectedParty) {
                // Update existing party
                await updateParty(selectedParty.id, partyData);
                await addAuditLog('UPDATE_PARTY', `Party details for '${partyData.name}' were updated.`);
                showToast(`Party '${partyData.name}' updated successfully.`, 'success');
            } else {
                // Add new party
                await addParty(partyData);
                await addAuditLog('CREATE_PARTY', `New party '${partyData.name}' was added.`);
                showToast(`Party '${partyData.name}' added successfully.`, 'success');
            }
            setIsModalOpen(false);
            await fetchParties(); // Refresh list after saving
        } catch (error: any) {
            showToast(`Failed to save party: ${error.message}`, 'error');
        }
    };
    
    if (loading) {
        return (
            <div className="container mx-auto">
                <h2 className="text-2xl font-bold text-brand-gold mb-6 border-b-2 border-brand-gold pb-2">Party Management</h2>
                <div className="flex justify-between items-center mb-6">
                    <div className="h-10 bg-brand-light-gray rounded w-72 animate-pulse"></div>
                    <div className="h-10 bg-brand-light-gray rounded w-36 animate-pulse"></div>
                </div>
                 <div className="bg-brand-gray shadow-lg rounded-lg p-4 border-2 border-brand-light-gray">
                     <SkeletonLoader type="table" />
                 </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-brand-gold mb-6 border-b-2 border-brand-gold pb-2">Party Management</h2>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <input
                    type="text"
                    placeholder="Search by name or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-72 bg-brand-gray border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm"
                />
                <button
                    onClick={handleAdd}
                    className="w-full sm:w-auto py-2 px-4 border border-transparent bg-brand-gold text-brand-dark rounded-md shadow-sm text-sm font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-gold"
                >
                    Add New Party
                </button>
            </div>

            <div className="bg-brand-gray shadow-lg rounded-lg overflow-hidden border-2 border-brand-light-gray">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-light-gray">
                        <thead className="bg-brand-light-gray">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">Party Name</th>
                                <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">City</th>
                                <th scope="col" className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-gold uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-gray divide-y divide-brand-light-gray">
                            {filteredParties.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-400">No parties found.</td>
                                </tr>
                            ) : (
                                filteredParties.map((party) => (
                                    <tr key={party.id} className="hover:bg-brand-light-gray transition-colors duration-150">
                                        <td onClick={() => handleViewLedger(party)} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white cursor-pointer hover:text-brand-gold">{party.name}</td>
                                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">{party.city}</td>
                                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">{party.email || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button onClick={() => handleEdit(party)} className="text-brand-gold hover:text-yellow-300">Edit</button>
                                            <button onClick={() => handleDelete(party)} className="text-red-500 hover:text-red-400">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <PartyFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    party={selectedParty}
                />
            )}
            
            {isConfirmModalOpen && partyToDelete && (
                 <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="Delete Party"
                    message={`Are you sure you want to delete the party "${partyToDelete.name}"? This action cannot be undone.`}
                />
            )}

            {isLedgerOpen && partyForLedger && (
                <PartyLedgerModal
                    isOpen={isLedgerOpen}
                    onClose={() => setIsLedgerOpen(false)}
                    party={partyForLedger}
                />
            )}
        </div>
    );
};

export default PartyManagement;