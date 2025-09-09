import { useState, useEffect } from 'react';
import { NavigationBar } from '@/components/NavigationBar';
import { CameraPreview } from '@/components/CameraPreview';
import { CameraControls } from '@/components/CameraControls';
import { SequencePlanner } from '@/components/SequencePlanner';
import { FileLibrary } from '@/components/FileLibrary';
import { TelemetryPanel } from '@/components/TelemetryPanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Server, Shield, Moon, Palette } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('preview');
  const [nightMode, setNightMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSequenceRunning, setIsSequenceRunning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Apply night mode class to document
  useEffect(() => {
    if (nightMode) {
      document.documentElement.classList.add('night');
    } else {
      document.documentElement.classList.remove('night');
    }
  }, [nightMode]);

  const handleStartCapture = () => {
    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 2000); // Simulate capture
  };

  const handleStopCapture = () => {
    setIsSequenceRunning(false);
    setIsRecording(false);
  };

  const SettingsTab = () => (
    <div className="space-y-6">
      {/* Connection Settings */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Network Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">WiFi AP Mode</Label>
              <p className="text-xs text-muted-foreground">Create hotspot for field use</p>
            </div>
            <Switch />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Network Status</Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Connected to "AstroNetwork"
              </Badge>
              <span className="text-sm text-muted-foreground">192.168.1.100</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Camera Settings */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Server className="w-5 h-5" />
          Camera Configuration
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Default File Format</Label>
            <Select defaultValue="jpeg+dng">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG Only</SelectItem>
                <SelectItem value="dng">DNG (RAW) Only</SelectItem>
                <SelectItem value="jpeg+dng">JPEG + DNG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Auto-Save Location</Label>
            <Select defaultValue="sessions">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sessions">Organized Sessions</SelectItem>
                <SelectItem value="dated">Date Folders</SelectItem>
                <SelectItem value="flat">Single Folder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-Generate Thumbnails</Label>
              <p className="text-xs text-muted-foreground">Create previews for RAW files</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Require Authentication</Label>
              <p className="text-xs text-muted-foreground">Password protect camera access</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">HTTPS Only</Label>
              <p className="text-xs text-muted-foreground">Force secure connections</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      {/* Interface Settings */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Interface
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              <div>
                <Label className="text-sm font-medium">Night Mode</Label>
                <p className="text-xs text-muted-foreground">Red theme for dark adaptation</p>
              </div>
            </div>
            <Switch 
              checked={nightMode}
              onCheckedChange={setNightMode}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview Quality</Label>
            <Select defaultValue="medium">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Fast)</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High (Slow)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isRecording={isRecording}
        isSequenceRunning={isSequenceRunning}
        nightMode={nightMode}
        onNightModeToggle={setNightMode}
        onStartCapture={handleStartCapture}
        onStopCapture={handleStopCapture}
      />

      <div className="container mx-auto p-4 max-w-6xl">
        {/* Telemetry Panel - Always Visible */}
        <div className="mb-4">
          <TelemetryPanel />
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {activeTab === 'preview' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <CameraPreview 
                  isRecording={isRecording}
                  isCapturing={isCapturing}
                  nightMode={nightMode}
                />
              </div>
              <div>
                <CameraControls />
              </div>
            </div>
          )}

          {activeTab === 'sequence' && (
            <div className="max-w-4xl mx-auto">
              <SequencePlanner />
            </div>
          )}

          {activeTab === 'library' && (
            <div className="max-w-5xl mx-auto">
              <FileLibrary />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto">
              <SettingsTab />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
