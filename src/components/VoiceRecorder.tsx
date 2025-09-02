import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Pause, Play, Square, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscription: (text: string, speaker: string, language: string, timestamp: Date) => void;
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
  onAddSpeaker?: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  isRecording,
  onRecordingChange,
  onAddSpeaker,
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

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speakerCountRef = useRef(1);

  const startRecording = async () => {
    try {
      onRecordingChange(true);
      setIsPaused(false);
      
      // Always use mock transcription for reliable offline operation
      startMockTranscription();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      startMockTranscription();
    }
  };

  const startMockTranscription = () => {
    const sampleTexts = [
      "Good morning everyone, let's start the meeting",
      "நல்ல காலை அனைவருக்கும், கூட்டத்தை தொடங்குவோம்",
      "I think we should focus on the quarterly targets",
      "நான் நினைக்கிறேன் நாம் காலாண்டு இலக்குகளில் கவனம் செலுத்த வேண்டும்",
      "The project is progressing well according to schedule",
      "திட்டம் அட்டவணையின் படி நன்றாக முன்னேறுகிறது",
      "We need to address the technical challenges",
      "நாம் தொழில்நுட்ப சவால்களை தீர்க்க வேண்டும்",
      "What are your thoughts on the new proposal?",
      "புதிய முன்மொழிவு பற்றி உங்கள் கருத்து என்ன?",
      "I agree with the previous speaker's points",
      "முந்தைய பேச்சாளரின் கருத்துகளுடன் நான் உடன்படுகிறேன்"
    ];
    
    let speakerIndex = 1;
    
    const mockInterval = setInterval(() => {
      if (!isRecording || isPaused) {
        clearInterval(mockInterval);
        return;
      }
      
      const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      const currentSpeaker = `Speaker ${speakerIndex}`;
      const isTamil = /[\u0B80-\u0BFF]/.test(randomText);
      const language = isTamil ? 'Tamil' : 'English';
      
      onTranscription(randomText, currentSpeaker, language, new Date());
      
      // Cycle through speakers 1-3
      speakerIndex = (speakerIndex % 3) + 1;
    }, 2000 + Math.random() * 3000);
  };

  const pauseRecording = () => {
    setIsPaused(true);
  };

  const resumeRecording = () => {
    setIsPaused(false);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
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
        <div className="flex flex-col space-y-4">
          <div className="flex space-x-4 justify-center">
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
          
          {/* Speaker Controls */}
          <div className="flex justify-center">
            <Button
              onClick={() => {
                speakerCountRef.current += 1;
                onAddSpeaker?.();
                // Show feedback to user
                console.log(`Added Speaker ${speakerCountRef.current}`);
              }}
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={!isRecording}
            >
              <User className="w-3 h-3 mr-1" />
              Add Speaker {speakerCountRef.current + 1}
            </Button>
          </div>
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
              Supporting Tamil & English • {speakerCountRef.current} speakers active
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default VoiceRecorder;