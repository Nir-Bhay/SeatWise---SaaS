import React, { useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/apiService';
import toast from 'react-hot-toast';
import {
    Upload,
    Download,
    Plus,
    Search,
    Filter,
    Users,
    FileSpreadsheet
} from 'lucide-react';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        program: '',
        branch: '',
        semester: '',
        minAttendance: ''
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0
    });

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // Load students data
    const loadStudents = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 50,
                ...filters
            };

            const response = await studentService.getAll(params);
            setStudents(response.data.students);
            setFilteredStudents(response.data.students);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error('Failed to load students');
            console.error('Load students error:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    // Handle search and filtering
    useEffect(() => {
        let filtered = students;

        if (filters.search) {
            filtered = filtered.filter(student =>
                student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                student.enrollmentNo.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        if (filters.program) {
            filtered = filtered.filter(student => student.program === filters.program);
        }

        if (filters.branch) {
            filtered = filtered.filter(student => student.branch === filters.branch);
        }

        if (filters.semester) {
            filtered = filtered.filter(student => student.semester === filters.semester);
        }

        if (filters.minAttendance) {
            filtered = filtered.filter(student => student.attendancePercent >= parseInt(filters.minAttendance));
        }

        setFilteredStudents(filtered);
    }, [students, filters]);

    // Handle file upload
    const handleFileUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('studentFile', selectedFile);

            const response = await studentService.upload(formData);

            toast.success(`Successfully processed ${response.data.summary.validStudents} students`);
            setShowUploadModal(false);
            setSelectedFile(null);
            loadStudents();

            // Show detailed summary
            if (response.data.summary.errors.length > 0) {
                console.warn('Upload errors:', response.data.summary.errors);
            }
        } catch (error) {
            toast.error('File upload failed');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    // Download sample template
    const downloadTemplate = async () => {
        try {
            const response = await studentService.getTemplate();
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'student-template.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Template downloaded successfully');
        } catch (error) {
            toast.error('Failed to download template');
        }
    };

    // Get unique values for filters
    const getUniqueValues = (field) => {
        return [...new Set(students.map(student => student[field]))].filter(Boolean);
    };

    if (loading && students.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                    <p className="text-gray-600 mt-1">
                        Manage student data and import from Excel files
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                    </button>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Students
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Programs</p>
                            <p className="text-2xl font-bold text-gray-900">{getUniqueValues('program').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <Users className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Branches</p>
                            <p className="text-2xl font-bold text-gray-900">{getUniqueValues('branch').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <Users className="h-8 w-8 text-orange-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Eligible (75%+)</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {students.filter(s => s.attendancePercent >= 75).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or enrollment..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Program Filter */}
                    <div>
                        <select
                            value={filters.program}
                            onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Programs</option>
                            {getUniqueValues('program').map(program => (
                                <option key={program} value={program}>{program}</option>
                            ))}
                        </select>
                    </div>

                    {/* Branch Filter */}
                    <div>
                        <select
                            value={filters.branch}
                            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Branches</option>
                            {getUniqueValues('branch').map(branch => (
                                <option key={branch} value={branch}>{branch}</option>
                            ))}
                        </select>
                    </div>

                    {/* Semester Filter */}
                    <div>
                        <select
                            value={filters.semester}
                            onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Semesters</option>
                            {getUniqueValues('semester').map(semester => (
                                <option key={semester} value={semester}>{semester}</option>
                            ))}
                        </select>
                    </div>

                    {/* Attendance Filter */}
                    <div>
                        <input
                            type="number"
                            placeholder="Min Attendance %"
                            value={filters.minAttendance}
                            onChange={(e) => setFilters({ ...filters, minAttendance: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                            max="100"
                        />
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Program/Branch
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Semester/Year
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Attendance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
                                <tr key={student._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                            <div className="text-sm text-gray-500">{student.enrollmentNo}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{student.program}</div>
                                        <div className="text-sm text-gray-500">{student.branch}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">Semester {student.semester}</div>
                                        <div className="text-sm text-gray-500">Year {student.year}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm font-medium ${student.attendancePercent >= 75 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {student.attendancePercent}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${student.status === 'Regular'
                                                ? 'bg-green-100 text-green-800'
                                                : student.status === 'Backlog'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                            {student.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => loadStudents(pagination.current - 1)}
                                disabled={pagination.current === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => loadStudents(pagination.current + 1)}
                                disabled={pagination.current === pagination.pages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{pagination.current}</span> of{' '}
                                    <span className="font-medium">{pagination.pages}</span> ({pagination.total} total students)
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    {[...Array(pagination.pages)].map((_, index) => (
                                        <button
                                            key={index + 1}
                                            onClick={() => loadStudents(index + 1)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.current === index + 1
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Student Data</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Excel File
                                </label>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Supported formats: .xlsx, .xls, .csv
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    <strong>Required columns:</strong> Enrollment No, Name, Program, Branch, Semester, Year
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setSelectedFile(null);
                                }}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFileUpload}
                                disabled={!selectedFile || uploading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Students;