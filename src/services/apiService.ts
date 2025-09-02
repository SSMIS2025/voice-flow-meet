export interface VoiceData {
  id: string;
  text: string;
  speaker: string;
  language: string;
  timestamp: Date;
  meetingId: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

class ApiService {
  private baseUrl: string;
  private offlineQueue: VoiceData[] = [];

  constructor() {
    this.baseUrl = 'http://191.168.12.98';
    this.loadOfflineQueue();
  }

  async postVoiceData(voiceData: VoiceData): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/voicedata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voiceData),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: 'Voice data posted successfully',
          data: result,
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error posting voice data:', error);
      
      // Add to offline queue if network error
      this.addToOfflineQueue(voiceData);
      
      return {
        success: false,
        message: `Failed to post voice data: ${error}. Added to offline queue.`,
      };
    }
  }

  async postBatchVoiceData(voiceDataArray: VoiceData[]): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/voicedata/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: voiceDataArray,
          count: voiceDataArray.length,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `Successfully posted ${voiceDataArray.length} voice data entries`,
          data: result,
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error posting batch voice data:', error);
      
      // Add all to offline queue if batch fails
      voiceDataArray.forEach(data => this.addToOfflineQueue(data));
      
      return {
        success: false,
        message: `Failed to post batch voice data: ${error}. Added ${voiceDataArray.length} entries to offline queue.`,
      };
    }
  }

  private addToOfflineQueue(voiceData: VoiceData): void {
    this.offlineQueue.push(voiceData);
    this.saveOfflineQueue();
  }

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('voiceDataOfflineQueue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  private loadOfflineQueue(): void {
    try {
      const saved = localStorage.getItem('voiceDataOfflineQueue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.offlineQueue = [];
    }
  }

  async syncOfflineQueue(): Promise<ApiResponse> {
    if (this.offlineQueue.length === 0) {
      return {
        success: true,
        message: 'No offline data to sync',
      };
    }

    const queueToSync = [...this.offlineQueue];
    
    try {
      const result = await this.postBatchVoiceData(queueToSync);
      
      if (result.success) {
        // Clear the synced data from offline queue
        this.offlineQueue = [];
        this.saveOfflineQueue();
        
        return {
          success: true,
          message: `Successfully synced ${queueToSync.length} offline entries`,
          data: result.data,
        };
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to sync offline queue: ${error}`,
      };
    }
  }

  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }

  clearOfflineQueue(): void {
    this.offlineQueue = [];
    this.saveOfflineQueue();
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      } as RequestInit);
      
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const apiService = new ApiService();