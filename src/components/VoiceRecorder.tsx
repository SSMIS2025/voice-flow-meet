import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Pause, Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscription: (text: string, speaker: string, language: string, timestamp: Date) => void;
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  isRecording,
  onRecordingChange,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isRecording && !isPaused) {
      startAudioLevelDetection();
    } else {
      stopAudioLevelDetection();
    }

    return () => {
      stopAudioLevelDetection();
    };
  }, [isRecording, isPaused]);

  const startAudioLevelDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      microphone.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const updateAudioLevel = () => {
        if (analyser && isRecording && !isPaused) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioLevelDetection = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setAudioLevel(0);
  };

  const startRecording = () => {
    onRecordingChange(true);
    setIsPaused(false);
    
    // Simulate transcription (replace with actual speech recognition)
    const mockTranscription = () => {
      const sampleTexts = [
        "Hello, welcome to the meeting",
        "நல்ல காலை, கூட்டத்திற்கு வரவேற்கிறோம்",
        "Let's discuss the project updates",
        "இந்த திட்டத்தின் முன்னேற்றத்தைப் பற்றி பேசுவோம்"
      ];
      
      const speakers = ["Speaker 1", "Speaker 2", "Speaker 3"];
      const languages = ["English", "Tamil"];
      
      setTimeout(() => {
        if (isRecording && !isPaused) {
          const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
          const randomSpeaker = speakers[Math.floor(Math.random() * speakers.length)];
          const randomLanguage = languages[Math.floor(Math.random() * languages.length)];
          
          onTranscription(randomText, randomSpeaker, randomLanguage, new Date());
          
          if (isRecording && !isPaused) {
            mockTranscription();
          }
        }
      }, 2000 + Math.random() * 3000);
    };
    
    mockTranscription();
  };

  const pauseRecording = () => {
    setIsPaused(true);
  };

  const resumeRecording = () => {
    setIsPaused(false);
  };

  const stopRecording = () => {
    onRecordingChange(false);
    setIsPaused(false);
  };

  return (
    <Card className="p-6 bg-gradient-card border-border">
      <div className="flex flex-col items-center space-y-6">
        {/* Voice Level Visualization */}
        <div className="flex items-center justify-center w-32 h-32 relative">
          <div className={cn(
            "absolute inset-0 rounded-full border-4 transition-all duration-300",
            isRecording && !isPaused
              ? "border-recording animate-pulse-recording shadow-recording"
              : "border-muted"
          )}>
            <div 
              className={cn(
                "absolute inset-2 rounded-full transition-all duration-75",
                isRecording && !isPaused
                  ? "bg-gradient-recording"
                  : "bg-muted"
              )}
              style={{
                transform: `scale(${0.3 + audioLevel * 0.7})`,
                opacity: 0.6 + audioLevel * 0.4
              }}
            />
          </div>
          <div className="relative z-10">
            {isRecording ? (
              isPaused ? (
                <Pause className="w-8 h-8 text-foreground" />
              ) : (
                <Mic className="w-8 h-8 text-recording-foreground" />
              )
            ) : (
              <MicOff className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Audio Level Bars */}
        <div className="flex items-end space-x-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 bg-voice-wave rounded-t transition-all duration-75",
                audioLevel * 5 > i ? "animate-wave-bounce" : "bg-voice-inactive"
              )}
              style={{
                height: `${Math.max(4, (audioLevel * 5 > i ? audioLevel * 32 : 4))}px`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex space-x-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-gradient-primary hover:opacity-90 px-8 py-3 text-lg font-semibold shadow-primary"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <div className="flex space-x-2">
              {isPaused ? (
                <Button
                  onClick={resumeRecording}
                  variant="secondary"
                  className="px-6"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={pauseRecording}
                  variant="secondary"
                  className="px-6"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="px-6"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="text-center">
          <p className={cn(
            "text-sm font-medium",
            isRecording
              ? isPaused
                ? "text-muted-foreground"
                : "text-recording"
              : "text-muted-foreground"
          )}>
            {isRecording
              ? isPaused
                ? "Recording Paused"
                : "Recording Active"
              : "Ready to Record"
            }
          </p>
          {isRecording && (
            <p className="text-xs text-muted-foreground mt-1">
              Supporting Tamil & English • Multi-speaker detection
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default VoiceRecorder;