import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Thermometer, Cpu, HardDrive, Battery, Wifi, Target } from 'lucide-react';

interface TelemetryData {
  sensorTemp: number;
  cpuTemp: number;
  cpuUsage: number;
  storageUsed: number;
  storageTotal: number;
  batteryLevel?: number;
  wifiSignal: number;
  focusMetric: number;
  exposureRemaining?: number;
}

export const TelemetryPanel = () => {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    sensorTemp: 42.5,
    cpuTemp: 65.2,
    cpuUsage: 35,
    storageUsed: 125.6,
    storageTotal: 512,
    batteryLevel: 78,
    wifiSignal: 85,
    focusMetric: 892,
    exposureRemaining: 245
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        sensorTemp: prev.sensorTemp + (Math.random() - 0.5) * 0.5,
        cpuTemp: prev.cpuTemp + (Math.random() - 0.5) * 2,
        cpuUsage: Math.max(10, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        focusMetric: prev.focusMetric + (Math.random() - 0.5) * 50,
        exposureRemaining: prev.exposureRemaining ? Math.max(0, prev.exposureRemaining - 1) : undefined
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTemperatureColor = (temp: number, isCamera = false) => {
    if (isCamera) {
      if (temp > 50) return 'text-destructive';
      if (temp > 40) return 'text-yellow-500';
      return 'text-green-500';
    } else {
      if (temp > 80) return 'text-destructive';
      if (temp > 70) return 'text-yellow-500';
      return 'text-green-500';
    }
  };

  return (
    <Card className="p-3 bg-card border-border">
      <div className="space-y-3">
        {/* System Status Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          {/* Camera Temperature */}
          <div className="flex items-center gap-2">
            <Thermometer className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Sensor:</span>
            <span className={`font-mono ${getTemperatureColor(telemetry.sensorTemp, true)}`}>
              {telemetry.sensorTemp.toFixed(1)}°C
            </span>
          </div>

          {/* CPU Temperature */}
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">CPU:</span>
            <span className={`font-mono ${getTemperatureColor(telemetry.cpuTemp)}`}>
              {telemetry.cpuTemp.toFixed(1)}°C
            </span>
          </div>

          {/* Storage */}
          <div className="flex items-center gap-2">
            <HardDrive className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Storage:</span>
            <span className="font-mono text-foreground">
              {((telemetry.storageUsed / telemetry.storageTotal) * 100).toFixed(0)}%
            </span>
          </div>

          {/* WiFi Signal */}
          <div className="flex items-center gap-2">
            <Wifi className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">WiFi:</span>
            <span className="font-mono text-foreground">
              {telemetry.wifiSignal}%
            </span>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2">
          {/* CPU Usage */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">CPU Usage</span>
              <span className="font-mono">{telemetry.cpuUsage.toFixed(0)}%</span>
            </div>
            <Progress value={telemetry.cpuUsage} className="h-1" />
          </div>

          {/* Storage */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Storage Used</span>
              <span className="font-mono">
                {telemetry.storageUsed.toFixed(1)}GB / {telemetry.storageTotal}GB
              </span>
            </div>
            <Progress 
              value={(telemetry.storageUsed / telemetry.storageTotal) * 100} 
              className="h-1" 
            />
          </div>

          {/* Battery (if available) */}
          {telemetry.batteryLevel && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Battery className="w-3 h-3" />
                  Battery
                </span>
                <span className="font-mono">{telemetry.batteryLevel}%</span>
              </div>
              <Progress value={telemetry.batteryLevel} className="h-1" />
            </div>
          )}
        </div>

        {/* Focus & Exposure Info */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-accent" />
            <span className="text-xs text-muted-foreground">Focus:</span>
            <Badge variant="secondary" className="text-xs font-mono">
              {telemetry.focusMetric.toFixed(0)}
            </Badge>
          </div>

          {telemetry.exposureRemaining && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Exposure:</span>
              <Badge variant="default" className="text-xs font-mono">
                {formatTime(telemetry.exposureRemaining)}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};