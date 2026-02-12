export type VoteValue = "XS" | "S" | "M" | "L";

export type VotingStatus = "idle" | "active" | "closed";

export interface PokerPlanningRoom {
  id: string;
  name?: string;
  owner: string;
  createdAt: Date;
  participants: string[];
  votes: Record<string, VoteValue>;
  votingStatus: VotingStatus;
  votingStartedAt?: Date;
  votingClosedAt?: Date;
  revealed: boolean;
  agreedValue?: VoteValue;
}

export interface CreateRoomInput {
  name?: string;
}

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
  createdAt: Date;
  participants: Participant[];
  votes: Record<string, VoteValue>;
  votingStatus: VotingStatus;
  votingStartedAt?: Date;
  votingClosedAt?: Date;
  votingDuration?: string; // Format: mm:ss
  revealed: boolean;
  agreedValue?: VoteValue;
}
