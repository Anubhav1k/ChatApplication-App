import React, { useState } from 'react';
import {
    MessageCircle,
    CheckSquare,
    Calendar,
    Video,
    Users,
    FileText,
    Star,
    LogOut
} from 'lucide-react';
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { useAuth } from "@/context/AuthContext";
import Chat from './Chat';
import { Button } from "@/components/ui/button";
import TasksSection from '@/components/chat/TasksSection';

// Navigation items
const navigationItems = [
    { id: 'messenger', label: 'Messenger', icon: MessageCircle, active: true },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'favorites', label: 'Favorites', icon: Star },
];

export default function MainDashboard() {
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState('messenger');
    const renderContent = () => {
        switch (activeSection) {
            case 'messenger':
                return (
                    <Chat />
                );

            case 'tasks':
                return (
                    <DndProvider backend={HTML5Backend}>
                        <TasksSection />
                    </DndProvider>
                );

            // case 'calendar':
            //     return (

            //     );

            // case 'meetings':
            //     return (

            //     );

            default:
                return (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                            </h3>
                            <p className="text-gray-500">
                                No data
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-screen bg-gray-50 flex">
            {/* Left Sidebar Navigation */}
            <div className="bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">{user.username}</h2>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-4">
                    <div className="space-y-2">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeSection === item.id
                                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm">{item.label}</span>
                                    {item.id === 'messenger' && (
                                        <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </nav>

            </div>

            <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}