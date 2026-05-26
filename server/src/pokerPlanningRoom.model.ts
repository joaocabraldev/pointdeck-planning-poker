export const VOTE_VALUES: readonly string[] = (
  process.env.VOTE_VALUES ?? 'XS,S,M,L'
)
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

export const VOTING_STATUSES: readonly string[] = (
  process.env.VOTING_STATUSES ?? 'idle,active,closed'
)
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

export type VoteValue = string;

export type VotingStatus = string;

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
