import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseUrl } from '@/constant';
import axios from '@/context/NetworkServices';

interface GroupSettings {
  groupinfo: number;
  editmembers: number;
  mention: number;
  pin: number;
  cliptop: number;
  approroval: boolean;
}

interface MemberPermissionProps {
  groupId: string;
  onClose: () => void;
  initialSettings?: GroupSettings;
  onSettingsUpdate?: (settings: GroupSettings) => void;
}

const PERMISSION_OPTIONS = [
  { value: 0, label: 'Everyone in this group' },
  { value: 1, label: 'Group administrators' },
  { value: 2, label: 'Only group creator' }
];

// Default settings - can be customized based on requirements
const DEFAULT_SETTINGS: GroupSettings = {
  groupinfo: 0,
  editmembers: 1,
  mention: 0,
  pin: 2,
  cliptop: 1,
  approroval: false
};

export function MemberPermission({ 
  groupId, 
  onClose, 
  initialSettings,
  onSettingsUpdate 
}: MemberPermissionProps) {
  const [settings, setSettings] = useState<GroupSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);

  // Fetch current group settings when component mounts
  useEffect(() => {
    const fetchGroupSettings = async () => {
      try {
        setFetchingSettings(true);
        const response = await axios.get(
          `${BaseUrl}/api/group/setting/${groupId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        if (response.data) {
          setSettings(response.data);
        }
      } catch (error: any) {
        console.error('Failed to fetch group settings:', error?.response?.data?.message || error.message);
        // If fetching fails, use initialSettings or default settings
        if (initialSettings) {
          setSettings(initialSettings);
        }
      } finally {
        setFetchingSettings(false);
      }
    };

    // Priority: 1) Fetch from server 2) Use initialSettings 3) Use defaults
    if (groupId) {
      fetchGroupSettings();
    } else if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [groupId, initialSettings]);

  // Update settings when initialSettings prop changes
  useEffect(() => {
    if (initialSettings && !fetchingSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings, fetchingSettings]);

  const handlePermissionChange = (key: keyof GroupSettings, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${BaseUrl}/api/group/setting/${groupId}`,
        settings,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (onSettingsUpdate) {
        onSettingsUpdate(settings);
      }
      onClose();
    } catch (error: any) {
      console.error(
        'Failed to update settings:',
        error?.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const getSelectedLabel = (value: number) => {
    const option = PERMISSION_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : 'Select option';
  };

  const DropdownSelect = ({ 
    label, 
    value, 
    onChange, 
    dropdownKey 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void;
    dropdownKey: string;
  }) => (
    <div className="mb-6">
      <h3 className="font-medium text-gray-900 mb-3">{label}</h3>
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey)}
          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={fetchingSettings}
        >
          <span className="text-gray-900">
            {fetchingSettings ? 'Loading...' : getSelectedLabel(value)}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        
        {openDropdown === dropdownKey && !fetchingSettings && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {PERMISSION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpenDropdown(null);
                }}
                className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                  value === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Show loading state while fetching settings
  if (fetchingSettings) {
    return (
      <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Group Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading group settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Group Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Member permission management</h2>
          
          {/* Group administrators */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Group administrators</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">1/10</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">SR</span>
              </div>
              <button className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
              <button className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Minus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Permission Dropdowns */}
          <DropdownSelect
            label="Who can edit group info"
            value={settings.groupinfo}
            onChange={(value) => handlePermissionChange('groupinfo', value)}
            dropdownKey="groupinfo"
          />

          <DropdownSelect
            label="Who can add members or share group"
            value={settings.editmembers}
            onChange={(value) => handlePermissionChange('editmembers', value)}
            dropdownKey="editmembers"
          />

          <DropdownSelect
            label="Who can start video calls"
            value={settings.mention}
            onChange={(value) => handlePermissionChange('mention', value)}
            dropdownKey="mention"
          />

          <DropdownSelect
            label="Who can @mention all"
            value={settings.pin}
            onChange={(value) => handlePermissionChange('pin', value)}
            dropdownKey="pin"
          />

          {/* <DropdownSelect
            label="Who can buzz others"
            value={settings.cliptop}
            onChange={(value) => handlePermissionChange('cliptop', value)}
            dropdownKey="cliptop"
          /> */}

          <DropdownSelect
            label="Who can pin messages"
            value={settings.cliptop}
            onChange={(value) => handlePermissionChange('cliptop', value)}
            dropdownKey="pin-messages"
          />

          {/* <DropdownSelect
            label="Who can clip messages and announcements to top"
            value={settings.cliptop}
            onChange={(value) => handlePermissionChange('cliptop', value)}
            dropdownKey="clip-messages"
          /> */}

          {/* <DropdownSelect
            label="Who can manage tabs, widgets and menus"
            value={settings.groupinfo}
            onChange={(value) => handlePermissionChange('groupinfo', value)}
            dropdownKey="manage-tabs"
          /> */}

          {/* Posting permission settings */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Posting permission settings</h3>
            <DropdownSelect
              label=""
              value={settings.groupinfo}
              onChange={(value) => handlePermissionChange('groupinfo', value)}
              dropdownKey="posting-permissions"
            />
          </div>

          {/* Approval Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Require approval for new members</h3>
                <p className="text-sm text-gray-500">New members must be approved by administrators</p>
              </div>
              <button
                onClick={() => handlePermissionChange('approroval', !settings.approroval)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.approroval ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.approroval ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}