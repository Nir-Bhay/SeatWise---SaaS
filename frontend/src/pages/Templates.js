import React, { useState } from 'react';
import { File, Plus, Edit, Trash2, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const Templates = () => {
    const [templates, setTemplates] = useState([
        { id: 1, name: 'Standard Seating Arrangement', type: 'seating', lastModified: '2024-01-15', status: 'active' },
        { id: 2, name: 'Attendance Sheet Template', type: 'attendance', lastModified: '2024-01-10', status: 'active' },
        { id: 3, name: 'Master List Template', type: 'master', lastModified: '2024-01-05', status: 'draft' }
    ]);

    const handleEdit = (templateId) => {
        toast.success(`Editing template ${templateId}`);
        // Add edit functionality here
    };

    const handleDelete = (templateId) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            setTemplates(templates.filter(t => t.id !== templateId));
            toast.success('Template deleted successfully');
        }
    };

    const handleDownload = (template) => {
        toast.success(`Downloading ${template.name}`);
        // Add download functionality here
    };

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
                    <p className="text-gray-600">Manage your exam document templates</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        New Template
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex items-center">
                        <File className="w-8 h-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Templates</p>
                            <p className="text-2xl font-semibold text-gray-900">{templates.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Templates</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {templates.filter(t => t.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Draft Templates</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {templates.filter(t => t.status === 'draft').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <div key={template.id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <File className="w-8 h-8 text-blue-600 mr-3" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{template.type} Template</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${template.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {template.status}
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="text-xs text-gray-500">
                                    Last modified: {template.lastModified}
                                </p>
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => handleDownload(template)}
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                </button>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(template.id)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-12">
                    <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                    <p className="text-gray-500">Get started by creating your first template</p>
                </div>
            )}
        </div>
    );
};

export default Templates;