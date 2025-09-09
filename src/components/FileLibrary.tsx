import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Grid3X3, 
  List, 
  Download, 
  Eye, 
  Archive, 
  Search,
  Calendar,
  FileImage,
  Video,
  FileText,
  HardDrive
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'jpeg' | 'dng' | 'h264' | 'mjpeg' | 'tiff' | 'json';
  size: number;
  timestamp: Date;
  session: string;
  metadata?: {
    exposure?: string;
    iso?: number;
    resolution?: string;
    duration?: number;
  };
}

export const FileLibrary = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('date');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock file data
  const mockFiles: FileItem[] = [
    {
      id: '1',
      name: 'M31_001.dng',
      type: 'dng',
      size: 25600000,
      timestamp: new Date('2024-01-15T22:30:00'),
      session: 'M31_20240115',
      metadata: { exposure: '300"', iso: 1600, resolution: '4056×3040' }
    },
    {
      id: '2',
      name: 'M31_001.jpg',
      type: 'jpeg',
      size: 8400000,
      timestamp: new Date('2024-01-15T22:30:00'),
      session: 'M31_20240115',
      metadata: { exposure: '300"', iso: 1600, resolution: '4056×3040' }
    },
    {
      id: '3',
      name: 'preview_001.h264',
      type: 'h264',
      size: 15600000,
      timestamp: new Date('2024-01-15T22:25:00'),
      session: 'M31_20240115',
      metadata: { duration: 30, resolution: '1920×1080' }
    },
    {
      id: '4',
      name: 'dark_001.dng',
      type: 'dng',
      size: 25600000,
      timestamp: new Date('2024-01-15T23:00:00'),
      session: 'M31_20240115',
      metadata: { exposure: '300"', iso: 1600, resolution: '4056×3040' }
    },
    {
      id: '5',
      name: 'session.json',
      type: 'json',
      size: 2048,
      timestamp: new Date('2024-01-15T22:00:00'),
      session: 'M31_20240115'
    }
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'jpeg':
      case 'dng':
      case 'tiff':
        return <FileImage className="w-4 h-4" />;
      case 'h264':
      case 'mjpeg':
        return <Video className="w-4 h-4" />;
      case 'json':
        return <FileText className="w-4 h-4" />;
      default:
        return <HardDrive className="w-4 h-4" />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'dng': return 'border-primary';
      case 'jpeg': return 'border-accent';
      case 'h264': return 'border-secondary';
      case 'tiff': return 'border-muted';
      default: return 'border-border';
    }
  };

  const filteredFiles = mockFiles.filter(file => {
    if (filterType !== 'all') {
      if (filterType === 'image' && !['jpeg', 'dng', 'tiff'].includes(file.type)) return false;
      if (filterType === 'video' && !['h264', 'mjpeg'].includes(file.type)) return false;
      if (filterType === 'raw' && file.type !== 'dng') return false;
    }
    if (searchTerm && !file.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const groupedFiles = filteredFiles.reduce((groups, file) => {
    if (!groups[file.session]) {
      groups[file.session] = [];
    }
    groups[file.session].push(file);
    return groups;
  }, {} as Record<string, FileItem[]>);

  return (
    <Card className="p-4 bg-card border-border">
      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="files">File Browser</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4 mt-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="raw">RAW Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* File Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredFiles.map((file) => (
                <Card key={file.id} className={`p-3 border-2 ${getFileColor(file.type)} hover:bg-muted/50 transition-colors`}>
                  <div className="aspect-square bg-muted/30 rounded-lg mb-2 flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {file.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    
                    {file.metadata && (
                      <div className="text-xs text-muted-foreground">
                        {file.metadata.exposure && `${file.metadata.exposure} `}
                        {file.metadata.iso && `ISO${file.metadata.iso}`}
                        {file.metadata.duration && `${file.metadata.duration}s`}
                      </div>
                    )}
                    
                    <div className="flex gap-1 pt-1">
                      <Button size="sm" variant="secondary" className="flex-1 h-7 text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="secondary" className="h-7 px-2">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 bg-muted rounded">
                    {getFileIcon(file.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{file.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {file.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {file.timestamp.toLocaleDateString()} • {formatFileSize(file.size)}
                      {file.metadata?.exposure && ` • ${file.metadata.exposure}`}
                      {file.metadata?.iso && ` • ISO${file.metadata.iso}`}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4 mt-4">
          {Object.entries(groupedFiles).map(([sessionId, files]) => (
            <Card key={sessionId} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">{sessionId}</h3>
                  <p className="text-sm text-muted-foreground">
                    {files.length} files • {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">
                    <Archive className="w-4 h-4 mr-2" />
                    Download ZIP
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Light Frames:</span>
                  <span className="ml-1 font-mono">
                    {files.filter(f => f.name.includes('M31') && f.type === 'dng').length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Dark Frames:</span>
                  <span className="ml-1 font-mono">
                    {files.filter(f => f.name.includes('dark')).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Videos:</span>
                  <span className="ml-1 font-mono">
                    {files.filter(f => ['h264', 'mjpeg'].includes(f.type)).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Size:</span>
                  <span className="ml-1 font-mono">
                    {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  );
};