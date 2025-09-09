import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Focus, BarChart3, Waves } from 'lucide-react';

interface CameraPreviewProps {
  isRecording?: boolean;
  isCapturing?: boolean;
  nightMode?: boolean;
}

export const CameraPreview = ({ isRecording = false, isCapturing = false, nightMode = false }: CameraPreviewProps) => {
  const [showHistogram, setShowHistogram] = useState(true);
  const [showZebras, setShowZebras] = useState(false);
  const [zoom, setZoom] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);

  // Mock histogram data
  const generateHistogramData = () => {
    return Array.from({ length: 256 }, (_, i) => ({
      value: i,
      red: Math.random() * 100,
      green: Math.random() * 100,
      blue: Math.random() * 100,
    }));
  };

  const histogramData = generateHistogramData();

  return (
    <div className="space-y-4">
      {/* Preview Container */}
      <Card className="relative overflow-hidden bg-card border-border">
        <div 
          ref={previewRef}
          className="relative aspect-[4/3] bg-gradient-space flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Mock camera preview - simulate starfield */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black">
            {/* Simulated stars */}
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  opacity: Math.random() * 0.8 + 0.2,
                }}
              />
            ))}
          </div>

          {/* Recording/Capturing Indicators */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary">REC</span>
            </div>
          )}

          {isCapturing && (
            <div className="absolute inset-0 bg-primary/20 animate-pulse" />
          )}

          {/* Zebras overlay */}
          {showZebras && (
            <div className="absolute inset-0 bg-zebra opacity-30 mix-blend-multiply" 
                 style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)' }} />
          )}

          {/* Focus Point Indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 border-2 border-primary rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Preview Controls Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => setShowHistogram(!showHistogram)}
              className={showHistogram ? 'bg-primary text-primary-foreground' : ''}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => setShowZebras(!showZebras)}
              className={showZebras ? 'bg-primary text-primary-foreground' : ''}
            >
              <Waves className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Badge variant="secondary" className="px-3">
              {Math.round(zoom * 100)}%
            </Badge>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              disabled={zoom >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Histogram */}
      {showHistogram && (
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Histogram</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-histogram-red rounded-full" />
                <span className="text-xs text-muted-foreground">R</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-histogram-green rounded-full" />
                <span className="text-xs text-muted-foreground">G</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-histogram-blue rounded-full" />
                <span className="text-xs text-muted-foreground">B</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-24 flex items-end justify-center">
            <svg className="w-full h-full" viewBox="0 0 256 100">
              {/* Red channel */}
              {histogramData.map((point, i) => (
                <rect
                  key={`r-${i}`}
                  x={i}
                  y={100 - point.red}
                  width="1"
                  height={point.red}
                  fill="hsl(var(--histogram-red))"
                  opacity="0.7"
                />
              ))}
              {/* Green channel */}
              {histogramData.map((point, i) => (
                <rect
                  key={`g-${i}`}
                  x={i}
                  y={100 - point.green}
                  width="1"
                  height={point.green}
                  fill="hsl(var(--histogram-green))"
                  opacity="0.7"
                />
              ))}
              {/* Blue channel */}
              {histogramData.map((point, i) => (
                <rect
                  key={`b-${i}`}
                  x={i}
                  y={100 - point.blue}
                  width="1"
                  height={point.blue}
                  fill="hsl(var(--histogram-blue))"
                  opacity="0.7"
                />
              ))}
            </svg>
          </div>
        </Card>
      )}
    </div>
  );
};