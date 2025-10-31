import React, { useState, useEffect, useMemo } from 'react';
import { Template, Party } from '../types';
import { getTemplates, addTemplate, updateTemplate, deleteTemplate, getParties } from '../services/firebaseService';
import { useToast } from './common/Toast';
import TemplateFormModal from './common/TemplateFormModal';
import ConfirmationModal from './common/ConfirmationModal';
import SkeletonLoader from './common/SkeletonLoader';

const TemplateManagement: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [parties, setParties] = useState<Party[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

    const { showToast } = useToast();

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [fetchedTemplates, fetchedParties] = await Promise.all([getTemplates(), getParties()]);
            setTemplates(fetchedTemplates);
            setParties(fetchedParties);
        } catch (err) {
            setError('Failed to fetch data from the database.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredTemplates = useMemo(() => {
        return templates.filter(template =>
            template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.partyName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [templates, searchTerm]);

    const handleAdd = () => {
        setSelectedTemplate(null);
        setIsModalOpen(true);
    };

    const handleEdit = (template: Template) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };
    
    const handleDelete = (template: Template) => {
        setTemplateToDelete(template);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!templateToDelete) return;
        try {
            await deleteTemplate(templateToDelete.id);
            showToast(`Template '${templateToDelete.name}' deleted successfully.`, 'success');
            await fetchData(); // Refresh the list
        } catch (error: any) {
            showToast(`Error deleting template: ${error.message}`, 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setTemplateToDelete(null);
        }
    };

    const handleSave = async (templateData: Omit<Template, 'id'>) => {
        try {
            if (selectedTemplate) {
                await updateTemplate(selectedTemplate.id, templateData);
                showToast(`Template '${templateData.name}' updated successfully.`, 'success');
            } else {
                await addTemplate(templateData);
                showToast(`Template '${templateData.name}' added successfully.`, 'success');
            }
            setIsModalOpen(false);
            await fetchData(); // Refresh list after saving
        } catch (error: any) {
            showToast(`Failed to save template: ${error.message}`, 'error');
        }
    };
    
    if (loading) {
        return (
            <div className="container mx-auto">
                <h2 className="text-2xl font-bold text-brand-gold mb-6 border-b-2 border-brand-gold pb-2">Template Management</h2>
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
            <h2 className="text-2xl font-bold text-brand-gold mb-6 border-b-2 border-brand-gold pb-2">Template Management</h2>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <input
                    type="text"
                    placeholder="Search by template or party name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-72 bg-brand-gray border border-brand-light-gray rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm"
                />
                <button
                    onClick={handleAdd}
                    className="w-full sm:w-auto py-2 px-4 border border-transparent bg-brand-gold text-brand-dark rounded-md shadow-sm text-sm font-medium hover:bg-yellow-400 focus:outline-none"
                >
                    Add New Template
                </button>
            </div>

            <div className="bg-brand-gray shadow-lg rounded-lg overflow-hidden border-2 border-brand-light-gray">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-light-gray">
                        <thead className="bg-brand-light-gray">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">Template Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">Party Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gold uppercase tracking-wider">CN %</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-gold uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-gray divide-y divide-brand-light-gray">
                            {filteredTemplates.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-400">No templates found.</td>
                                </tr>
                            ) : (
                                filteredTemplates.map((template) => (
                                    <tr key={template.id} className="hover:bg-brand-light-gray transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{template.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{template.partyName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{template.cnPercentage}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button onClick={() => handleEdit(template)} className="text-brand-gold hover:text-yellow-300">Edit</button>
                                            <button onClick={() => handleDelete(template)} className="text-red-500 hover:text-red-400">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <TemplateFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    template={selectedTemplate}
                    parties={parties}
                />
            )}
            
            {isConfirmModalOpen && templateToDelete && (
                 <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="Delete Template"
                    message={`Are you sure you want to delete the template "${templateToDelete.name}"? This action cannot be undone.`}
                />
            )}
        </div>
    );
};

export default TemplateManagement;
