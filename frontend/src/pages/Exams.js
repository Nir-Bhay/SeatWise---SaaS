import React, { useState, useEffect } from 'react';
import { examService, studentService, buildingService } from '../services/apiService';
import ClientPDFGenerator from '../services/pdfGenerator';
import toast from 'react-hot-toast';
import {
    Plus,
    Calendar,
    Clock,
    Users,
    Building,
    Download,
    Eye,
    Settings,
    FileText,
    Printer
} from 'lucide-react';

const Exams = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [showSeatingModal, setShowSeatingModal] = useState(false);
    const [pdfGenerator] = useState(new ClientPDFGenerator());

    // Form states (keep existing)
    const [examForm, setExamForm] = useState({
        title: '',
        examType: 'MST-1',
        date: '',
        time: { start: '10:30', end: '13:30' },
        programs: [],
        branches: [],
        semesters: [],
        studentFilters: {
            attendancePercent: 75,
            status: ['Regular'],
            feeStatus: ['Paid']
        }
    });

    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [seatingRules, setSeatingRules] = useState({
        arrangement: 'vertical',
        branchMixing: true,
        skipRows: 0,
        doubleColumns: []
    });

    // Keep existing useEffect and functions (loadExams, handleCreateExam, etc.)
    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        try {
            setLoading(true);
            const response = await examService.getAll();
            setExams(response.data);
        } catch (error) {
            toast.error('Failed to load exams');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExam = async () => {
        try {
            const response = await examService.create(examForm);
            toast.success('Exam created successfully');
            setShowCreateModal(false);
            setExamForm({
                title: '',
                examType: 'MST-1',
                date: '',
                time: { start: '10:30', end: '13:30' },
                programs: [],
                branches: [],
                semesters: [],
                studentFilters: {
                    attendancePercent: 75,
                    status: ['Regular'],
                    feeStatus: ['Paid']
                }
            });
            loadExams();
        } catch (error) {
            toast.error('Failed to create exam');
        }
    };

    const handleGenerateSeating = async () => {
        try {
            const response = await examService.generateSeating(selectedExam._id, {
                selectedRooms,
                seatingRules
            });

            toast.success('Seating arrangement generated successfully');
            setShowSeatingModal(false);
            loadExams();
        } catch (error) {
            toast.error('Failed to generate seating arrangement');
        }
    };

    // Updated PDF generation functions
    const generatePDF = async (type, examId, roomIndex = null) => {
        try {
            toast.loading('Generating PDF...');

            const exam = exams.find(e => e._id === examId);
            if (!exam) {
                toast.error('Exam not found');
                return;
            }

            let pdf;
            let filename;

            switch (type) {
                case 'seating':
                    if (roomIndex === null || !exam.roomAllocation[roomIndex]) {
                        toast.error('Room not found');
                        return;
                    }
                    const roomData = {
                        ...exam.roomAllocation[roomIndex],
                        students: exam.roomAllocation[roomIndex].allocatedStudents
                    };
                    pdf = pdfGenerator.generateSeatingPDF(exam, roomData);
                    filename = `seating-${exam.title}-room-${roomData.roomNumber}.pdf`;
                    break;

                case 'attendance':
                    if (roomIndex === null || !exam.roomAllocation[roomIndex]) {
                        toast.error('Room not found');
                        return;
                    }
                    const attendanceRoomData = {
                        ...exam.roomAllocation[roomIndex],
                        students: exam.roomAllocation[roomIndex].allocatedStudents
                    };
                    pdf = pdfGenerator.generateAttendancePDF(exam, attendanceRoomData);
                    filename = `attendance-${exam.title}-room-${attendanceRoomData.roomNumber}.pdf`;
                    break;

                case 'master':
                    const masterData = {
                        ...exam,
                        rooms: exam.roomAllocation
                    };
                    pdf = pdfGenerator.generateMasterPDF(masterData);
                    filename = `master-plan-${exam.title}.pdf`;
                    break;

                default:
                    toast.error('Invalid PDF type');
                    return;
            }

            pdfGenerator.downloadPDF(pdf, filename);
            toast.dismiss();
            toast.success('PDF generated successfully!');
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to generate PDF: ' + error.message);
            console.error('PDF generation error:', error);
        }
    };

    const previewPDF = async (type, examId, roomIndex = null) => {
        try {
            const exam = exams.find(e => e._id === examId);
            if (!exam) {
                toast.error('Exam not found');
                return;
            }

            let pdf;

            switch (type) {
                case 'seating':
                    if (roomIndex === null || !exam.roomAllocation[roomIndex]) {
                        toast.error('Room not found');
                        return;
                    }
                    const roomData = {
                        ...exam.roomAllocation[roomIndex],
                        students: exam.roomAllocation[roomIndex].allocatedStudents
                    };
                    pdf = pdfGenerator.generateSeatingPDF(exam, roomData);
                    break;

                case 'attendance':
                    if (roomIndex === null || !exam.roomAllocation[roomIndex]) {
                        toast.error('Room not found');
                        return;
                    }
                    const attendanceRoomData = {
                        ...exam.roomAllocation[roomIndex],
                        students: exam.roomAllocation[roomIndex].allocatedStudents
                    };
                    pdf = pdfGenerator.generateAttendancePDF(exam, attendanceRoomData);
                    break;

                case 'master':
                    const masterData = {
                        ...exam,
                        rooms: exam.roomAllocation
                    };
                    pdf = pdfGenerator.generateMasterPDF(masterData);
                    break;

                default:
                    toast.error('Invalid PDF type');
                    return;
            }

            const previewUrl = pdfGenerator.previewPDF(pdf);
            window.open(previewUrl, '_blank');
            toast.success('PDF preview opened!');
        } catch (error) {
            toast.error('Failed to preview PDF: ' + error.message);
        }
    };

    const loadAvailableRooms = async () => {
        try {
            const response = await buildingService.getAvailableRooms({
                date: selectedExam?.date,
                timeSlot: selectedExam?.time
            });
            setAvailableRooms(response.data.availableRooms);
        } catch (error) {
            toast.error('Failed to load available rooms');
        }
    };

    const openSeatingModal = async (exam) => {
        setSelectedExam(exam);
        setShowSeatingModal(true);
        await loadAvailableRooms();
    };

    if (loading) {
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
                    <h1 className="text-2xl font-bold text-gray-900">Exam Management</h1>
                    <p className="text-gray-600 mt-1">
                        Create and manage exam sessions with automated seating arrangements
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Exam
                </button>
            </div>

            {/* Exams List */}
            <div className="grid grid-cols-1 gap-6">
                {exams.length > 0 ? (
                    exams.map((exam) => (
                        <div key={exam._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                                        <p className="text-sm text-gray-600">
                                            {exam.examType} • {exam.branches?.join(', ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${exam.status === 'ready'
                                            ? 'bg-green-100 text-green-800'
                                            : exam.status === 'draft'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {exam.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {new Date(exam.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="h-4 w-4 mr-2" />
                                    {exam.time?.start} - {exam.time?.end}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Users className="h-4 w-4 mr-2" />
                                    {exam.roomAllocation?.reduce((total, room) => total + (room.allocatedStudents?.length || 0), 0) || 0} Students
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Building className="h-4 w-4 mr-2" />
                                    {exam.roomAllocation?.length || 0} Rooms
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {exam.status === 'draft' && (
                                            <button
                                                onClick={() => openSeatingModal(exam)}
                                                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                <Settings className="h-4 w-4 mr-1" />
                                                Generate Seating
                                            </button>
                                        )}

                                        {exam.status === 'ready' && (
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => generatePDF('master', exam._id)}
                                                    className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                                >
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Master Plan
                                                </button>
                                                <button
                                                    onClick={() => previewPDF('master', exam._id)}
                                                    className="flex items-center px-2 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                                    title="Preview Master Plan"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Individual Room Documents */}
                                    {exam.status === 'ready' && exam.roomAllocation && exam.roomAllocation.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm text-gray-600 mr-2">Room Documents:</span>
                                            {exam.roomAllocation.map((room, index) => (
                                                <div key={index} className="flex items-center space-x-1 bg-gray-50 rounded-md p-2">
                                                    <span className="text-xs text-gray-700 font-medium px-2">
                                                        Room {room.roomNumber}
                                                    </span>
                                                    <div className="flex items-center space-x-1">
                                                        {/* Seating Arrangement */}
                                                        <button
                                                            onClick={() => generatePDF('seating', exam._id, index)}
                                                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                                                            title={`Download Seating - Room ${room.roomNumber}`}
                                                        >
                                                            <Download className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => previewPDF('seating', exam._id, index)}
                                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                                                            title={`Preview Seating - Room ${room.roomNumber}`}
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </button>

                                                        {/* Attendance Sheet */}
                                                        <button
                                                            onClick={() => generatePDF('attendance', exam._id, index)}
                                                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                                                            title={`Download Attendance - Room ${room.roomNumber}`}
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => previewPDF('attendance', exam._id, index)}
                                                            className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                                                            title={`Preview Attendance - Room ${room.roomNumber}`}
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No exams created yet</h3>
                        <p className="text-gray-600 mb-4">Get started by creating your first exam session</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Exam
                        </button>
                    </div>
                )}
            </div>

            {/* Create Exam Modal - Keep existing modal code */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Exam</h3>

                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Exam Title
                                    </label>
                                    <input
                                        type="text"
                                        value={examForm.title}
                                        onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                                        placeholder="e.g., Mid Semester Test - 1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Exam Type
                                    </label>
                                    <select
                                        value={examForm.examType}
                                        onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="MST-1">MST-1</option>
                                        <option value="MST-2">MST-2</option>
                                        <option value="ESE">End Semester Exam</option>
                                        <option value="Internal">Internal Assessment</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date and Time */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Exam Date
                                    </label>
                                    <input
                                        type="date"
                                        value={examForm.date}
                                        onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={examForm.time.start}
                                        onChange={(e) => setExamForm({
                                            ...examForm,
                                            time: { ...examForm.time, start: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={examForm.time.end}
                                        onChange={(e) => setExamForm({
                                            ...examForm,
                                            time: { ...examForm.time, end: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Academic Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Programs
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., B.Tech, M.Tech"
                                        onChange={(e) => setExamForm({
                                            ...examForm,
                                            programs: e.target.value.split(',').map(p => p.trim()).filter(p => p)
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Branches
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., CSE, ME, CE"
                                        onChange={(e) => setExamForm({
                                            ...examForm,
                                            branches: e.target.value.split(',').map(b => b.trim()).filter(b => b)
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Semesters
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., V, VI, VII"
                                        onChange={(e) => setExamForm({
                                            ...examForm,
                                            semesters: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Student Filters */}
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 mb-3">Student Eligibility Filters</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Minimum Attendance %
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={examForm.studentFilters.attendancePercent}
                                            onChange={(e) => setExamForm({
                                                ...examForm,
                                                studentFilters: {
                                                    ...examForm.studentFilters,
                                                    attendancePercent: parseInt(e.target.value)
                                                }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Allowed Status
                                        </label>
                                        <select
                                            multiple
                                            value={examForm.studentFilters.status}
                                            onChange={(e) => setExamForm({
                                                ...examForm,
                                                studentFilters: {
                                                    ...examForm.studentFilters,
                                                    status: Array.from(e.target.selectedOptions, option => option.value)
                                                }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="Regular">Regular</option>
                                            <option value="Backlog">Backlog</option>
                                            <option value="Ex">Ex</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fee Status
                                        </label>
                                        <select
                                            multiple
                                            value={examForm.studentFilters.feeStatus}
                                            onChange={(e) => setExamForm({
                                                ...examForm,
                                                studentFilters: {
                                                    ...examForm.studentFilters,
                                                    feeStatus: Array.from(e.target.selectedOptions, option => option.value)
                                                }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="Paid">Paid</option>
                                            <option value="Partial">Partial</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-8">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateExam}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create Exam
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Seating Generation Modal - Keep existing modal code */}
            {showSeatingModal && selectedExam && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">
                            Generate Seating Arrangement - {selectedExam.title}
                        </h3>

                        <div className="space-y-6">
                            {/* Available Rooms */}
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 mb-3">Select Rooms</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                                    {availableRooms.map((room, index) => (
                                        <div
                                            key={index}
                                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedRooms.some(r => r.roomNumber === room.roomNumber)
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                            onClick={() => {
                                                if (selectedRooms.some(r => r.roomNumber === room.roomNumber)) {
                                                    setSelectedRooms(selectedRooms.filter(r => r.roomNumber !== room.roomNumber));
                                                } else {
                                                    setSelectedRooms([...selectedRooms, room]);
                                                }
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-medium text-gray-900">Room {room.roomNumber}</h5>
                                                <span className="text-sm text-gray-600">{room.capacity} seats</span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {room.buildingName} - {room.floorName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {room.rows} × {room.columns} layout
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    Selected: {selectedRooms.length} rooms,
                                    Total capacity: {selectedRooms.reduce((sum, room) => sum + room.capacity, 0)} seats
                                </p>
                            </div>

                            {/* Seating Rules */}
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 mb-3">Seating Rules</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Arrangement Type
                                        </label>
                                        <select
                                            value={seatingRules.arrangement}
                                            onChange={(e) => setSeatingRules({ ...seatingRules, arrangement: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="vertical">Vertical (Column-wise)</option>
                                            <option value="horizontal">Horizontal (Row-wise)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Skip Every Nth Row
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="5"
                                            value={seatingRules.skipRows}
                                            onChange={(e) => setSeatingRules({ ...seatingRules, skipRows: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={seatingRules.branchMixing}
                                                onChange={(e) => setSeatingRules({ ...seatingRules, branchMixing: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                Enable branch mixing (prevents students from same branch sitting together)
                                            </span>
                                        </label>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Double Student Columns (comma-separated, e.g., 1,3,5)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 1,3"
                                            onChange={(e) => setSeatingRules({
                                                ...seatingRules,
                                                doubleColumns: e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-8">
                            <button
                                onClick={() => {
                                    setShowSeatingModal(false);
                                    setSelectedRooms([]);
                                    setSeatingRules({
                                        arrangement: 'vertical',
                                        branchMixing: true,
                                        skipRows: 0,
                                        doubleColumns: []
                                    });
                                }}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateSeating}
                                disabled={selectedRooms.length === 0}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Generate Seating Arrangement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Exams;