import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TranscriptionEntry {
  id: string;
  text: string;
  speaker: string;
  language: string;
  timestamp: Date;
}

interface TranscriptionDisplayProps {
  transcriptions: TranscriptionEntry[];
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcriptions,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

  const getSpeakerColor = (speaker: string): string => {
    const speakerIndex = parseInt(speaker.split(' ')[1]) || 1;
    const colorMap = {
      1: 'speaker-1',
      2: 'speaker-2',
      3: 'speaker-3',
      4: 'speaker-4',
      5: 'speaker-5',
    };
    return colorMap[speakerIndex as keyof typeof colorMap] || 'speaker-1';
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getLanguageFlag = (language: string): string => {
    return language === 'Tamil' ? '🇮🇳' : '🇺🇸';
  };

  return (
    <Card className="flex flex-col h-96 bg-gradient-card border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <User className="w-5 h-5 mr-2" />
          Live Transcription
        </h3>
        <Badge variant="secondary" className="text-xs">
          {transcriptions.length} entries
        </Badge>
      </div>
      
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-background scrollbar-thumb-muted"
      >
        {transcriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Globe className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">
              Start recording to see live transcriptions
              <br />
              <span className="text-sm">Supports Tamil & English</span>
            </p>
          </div>
        ) : (
          transcriptions.map((entry) => (
            <div
              key={entry.id}
              className="group relative bg-card/50 rounded-lg p-4 border border-border/50 hover:border-border transition-colors"
            >
              {/* Speaker and Language Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      `bg-${getSpeakerColor(entry.speaker)}`
                    )}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {entry.speaker}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs">
                    {getLanguageFlag(entry.language)}
                  </span>
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    {entry.language}
                  </Badge>
                </div>
              </div>

              {/* Transcription Text */}
              <p className={cn(
                "text-foreground leading-relaxed mb-3",
                entry.language === 'Tamil' ? 'font-medium' : ''
              )}>
                {entry.text}
              </p>

              {/* Timestamp */}
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(entry.timestamp)}
              </div>

              {/* Hover effect indicator */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default TranscriptionDisplay;