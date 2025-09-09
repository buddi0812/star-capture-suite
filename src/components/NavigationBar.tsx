import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Camera, 
  Video, 
  FolderOpen, 
  Settings, 
  Play, 
  Square, 
  Moon,
  Wifi,
  Timer
} from 'lucide-react';

interface NavigationBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isRecording: boolean;
  isSequenceRunning: boolean;
  nightMode: boolean;
  onNightModeToggle: (enabled: boolean) => void;
  onStartCapture: () => void;
  onStopCapture: () => void;
}

export const NavigationBar = ({
  activeTab,
  onTabChange,
  isRecording,
  isSequenceRunning,
  nightMode,
  onNightModeToggle,
  onStartCapture,
  onStopCapture
}: NavigationBarProps) => {
  const tabs = [
    { id: 'preview', label: 'Preview', icon: Camera },
    { id: 'sequence', label: 'Sequence', icon: Timer },
    { id: 'library', label: 'Library', icon: FolderOpen },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="p-4">
        {/* Header with Title and Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Camera className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AstroPi Camera</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Connected</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Night Mode Toggle */}
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-muted-foreground" />
              <Switch
                checked={nightMode}
                onCheckedChange={onNightModeToggle}
                className="data-[state=checked]:bg-night-red"
              />
            </div>

            {/* Connection Status */}
            <Badge variant="secondary" className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              <span className="hidden sm:inline">WiFi</span>
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'secondary'}
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className="flex-1 flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2">
          {!isSequenceRunning ? (
            <>
              <Button 
                onClick={onStartCapture}
                className="flex-1 bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
              
              <Button 
                variant="secondary"
                size="sm"
                className="px-4"
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Record
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={onStopCapture}
                variant="destructive"
                className="flex-1"
                size="sm"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Sequence
              </Button>
              
              <Badge variant="default" className="px-3 py-2">
                <Play className="w-3 h-3 mr-1" />
                Running
              </Badge>
            </>
          )}
        </div>
      </div>
    </div>
  );
};