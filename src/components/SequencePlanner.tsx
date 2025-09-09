import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, Clock, Camera, Moon, Sun, Filter } from 'lucide-react';

interface SequenceItem {
  id: string;
  type: 'subs' | 'darks' | 'bias' | 'flats';
  frames: number;
  exposure: string;
  gain: number;
  completed: number;
  status: 'pending' | 'running' | 'completed' | 'paused';
}

export const SequencePlanner = () => {
  const [sequences, setSequences] = useState<SequenceItem[]>([
    {
      id: '1',
      type: 'subs',
      frames: 30,
      exposure: '300"',
      gain: 1600,
      completed: 12,
      status: 'running'
    },
    {
      id: '2',
      type: 'darks',
      frames: 10,
      exposure: '300"',
      gain: 1600,
      completed: 0,
      status: 'pending'
    }
  ]);

  const [newSequence, setNewSequence] = useState({
    type: 'subs' as const,
    frames: 30,
    exposure: '300"',
    gain: 1600,
    interval: 5
  });

  const getSequenceIcon = (type: string) => {
    switch (type) {
      case 'subs': return <Camera className="w-4 h-4" />;
      case 'darks': return <Moon className="w-4 h-4" />;
      case 'bias': return <Sun className="w-4 h-4" />;
      case 'flats': return <Filter className="w-4 h-4" />;
      default: return <Camera className="w-4 h-4" />;
    }
  };

  const getSequenceColor = (type: string) => {
    switch (type) {
      case 'subs': return 'bg-primary';
      case 'darks': return 'bg-secondary';
      case 'bias': return 'bg-accent';
      case 'flats': return 'bg-muted';
      default: return 'bg-primary';
    }
  };

  const addSequence = () => {
    const sequence: SequenceItem = {
      id: Date.now().toString(),
      ...newSequence,
      completed: 0,
      status: 'pending'
    };
    setSequences([...sequences, sequence]);
  };

  const totalDuration = sequences.reduce((total, seq) => {
    const exposureSeconds = parseInt(seq.exposure.replace('"', '')) || 0;
    return total + (seq.frames * exposureSeconds);
  }, 0);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="p-4 bg-card border-border">
      <Tabs defaultValue="planner" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="planner">Sequence Planner</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="space-y-4 mt-4">
          {/* Add New Sequence */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium text-foreground">Add Sequence</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <Select 
                  value={newSequence.type} 
                  onValueChange={(value: any) => setNewSequence({...newSequence, type: value})}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subs">Light Frames</SelectItem>
                    <SelectItem value="darks">Dark Frames</SelectItem>
                    <SelectItem value="bias">Bias Frames</SelectItem>
                    <SelectItem value="flats">Flat Frames</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Frames</Label>
                <Input 
                  type="number" 
                  value={newSequence.frames}
                  onChange={(e) => setNewSequence({...newSequence, frames: parseInt(e.target.value)})}
                  className="h-8"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Exposure</Label>
                <Select 
                  value={newSequence.exposure}
                  onValueChange={(value) => setNewSequence({...newSequence, exposure: value})}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30"</SelectItem>
                    <SelectItem value="60">60"</SelectItem>
                    <SelectItem value="120">120"</SelectItem>
                    <SelectItem value="300">300"</SelectItem>
                    <SelectItem value="600">600"</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">ISO/Gain</Label>
                <Input 
                  type="number" 
                  value={newSequence.gain}
                  onChange={(e) => setNewSequence({...newSequence, gain: parseInt(e.target.value)})}
                  className="h-8"
                />
              </div>
            </div>

            <Button onClick={addSequence} className="w-full" size="sm">
              Add to Sequence
            </Button>
          </div>

          {/* Sequence List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Planned Sequences</h3>
              <Badge variant="secondary">
                Total: {formatDuration(totalDuration)}
              </Badge>
            </div>

            <div className="space-y-2">
              {sequences.map((seq) => (
                <div key={seq.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className={`p-2 rounded ${getSequenceColor(seq.type)}`}>
                    {getSequenceIcon(seq.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{seq.type}</span>
                      <Badge variant="outline" className="text-xs">
                        {seq.frames} × {seq.exposure}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ISO {seq.gain}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {seq.completed} of {seq.frames} completed
                    </div>
                  </div>

                  <Badge variant={seq.status === 'running' ? 'default' : 'secondary'}>
                    {seq.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Sequence Controls */}
          <div className="flex gap-2">
            <Button className="flex-1" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Start Sequence
            </Button>
            <Button variant="secondary" size="sm">
              <Pause className="w-4 h-4" />
            </Button>
            <Button variant="destructive" size="sm">
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4 mt-4">
          {/* Current Progress */}
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Light Frames - Frame 13 of 30</h3>
              <div className="text-sm text-muted-foreground">300" exposure • ISO 1600</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Frame Progress</span>
                <span>4:32 remaining</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sequence Progress</span>
                <span>43% complete</span>
              </div>
              <Progress value={43} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">2h 15m</div>
                <div className="text-xs text-muted-foreground">Elapsed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">2h 58m</div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </div>
            </div>
          </div>

          {/* Session Stats */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Session Statistics</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">12</div>
                <div className="text-xs text-muted-foreground">Lights</div>
              </div>
              <div>
                <div className="text-lg font-bold">0</div>
                <div className="text-xs text-muted-foreground">Darks</div>
              </div>
              <div>
                <div className="text-lg font-bold">2.1GB</div>
                <div className="text-xs text-muted-foreground">Captured</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};