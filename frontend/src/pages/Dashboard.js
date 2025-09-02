import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { studentService, examService, buildingService } from '../services/apiService';
import {
    Users,
    Building,
    FileText,
    TrendingUp,
    Calendar,
    Download,
    Plus
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalRooms: 0,
        activeExams: 0,
        generatedPDFs: 0
    });
    const [recentExams, setRecentExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load statistics
            const [studentsRes, buildingsRes, examsRes] = await Promise.all([
                studentService.getAll({ limit: 1 }),
                buildingService.getAll(),
                examService.getAll()
            ]);

            const totalRooms = buildingsRes.data.reduce((total, building) => {
                return total + building.floors.reduce((floorTotal, floor) => {
                    return floorTotal + floor.rooms.length;
                }, 0);
            }, 0);

            setStats({
                totalStudents: studentsRes.data.pagination.total,
                totalRooms,
                activeExams: examsRes.data.filter(exam => exam.status === 'ready').length,
                generatedPDFs: examsRes.data.reduce((total, exam) =>
                    total + (exam.generatedDocuments?.seatingArrangements?.length || 0), 0
                )
            });

            // Load recent exams
            setRecentExams(examsRes.data.slice(0, 5));
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        {
            title: 'Generate Seating',
            description: 'Create new exam seating arrangement',
            icon: FileText,
            link: '/exams',
            color: 'bg-blue-500'
        },
        {
            title: 'Upload Students',
            description: 'Import student data from Excel',
            icon: Users,
            link: '/students',
            color: 'bg-green-500'
        },
        {
            title: 'Manage Rooms',
            description: 'Configure building and room layouts',
            icon: Building,
            link: '/buildings',
            color: 'bg-purple-500'
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome back, {user?.name}!
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Here's what's happening with your exam management today.
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${user?.subscription?.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {user?.subscription?.plan?.toUpperCase()} Plan
                        </span>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Building className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Available Rooms</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Exams</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.activeExams}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Download className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Generated PDFs</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.generatedPDFs}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.title}
                            to={action.link}
                            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center">
                                <div className={`p-3 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
                                    <action.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                                    <p className="text-sm text-gray-600">{action.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Exams */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Exams</h2>
                        <Link
                            to="/exams"
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            View all
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentExams.length > 0 ? (
                            recentExams.map((exam) => (
                                <div key={exam._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-gray-900">{exam.title}</h3>
                                        <p className="text-sm text-gray-600">
                                            {exam.branches.join(', ')} • {new Date(exam.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${exam.status === 'ready'
                                            ? 'bg-green-100 text-green-800'
                                            : exam.status === 'draft'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {exam.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No exams created yet</p>
                        )}
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Database Connection</span>
                            <span className="flex items-center text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Online
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">PDF Generation</span>
                            <span className="flex items-center text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Available
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Storage Usage</span>
                            <span className="text-gray-900">23% of 10GB</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Subscription</span>
                            <span className="text-gray-900">
                                Valid until {new Date(user?.subscription?.validUntil).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;