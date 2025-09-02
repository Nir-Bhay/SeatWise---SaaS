import React, { useState, useEffect } from 'react';
import { buildingService } from '../services/apiService';
import toast from 'react-hot-toast';
import {
    Plus,
    Building,
    Edit,
    Trash2,
    Users,
    LayoutGrid  // Alternative icon - no naming issues
} from 'lucide-react';

const Buildings = () => {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBuilding, setEditingBuilding] = useState(null);

    const [buildingForm, setBuildingForm] = useState({
        name: '',
        code: '',
        floors: [
            {
                name: 'Ground Floor',
                rooms: [
                    {
                        number: '101',
                        rows: 6,
                        columns: 5,
                        capacity: 30,
                        facilities: []
                    }
                ]
            }
        ]
    });

    useEffect(() => {
        loadBuildings();
    }, []);

    const loadBuildings = async () => {
        try {
            setLoading(true);
            const response = await buildingService.getAll();
            setBuildings(response.data);
        } catch (error) {
            toast.error('Failed to load buildings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (editingBuilding) {
                await buildingService.update(editingBuilding._id, buildingForm);
                toast.success('Building updated successfully');
            } else {
                await buildingService.create(buildingForm);
                toast.success('Building created successfully');
            }

            setShowModal(false);
            resetForm();
            loadBuildings();
        } catch (error) {
            toast.error(editingBuilding ? 'Failed to update building' : 'Failed to create building');
        }
    };

    const handleEdit = (building) => {
        setEditingBuilding(building);
        setBuildingForm({
            name: building.name,
            code: building.code,
            floors: building.floors
        });
        setShowModal(true);
    };

    const handleDelete = async (buildingId) => {
        if (window.confirm('Are you sure you want to delete this building?')) {
            try {
                await buildingService.delete(buildingId);
                toast.success('Building deleted successfully');
                loadBuildings();
            } catch (error) {
                toast.error('Failed to delete building');
            }
        }
    };

    const resetForm = () => {
        setEditingBuilding(null);
        setBuildingForm({
            name: '',
            code: '',
            floors: [
                {
                    name: 'Ground Floor',
                    rooms: [
                        {
                            number: '101',
                            rows: 6,
                            columns: 5,
                            capacity: 30,
                            facilities: []
                        }
                    ]
                }
            ]
        });
    };

    const addFloor = () => {
        setBuildingForm({
            ...buildingForm,
            floors: [
                ...buildingForm.floors,
                {
                    name: 'New Floor',
                    rooms: []
                }
            ]
        });
    };

    const removeFloor = (floorIndex) => {
        setBuildingForm({
            ...buildingForm,
            floors: buildingForm.floors.filter((_, index) => index !== floorIndex)
        });
    };

    const addRoom = (floorIndex) => {
        const updatedFloors = [...buildingForm.floors];
        updatedFloors[floorIndex].rooms.push({
            number: '',
            rows: 6,
            columns: 5,
            capacity: 30,
            facilities: []
        });
        setBuildingForm({ ...buildingForm, floors: updatedFloors });
    };

    const removeRoom = (floorIndex, roomIndex) => {
        const updatedFloors = [...buildingForm.floors];
        updatedFloors[floorIndex].rooms.splice(roomIndex, 1);
        setBuildingForm({ ...buildingForm, floors: updatedFloors });
    };

    const updateFloor = (floorIndex, field, value) => {
        const updatedFloors = [...buildingForm.floors];
        updatedFloors[floorIndex][field] = value;
        setBuildingForm({ ...buildingForm, floors: updatedFloors });
    };

    const updateRoom = (floorIndex, roomIndex, field, value) => {
        const updatedFloors = [...buildingForm.floors];
        if (field === 'rows' || field === 'columns') {
            const rows = field === 'rows' ? parseInt(value) : updatedFloors[floorIndex].rooms[roomIndex].rows;
            const columns = field === 'columns' ? parseInt(value) : updatedFloors[floorIndex].rooms[roomIndex].columns;
            updatedFloors[floorIndex].rooms[roomIndex].capacity = rows * columns;
        }
        updatedFloors[floorIndex].rooms[roomIndex][field] = value;
        setBuildingForm({ ...buildingForm, floors: updatedFloors });
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
                    <h1 className="text-2xl font-bold text-gray-900">Building Management</h1>
                    <p className="text-gray-600 mt-1">
                        Configure your university buildings, floors, and room layouts
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Building
                </button>
            </div>

            {/* Buildings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {buildings.length > 0 ? (
                    buildings.map((building) => (
                        <div key={building._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Building className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{building.name}</h3>
                                        <p className="text-sm text-gray-600">Code: {building.code}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleEdit(building)}
                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(building._id)}
                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Building Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{building.floors.length}</div>
                                    <div className="text-xs text-blue-800">Floors</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {building.floors.reduce((total, floor) => total + floor.rooms.length, 0)}
                                    </div>
                                    <div className="text-xs text-green-800">Rooms</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-purple-600">{building.grandTotal}</div>
                                    <div className="text-xs text-purple-800">Total Seats</div>
                                </div>
                            </div>

                            {/* Floors Overview */}
                            <div className="space-y-2">
                                {building.floors.map((floor, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900">{floor.name}</span>
                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                <span className="flex items-center">
                                                    <LayoutGrid className="h-4 w-4 mr-1" />
                                                    {floor.rooms.length} rooms
                                                </span>
                                                <span className="flex items-center">
                                                    <Users className="h-4 w-4 mr-1" />
                                                    {floor.totalCapacity} seats
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-12 bg-white rounded-lg shadow-sm">
                        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No buildings configured</h3>
                        <p className="text-gray-600 mb-4">Start by adding your first building with room layouts</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Building
                        </button>
                    </div>
                )}
            </div>

            {/* Building Form Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">
                            {editingBuilding ? 'Edit Building' : 'Add New Building'}
                        </h3>

                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Building Name
                                    </label>
                                    <input
                                        type="text"
                                        value={buildingForm.name}
                                        onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                                        placeholder="e.g., F Block, Main Building"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Building Code
                                    </label>
                                    <input
                                        type="text"
                                        value={buildingForm.code}
                                        onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
                                        placeholder="e.g., F, MAIN, A1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Floors Configuration */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-medium text-gray-900">Floors Configuration</h4>
                                    <button
                                        onClick={addFloor}
                                        className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Floor
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {buildingForm.floors.map((floor, floorIndex) => (
                                        <div key={floorIndex} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <input
                                                    type="text"
                                                    value={floor.name}
                                                    onChange={(e) => updateFloor(floorIndex, 'name', e.target.value)}
                                                    className="text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                                                    placeholder="Floor Name"
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => addRoom(floorIndex)}
                                                        className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Add Room
                                                    </button>
                                                    {buildingForm.floors.length > 1 && (
                                                        <button
                                                            onClick={() => removeFloor(floorIndex)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Rooms */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {floor.rooms.map((room, roomIndex) => (
                                                    <div key={roomIndex} className="bg-gray-50 rounded-lg p-3 relative">
                                                        <button
                                                            onClick={() => removeRoom(floorIndex, roomIndex)}
                                                            className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>

                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Room Number
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={room.number}
                                                                    onChange={(e) => updateRoom(floorIndex, roomIndex, 'number', e.target.value)}
                                                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                    placeholder="101"
                                                                />
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Rows
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={room.rows}
                                                                        onChange={(e) => updateRoom(floorIndex, roomIndex, 'rows', parseInt(e.target.value))}
                                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Columns
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={room.columns}
                                                                        onChange={(e) => updateRoom(floorIndex, roomIndex, 'columns', parseInt(e.target.value))}
                                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Capacity
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={room.capacity}
                                                                    readOnly
                                                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-8">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {editingBuilding ? 'Update Building' : 'Create Building'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Buildings;