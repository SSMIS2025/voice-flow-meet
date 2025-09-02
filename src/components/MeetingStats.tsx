import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Languages, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MeetingStatsProps {
  activeSpeakers: number;
  duration: string;
  totalTranscriptions: number;
  isOnline: boolean;
  languages: string[];
}

const MeetingStats: React.FC<MeetingStatsProps> = ({
  activeSpeakers,
  duration,
  totalTranscriptions,
  isOnline,
  languages,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Active Speakers */}
      <Card className="p-4 bg-gradient-card border-border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{activeSpeakers}</p>
            <p className="text-xs text-muted-foreground">Active Speakers</p>
          </div>
        </div>
      </Card>

      {/* Duration */}
      <Card className="p-4 bg-gradient-card border-border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{duration}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
        </div>
      </Card>

      {/* Languages */}
      <Card className="p-4 bg-gradient-card border-border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Languages className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex space-x-1 mb-1">
              {languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="text-xs px-1 py-0">
                  {lang === 'Tamil' ? 'TA' : 'EN'}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Languages</p>
          </div>
        </div>
      </Card>

      {/* Connection Status */}
      <Card className="p-4 bg-gradient-card border-border">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-lg",
            isOnline ? "bg-primary/10" : "bg-destructive/10"
          )}>
            {isOnline ? (
              <Wifi className="w-5 h-5 text-primary" />
            ) : (
              <WifiOff className="w-5 h-5 text-destructive" />
            )}
          </div>
          <div>
            <p className={cn(
              "text-sm font-medium",
              isOnline ? "text-primary" : "text-destructive"
            )}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalTranscriptions} saved
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MeetingStats;