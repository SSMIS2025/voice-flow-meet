import React, { useState, useEffect } from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import TranscriptionDisplay, { TranscriptionEntry } from '@/components/TranscriptionDisplay';
import MeetingStats from '@/components/MeetingStats';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiService, VoiceData } from '@/services/apiService';
import { Download, Upload, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [meetingStartTime, setMeetingStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState('00:00:00');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [meetingId] = useState(() => `meeting_${Date.now()}`);
  const { toast } = useToast();

  // Update duration every second when recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && meetingStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - meetingStartTime.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, meetingStartTime]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection Lost",
        description: "Operating in offline mode. Data will be synced when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRecordingChange = (recording: boolean) => {
    setIsRecording(recording);
    
    if (recording && !meetingStartTime) {
      setMeetingStartTime(new Date());
      toast({
        title: "Meeting Started",
        description: "Voice recording and transcription active",
      });
    } else if (!recording) {
      toast({
        title: "Meeting Ended",
        description: `Meeting duration: ${duration}`,
      });
    }
  };

  const handleTranscription = async (text: string, speaker: string, language: string, timestamp: Date) => {
    const newEntry: TranscriptionEntry = {
      id: `transcription_${Date.now()}_${Math.random()}`,
      text,
      speaker,
      language,
      timestamp,
    };

    setTranscriptions(prev => [...prev, newEntry]);

    // Post to API
    const voiceData: VoiceData = {
      id: newEntry.id,
      text,
      speaker,
      language,
      timestamp,
      meetingId,
    };

    const result = await apiService.postVoiceData(voiceData);
    
    if (!result.success) {
      toast({
        title: "Data Saved Offline",
        description: "Will sync when connection is restored",
        variant: "default",
      });
    }
  };

  const syncOfflineData = async () => {
    const result = await apiService.syncOfflineQueue();
    
    if (result.success && apiService.getOfflineQueueSize() > 0) {
      toast({
        title: "Data Synced",
        description: result.message,
      });
    }
  };

  const exportTranscriptions = () => {
    const dataStr = JSON.stringify(transcriptions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meeting_transcription_${meetingId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Transcription data downloaded",
    });
  };

  const getActiveSpeakers = (): number => {
    const speakers = new Set(transcriptions.map(t => t.speaker));
    return speakers.size;
  };

  const getLanguages = (): string[] => {
    const languages = new Set(transcriptions.map(t => t.language));
    return Array.from(languages);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Voice Meeting</h1>
                  <p className="text-sm text-muted-foreground">Multi-speaker Transcription</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={isOnline ? "default" : "destructive"} className="px-3 py-1">
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTranscriptions}
                  disabled={transcriptions.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={syncOfflineData}
                  disabled={apiService.getOfflineQueueSize() === 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Sync ({apiService.getOfflineQueueSize()})
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Meeting Stats */}
        <MeetingStats
          activeSpeakers={getActiveSpeakers()}
          duration={duration}
          totalTranscriptions={transcriptions.length}
          isOnline={isOnline}
          languages={getLanguages()}
        />

        {/* Voice Recorder and Transcription */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <VoiceRecorder
              onTranscription={handleTranscription}
              isRecording={isRecording}
              onRecordingChange={handleRecordingChange}
            />
            
            {/* Meeting Info */}
            <Card className="p-4 bg-gradient-card border-border">
              <h3 className="text-lg font-semibold text-foreground mb-3">Meeting Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meeting ID:</span>
                  <span className="text-foreground font-mono">{meetingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Endpoint:</span>
                  <span className="text-foreground font-mono text-xs">191.168.12.98/voicedata</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Languages:</span>
                  <span className="text-foreground">Tamil & English</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Speakers:</span>
                  <span className="text-foreground">20 employees</span>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <TranscriptionDisplay transcriptions={transcriptions} />
          </div>
        </div>

        {/* Features Info */}
        <Card className="p-6 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">App Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Multi-Speaker</p>
              <p className="text-xs text-muted-foreground">Up to 20 employees</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Offline Mode</p>
              <p className="text-xs text-muted-foreground">Works without internet</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">🌐</span>
              </div>
              <p className="text-sm font-medium text-foreground">Multi-Language</p>
              <p className="text-xs text-muted-foreground">Tamil & English</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">API Sync</p>
              <p className="text-xs text-muted-foreground">Auto data posting</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Index;
