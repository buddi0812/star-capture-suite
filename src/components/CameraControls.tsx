import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Video, Settings, Timer, Palette, FileImage } from 'lucide-react';

export const CameraControls = () => {
  const [mode, setMode] = useState('M');
  const [shutterSpeed, setShutterSpeed] = useState('1/125');
  const [iso, setISO] = useState(800);
  const [colorTemp, setColorTemp] = useState(5600);
  const [fileFormat, setFileFormat] = useState('jpeg+dng');
  const [driveMode, setDriveMode] = useState('single');

  const shutterSpeeds = [
    '1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125', '1/60', '1/30',
    '1/15', '1/8', '1/4', '1/2', '1"', '2"', '4"', '8"', '15"', '30"', 
    '60"', '120"', '300"', '600"'
  ];

  const isoValues = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];

  return (
    <Card className="p-4 bg-card border-border">
      <Tabs defaultValue="exposure" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="exposure" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Exposure</span>
          </TabsTrigger>
          <TabsTrigger value="color" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Color</span>
          </TabsTrigger>
          <TabsTrigger value="format" className="flex items-center gap-2">
            <FileImage className="w-4 h-4" />
            <span className="hidden sm:inline">Format</span>
          </TabsTrigger>
          <TabsTrigger value="drive" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span className="hidden sm:inline">Drive</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exposure" className="space-y-4 mt-4">
          {/* Shooting Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mode</Label>
            <div className="flex gap-2">
              {['M', 'Bulb', 'AE'].map((m) => (
                <Button
                  key={m}
                  variant={mode === m ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setMode(m)}
                  className="flex-1"
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>

          {/* Shutter Speed */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Shutter Speed</Label>
            <Select value={shutterSpeed} onValueChange={setShutterSpeed}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {shutterSpeeds.map((speed) => (
                  <SelectItem key={speed} value={speed}>
                    {speed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode === 'Bulb' && (
              <Input
                placeholder="Custom time (seconds)"
                className="mt-2"
              />
            )}
          </div>

          {/* ISO */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">ISO</Label>
            <div className="grid grid-cols-4 gap-2">
              {isoValues.map((value) => (
                <Button
                  key={value}
                  variant={iso === value ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setISO(value)}
                  className="text-xs"
                >
                  {value}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Slider
                value={[iso]}
                onValueChange={([value]) => setISO(value)}
                min={100}
                max={25600}
                step={100}
                className="w-full"
              />
              <div className="text-center">
                <Badge variant="secondary">ISO {iso}</Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="color" className="space-y-4 mt-4">
          {/* White Balance */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">White Balance</Label>
            <div className="grid grid-cols-2 gap-2">
              {['AWB', 'Daylight', 'Cloudy', 'Tungsten', 'Fluorescent', 'Manual'].map((wb) => (
                <Button
                  key={wb}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  {wb}
                </Button>
              ))}
            </div>
          </div>

          {/* Color Temperature */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Color Temperature (K)</Label>
            <Slider
              value={[colorTemp]}
              onValueChange={([value]) => setColorTemp(value)}
              min={2500}
              max={10000}
              step={100}
              className="w-full"
            />
            <div className="text-center">
              <Badge variant="secondary">{colorTemp}K</Badge>
            </div>
          </div>

          {/* Picture Profile */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Picture Profile</Label>
            <Select defaultValue="neutral">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="log-flat">LOG-Flat</SelectItem>
                <SelectItem value="vivid">Vivid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="format" className="space-y-4 mt-4">
          {/* File Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">File Format</Label>
            <Select value={fileFormat} onValueChange={setFileFormat}>
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

          {/* Video Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Video Format</Label>
            <Select defaultValue="h264">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h264">H.264</SelectItem>
                <SelectItem value="mjpeg">MJPEG</SelectItem>
                <SelectItem value="yuv420">YUV420</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Resolution</Label>
            <Select defaultValue="full">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">4056×3040 (Full)</SelectItem>
                <SelectItem value="hd">1920×1080 (HD)</SelectItem>
                <SelectItem value="preview">1536×864 (Preview)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="drive" className="space-y-4 mt-4">
          {/* Drive Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Drive Mode</Label>
            <Select value={driveMode} onValueChange={setDriveMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Shot</SelectItem>
                <SelectItem value="burst">Burst</SelectItem>
                <SelectItem value="bracket">Bracketing</SelectItem>
                <SelectItem value="interval">Intervalometer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {driveMode === 'bracket' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Bracket Stops</Label>
              <Select defaultValue="1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.3">±0.3 EV</SelectItem>
                  <SelectItem value="0.7">±0.7 EV</SelectItem>
                  <SelectItem value="1">±1.0 EV</SelectItem>
                  <SelectItem value="2">±2.0 EV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {driveMode === 'interval' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Interval (seconds)</Label>
              <Input type="number" placeholder="30" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};