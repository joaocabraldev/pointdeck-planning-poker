const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type VoteValue = "XS" | "S" | "M" | "L";
export type VotingStatus = "idle" | "active" | "closed";

export interface Participant {
  id: string;
  name: string;
}

export interface RoomResponse {
  room_id: string;
  name?: string;
  created_by: {
    id: string;
    name: string;
  };
  createdAt: string;
  participants: Participant[];
  votes: Record<string, VoteValue>;
  votingStatus: VotingStatus;
  votingStartedAt?: string;
  votingClosedAt?: string;
  votingDuration?: string;
  revealed: boolean;
  agreedValue?: VoteValue;
}

export interface SessionResponse {
  user: {
    id: string;
    name: string;
  };
  token: string;
}

export interface CreateRoomResponse {
  room_id: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
  }

  private async request(method: string, path: string, body?: unknown) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    // Some endpoints return no content
    const contentLength = response.headers.get('content-length');
    if (response.status === 200 && (contentLength === '0' || contentLength === null)) {
      return null;
    }

    return response.json();
  }

  // Auth
  async createSession(name: string): Promise<SessionResponse> {
    const data = await this.request('POST', '/session', { name });
    this.setToken(data.token);
    return data;
  }

  // Rooms
  async createRoom(name?: string): Promise<CreateRoomResponse> {
    return this.request('POST', '/rooms', name ? { name } : {});
  }

  async getRoom(roomId: string): Promise<RoomResponse> {
    return this.request('GET', `/rooms/${roomId}`);
  }

  async joinRoom(roomId: string): Promise<void> {
    return this.request('POST', `/rooms/${roomId}/join`);
  }

  async removeParticipant(roomId: string, participantId: string): Promise<void> {
    return this.request('DELETE', `/rooms/${roomId}/participants/${participantId}`);
  }

  // Voting
  async startVoting(roomId: string): Promise<void> {
    return this.request('POST', `/rooms/${roomId}/voting/start`);
  }

  async submitVote(roomId: string, vote: VoteValue): Promise<void> {
    return this.request('POST', `/rooms/${roomId}/votes`, { vote });
  }

  async cancelVote(roomId: string): Promise<void> {
    return this.request('DELETE', `/rooms/${roomId}/votes`);
  }

  async closeVoting(roomId: string): Promise<void> {
    return this.request('POST', `/rooms/${roomId}/voting/close`);
  }

  async resetVoting(roomId: string): Promise<void> {
    return this.request('POST', `/rooms/${roomId}/voting/reset`);
  }

  async setAgreedValue(roomId: string, value: VoteValue): Promise<void> {
    return this.request('POST', `/rooms/${roomId}/agreed-value`, { value });
  }
}

export const apiClient = new ApiClient();

