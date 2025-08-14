import React, { useEffect, useRef, useState } from 'react';
import {
    CheckSquare,
    Plus,
    Filter,
    MoreHorizontal,
    Search,
    Calendar,
    User,
    Clock,
    ChevronDown,
    List,
    Kanban,
    SortAsc,
    Users,
    Settings,
    FolderPlus,
    Eye,
    EyeClosed,
    GripVertical,
    ListPlus
} from 'lucide-react';
import { useDrag, useDrop } from "react-dnd";

const TasksSection = () => {
    const [activeView, setActiveView] = useState('List');
    const [activeFilter, setActiveFilter] = useState('Owned');
    const [expandedGroup, setExpandedGroup] = useState('Default Group');
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showDateInput, setShowDateInput] = useState(false);
    const [showtasks, setShowTasks] = useState(true);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [statusFilter, setStatusFilter] = useState("Ongoing");
    const statusRef = useRef<HTMLDivElement>(null);

    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [sortBy, setSortBy] = useState("Custom");
    const sortRef = useRef<HTMLDivElement>(null);

    const [showGroupByDropdown, setShowGroupByDropdown] = useState(false);
    const [groupBy, setGroupBy] = useState("Custom Group");
    const groupRef = useRef<HTMLDivElement>(null);

    const newTaskRef = useRef<HTMLDivElement>(null);
    const newTaskInlineRef = useRef<HTMLDivElement>(null);

    const [newTaskRowVisible, setNewTaskRowVisible] = useState(false);

    const [newTaskData, setNewTaskData] = useState<Record<string, string>>({
        taskTitle: "",
        startTime: "",
        dueDate: "",
        creator: "sourabh rathi",
        createdAt: "",
        owner: "",
        assignedBy: "",
        subscriber: "",
        completedAt: "",
        lastModifiedAt: "",
        taskId: "",
        sourceCategory: "",
    });
    const handleFieldChange = (key: string, value: string) => {
        setNewTaskData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };




    const handleshowtassk = () => {
        setShowTasks(!showtasks);
    }

    const [filters, setFilters] = useState([
        { field: '', condition: '', value: '' }
    ]);
    const customizeRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    const [showCustomize, setShowCustomize] = useState(false);

    const defaultColumns = [
        { key: "taskTitle", label: "Task Title", visible: true },
        { key: "startTime", label: "Start Time", visible: true },
        { key: "dueDate", label: "Due Date", visible: true },
        { key: "creator", label: "Creator", visible: true },
        { key: "createdAt", label: "Created at", visible: true },
        { key: "owner", label: "Owner", visible: false },
        { key: "assignedBy", label: "Assigned by", visible: false },
        { key: "subscriber", label: "Subscriber", visible: false },
        { key: "completedAt", label: "Completed at", visible: false },
        { key: "lastModifiedAt", label: "Last Modified at", visible: false },
        { key: "taskId", label: "Task ID", visible: false },
        { key: "sourceCategory", label: "Source Category", visible: false }
    ];

    const [columns, setColumns] = useState(defaultColumns);

    // Mock data
    const taskGroups = [
        {
            id: 'default',
            name: 'Default Group',
            count: 0,
            tasks: []
        }
    ];

    const quickAccessItems = [
        { id: 'all', label: 'All Tasks', icon: List },
        { id: 'created', label: 'Created', icon: Plus },
        { id: 'assigned', label: 'Assigned', icon: User },
        { id: 'completed', label: 'Completed', icon: CheckSquare }
    ];

    const filterTabs = [
        { id: 'owned', label: 'Owned' },
        { id: 'subscribed', label: 'Subscribed' },
        { id: 'activities', label: 'Activities' }
    ];

    const [selectedQuickAccess, setSelectedQuickAccess] = useState('all');

    const DraggableColumn = ({ column, index, moveColumn, toggleVisibility }: any) => {
        const ref = React.useRef<HTMLDivElement>(null);
        const ItemType = "COLUMN";
        const [, drop] = useDrop({
            accept: ItemType,
            hover(item: any) {
                if (!ref.current || item.index === index) return;
                moveColumn(item.index, index);
                item.index = index;
            },
        });

        const [{ isDragging }, drag] = useDrag({
            type: ItemType,
            item: { index },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        });

        drag(drop(ref));

        return (
            <div
                ref={ref}
                className={`flex justify-between items-center px-1 py-1 ${isDragging ? "bg-gray-100" : ""
                    }`}
            >
                <span className="flex items-center gap-2">
                    <span className="cursor-move text-gray-400"><GripVertical className="w-4 h-4 text-gray-400" /></span>
                    {column.label}
                </span>
                <button
                    onClick={() => toggleVisibility(index)}
                    className="text-gray-500 hover:text-blue-600"
                >
                    {column.visible ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeClosed className="w-4 h-4 text-gray-400" />}
                </button>
            </div>
        );
    };

    const moveColumn = (fromIndex: number, toIndex: number) => {
        const updated = [...columns];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        setColumns(updated);
    };

    const toggleVisibility = (index: number) => {
        const updated = [...columns];
        updated[index].visible = !updated[index].visible;
        setColumns(updated);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;

            if (showCustomize && customizeRef.current && !customizeRef.current.contains(target)) {
                setShowCustomize(false);
            }

            if (showFilterPanel && filterRef.current && !filterRef.current.contains(target)) {
                setShowFilterPanel(false);
            }

            if (statusRef.current && !statusRef.current.contains(target)) {
                setShowStatusDropdown(false);
            }

            if (sortRef.current && !sortRef.current.contains(target)) {
                setShowSortDropdown(false);
            }

            if (groupRef.current && !groupRef.current.contains(target)) {
                setShowGroupByDropdown(false);
            }

            if (showNewTaskModal && newTaskRef.current && !newTaskRef.current.contains(target)) {
                setShowNewTaskModal(false);
            }
            if (newTaskRowVisible && newTaskInlineRef.current && !newTaskInlineRef.current.contains(target)) {
                setNewTaskRowVisible(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showCustomize, showFilterPanel, showNewTaskModal, newTaskRowVisible]);

    return (
        <div className="h-full bg-gray-50 flex">
            {/* Left Sidebar */}
            {showtasks ? <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <ListPlus className="w-5 h-5 text-blue-600" onClick={handleshowtassk} />
                            <h1 className="text-lg font-semibold text-gray-900">Tasks</h1>
                        </div>
                        {/* <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button> */}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search (Ctrl+K)"
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-4 py-2 border-b border-gray-200">
                    <div className="flex space-x-1">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveFilter(tab.label)}
                                className={`px-3 py-1 text-sm rounded transition-colors ${activeFilter === tab.label
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Access */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">Quick Access</h3>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                        {quickAccessItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedQuickAccess(item.id)}
                                    className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm transition-colors ${selectedQuickAccess === item.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Task List */}
                <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">Task List</h3>
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <Plus className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2 px-2 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-50">
                            <List className="w-4 h-4" />
                            <span>Task List</span>
                        </div>
                    </div>
                </div>

                {/* New Group Button */}
                <div className="p-4 border-t border-gray-200">
                    <button className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-50">
                        <Plus className="w-4 h-4" />
                        <span>New Group</span>
                    </button>
                </div>
            </div>
                :
                ""}

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {showtasks ? "" : <ListPlus className="w-5 h-5 text-blue-600" onClick={handleshowtassk} />}
                            <h2 className="text-xl font-semibold text-gray-900">Owned</h2>
                            <div className="flex items-center space-x-2">
                                <button className={`px-3 py-1 text-sm rounded border ${activeView === 'List'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}>
                                    <List className="w-4 h-4 inline mr-1" />
                                    List
                                </button>
                                {/* <button className={`px-3 py-1 text-sm rounded border ${
                                    activeView === 'Kanban' 
                                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                        : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}>
                                    <Kanban className="w-4 h-4 inline mr-1" />
                                    Kanban
                                </button> */}
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onClick={() => setShowNewTaskModal(true)} >
                            <Plus className="w-4 h-4 inline mr-2" />
                            New Task
                        </button>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex items-center space-x-4">
                            <button className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setNewTaskRowVisible(true)}>
                                <Plus className="w-4 h-4" />
                                <span>New Task </span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setShowStatusDropdown(!showStatusDropdown)}>
                                <Settings className="w-4 h-4" />
                                <span>Ongoing</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setShowFilterPanel(!showFilterPanel)}>
                                <Filter className="w-4 h-4" />
                                <span>Filter</span>
                                {/* <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">1</span> */}
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setShowSortDropdown(!showSortDropdown)}>
                                <SortAsc className="w-4 h-4" />
                                <span>Sort by: Custom</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setShowGroupByDropdown(!showGroupByDropdown)}>
                                <Users className="w-4 h-4" />
                                <span>Group by: Custom Group</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setShowCustomize(!showCustomize)}>
                                <Settings className="w-4 h-4" />
                                <span>Customize</span>
                            </button>
                        </div>

                    </div>
                </div>

                {/* Table Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm text-gray-600">
                        {columns
                            .filter((col) => col.visible)
                            .map((col) => (
                                <div key={col.key} className="col-span-2 flex items-center space-x-1">
                                    {col.key === "startTime" && <Clock className="w-4 h-4" />}
                                    {col.key === "dueDate" && <Calendar className="w-4 h-4" />}
                                    {col.key === "creator" && <User className="w-4 h-4" />}
                                    {col.key === "createdAt" && <Clock className="w-4 h-4" />}
                                    <span>{col.label}</span>
                                </div>
                            ))}
                    </div>

                </div>


                {newTaskRowVisible && (
                    <div className="  flex items-center bg-white border px-4 py-2 rounded shadow-sm space-x-2 mt-2 ml-4 mr-4" ref={newTaskInlineRef} >
                        {columns
                            .filter((col) => col.visible)
                            .map((col) => (
                                <div key={col.key} className="flex items-center space-x-1 text-sm ">
                                    {/* Icons */}
                                    {col.key === "startTime" && <Clock className="w-4 h-4 text-gray-500" />}
                                    {col.key === "dueDate" && <Calendar className="w-4 h-4 text-gray-500" />}
                                    {col.key === "creator" && <User className="w-4 h-4 text-gray-500" />}
                                    {col.key === "createdAt" && <Clock className="w-4 h-4 text-gray-500" />}

                                    {/* Inputs */}
                                    {["startTime", "dueDate", "createdAt", "completedAt", "lastModifiedAt"].includes(col.key) ? (
                                        <input
                                            type="date"
                                            value={newTaskData[col.key]}
                                            onChange={(e) => handleFieldChange(col.key, e.target.value)}
                                            className="w-full border px-2 py-1 rounded text-sm"
                                        />
                                    ) : col.key === "taskTitle" ? (
                                        <input
                                            type="text"
                                            placeholder="Enter task title"
                                            value={newTaskData[col.key]}
                                            onChange={(e) => handleFieldChange(col.key, e.target.value)}
                                            className="w-full border px-2 py-1 rounded text-sm"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={newTaskData[col.key]}
                                            onChange={(e) => handleFieldChange(col.key, e.target.value)}
                                            placeholder={col.label}
                                            className="w-full border px-2 py-1 rounded text-sm"
                                        />
                                    )}
                                </div>
                            ))}

                        {/* Submit Button */}
                        <button
                            onClick={() => {
                                // TODO: replace with actual POST API
                                setNewTaskRowVisible(false);
                            }}
                            className="ml-2 px-3 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        >
                            Add
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 bg-gray-50 p-4">
                    <div className="bg-white rounded-lg border border-gray-200">
                        {/* Group Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setExpandedGroup(expandedGroup === 'Default Group' ? null : 'Default Group')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedGroup === 'Default Group' ? 'rotate-0' : '-rotate-90'
                                        }`} />
                                </button>
                                <h3 className="font-medium text-gray-900">Default Group</h3>
                                <span className="text-sm text-gray-500">0</span>
                            </div>
                            <button className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700">
                                <Plus className="w-4 h-4" />
                                <span>New Group</span>
                            </button>
                        </div>

                        {/* Empty State */}
                        {expandedGroup === 'Default Group' && (
                            <div className="p-8 text-center">
                                <div className="text-gray-400 mb-4">
                                    <CheckSquare className="w-12 h-12 mx-auto mb-2" />
                                </div>
                                <p className="text-gray-500 mb-4">No tasks yet</p>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    <Plus className="w-4 h-4 inline mr-2" />
                                    New Task
                                </button>
                            </div>
                        )}

                        {/* New Task Row */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Plus className="w-4 h-4" />
                                <span>New Task</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {showNewTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center"  >
                    <div className="bg-white w-[600px] rounded-lg shadow-lg p-6 relative" ref={newTaskRef}>
                        {/* Close Button */}
                        <button
                            onClick={() => setShowNewTaskModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
                        >
                            &times;
                        </button>

                        {/* Title */}
                        <h2 className="text-sm font-medium text-gray-700 mb-4">Press Enter to add task</h2>

                        {/* Owner and Group */}
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="flex items-center gap-1 border px-2 py-1 rounded text-sm text-gray-600">
                                <span className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs">X</span>
                                <span>xyz</span>
                            </div>
                            <div className="text-sm text-gray-500">|</div>
                            <select className="text-sm border px-2 py-1 rounded text-gray-700">
                                <option>Default Group</option>
                                <option>New Group</option>
                            </select>
                        </div>

                        {/* Date Chips */}
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm"
                                onClick={() => {
                                    setSelectedDate(new Date().toISOString().split("T")[0]);
                                    setShowDateInput(false);
                                }}
                            >
                                Today
                            </button>

                            <button
                                className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm"
                                onClick={() => {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    setSelectedDate(tomorrow.toISOString().split("T")[0]);
                                    setShowDateInput(false);
                                }}
                            >
                                Tomorrow
                            </button>

                            {!showDateInput ? (

                                <button
                                    className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm"
                                    onClick={() => setShowDateInput(true)}
                                >
                                    {selectedDate ? selectedDate : "Other"}
                                </button>
                            ) : (
                                <input
                                    type="date"
                                    autoFocus
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setShowDateInput(false);
                                    }}
                                    onBlur={() => setShowDateInput(false)}
                                />
                            )}
                        </div>


                        {/* Add to Task List */}
                        <div className="mb-3">
                            <input
                                type="text"
                                placeholder="Add to Task List"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-3">
                            <textarea
                                placeholder="Add Description"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                rows={3}
                            ></textarea>
                        </div>

                        {/* Footer Icons */}
                        <div className="flex justify-between items-center mt-4 text-sm">
                            <div className="flex items-center gap-4 text-gray-400">
                                <span className="cursor-pointer">↩️</span>
                                <span className="cursor-pointer">📎</span>
                                <span className="cursor-pointer text-blue-600">Add Subscribers</span>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowNewTaskModal(false)}
                                    className="px-4 py-1.5 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showFilterPanel && (
                <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-50 w-[720px] rounded-lg bg-white shadow-lg border border-gray-200" ref={filterRef}>
                    <div className="p-6 space-y-4">

                        <div className="flex justify-between items-center">
                            <h3 className="text-md font-medium text-gray-900">Filter</h3>
                            <button onClick={() => {
                                setFilters([{ field: '', condition: '', value: '' }]);
                                setShowFilterPanel(false);
                            }} className="text-sm text-blue-600 hover:underline">Clear All</button>
                        </div>

                        {filters.map((filter, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">{index === 0 ? 'If' : 'And'}</span>

                                {/* Field Selector */}
                                <select
                                    className="border rounded px-2 py-1 text-sm w-full"
                                    value={filter.field}
                                    onChange={(e) => {
                                        const newFilters = [...filters];
                                        newFilters[index].field = e.target.value;
                                        newFilters[index].condition = '';
                                        newFilters[index].value = '';
                                        setFilters(newFilters);
                                    }}
                                >
                                    <option value="">Select Field</option>
                                    <option value="owner">Owner</option>
                                    <option value="startTime">Start Time</option>
                                    <option value="assignedBy">Assigned by</option>
                                    <option value="creator">Creator</option>
                                </select>

                                {/* Conditionally Render Based on Field */}
                                {filter.field === 'startTime' && (
                                    <>
                                        <select
                                            className="border rounded px-2 py-1 text-sm w-full"
                                            value={filter.condition}
                                            onChange={(e) => {
                                                const newFilters = [...filters];
                                                newFilters[index].condition = e.target.value;
                                                setFilters(newFilters);
                                            }}
                                        >
                                            <option value="">Select</option>
                                            <option value="equals">equals</option>
                                            <option value="before">before</option>
                                            <option value="after">after</option>
                                        </select>

                                        <input
                                            type="date"
                                            className="border rounded px-2 py-1 text-sm w-full"
                                            value={filter.value}
                                            onChange={(e) => {
                                                const newFilters = [...filters];
                                                newFilters[index].value = e.target.value;
                                                setFilters(newFilters);
                                            }}
                                        />
                                    </>
                                )}

                                {filter.field === 'owner' && (
                                    <>
                                        <select
                                            className="border rounded px-2 py-1 text-sm w-full"
                                            value={filter.condition}
                                            onChange={(e) => {
                                                const newFilters = [...filters];
                                                newFilters[index].condition = e.target.value;
                                                setFilters(newFilters);
                                            }}
                                        >
                                            <option value="contains">contains</option>
                                            <option value="equals">equals</option>
                                        </select>

                                        <input
                                            type="text"
                                            className="border rounded px-2 py-1 text-sm w-full"
                                            placeholder="e.g. sourabh rathi"
                                            value={filter.value}
                                            onChange={(e) => {
                                                const newFilters = [...filters];
                                                newFilters[index].value = e.target.value;
                                                setFilters(newFilters);
                                            }}
                                        />
                                    </>
                                )}

                                {/* Remove filter */}
                                <button
                                    onClick={() => {
                                        const newFilters = filters.filter((_, i) => i !== index);
                                        setFilters(newFilters);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}

                        {/* Add Filter Button */}
                        <button
                            onClick={() => {
                                setFilters([...filters, { field: '', condition: '', value: '' }]);
                            }}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Add Filter
                        </button>
                    </div>
                </div>
            )}
            {showCustomize && (
                <div className="absolute top-32 right-52 w-72 z-50 bg-white shadow-lg border rounded-lg p-4" ref={customizeRef}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Customize</h3>
                    <div className="space-y-2  overflow-y-auto text-sm">
                        {columns.map((col, i) => (
                            <DraggableColumn
                                key={col.key}
                                column={col}
                                index={i}
                                moveColumn={moveColumn}
                                toggleVisibility={toggleVisibility}
                            />
                        ))}
                    </div>
                </div>
            )}
            {showStatusDropdown && (
                <div className="absolute  top-32  w-40 bg-white shadow-lg border border-gray-200 rounded z-50" style={{ left: '41%' }} ref={statusRef}>
                    {["Ongoing", "Completed", "All Tasks"].map((status) => (
                        <button
                            key={status}
                            onClick={() => {
                                setStatusFilter(status);
                                setShowStatusDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${statusFilter === status ? "text-blue-600 font-medium" : "text-gray-700"
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            )}
            {showSortDropdown && (
                <div className="absolute top-32   w-48 bg-white shadow-lg border border-gray-200 rounded z-50" ref={sortRef} style={{ left: '52%' }}>
                    {["Custom", "Start Time", "Due Date", "Created at", "Last Modified at", "Completed at"].map((option) => (
                        <button
                            key={option}
                            onClick={() => {
                                setSortBy(option);
                                setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex justify-between ${sortBy === option ? "text-blue-600 font-medium" : "text-gray-700"
                                }`}
                        >
                            {option}
                            {sortBy === option && <span>✔</span>}
                        </button>
                    ))}
                </div>
            )}
            {/* {showGroupByDropdown && (
                <div className="absolute top-32 w-48 bg-white shadow-lg border border-gray-200 rounded z-50 " ref={groupRef} style={{ left: '62%' }}>
                    {["None", "Custom Group", "Start Time", "Due Date", "Creator", "Created from"].map((option) => (
                        <button
                            key={option}
                            onClick={() => {
                                setGroupBy(option);
                                setShowGroupByDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex justify-between ${groupBy === option ? "text-blue-600 font-medium" : "text-gray-700"
                                }`}
                        >
                            {option}
                            {groupBy === option && <span>✔</span>}
                        </button>
                    ))}
                </div>
            )} */}




        </div>
    );
};


export default TasksSection;