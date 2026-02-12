import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useSessionStore } from "../../store/sessionStore";
import { apiClient } from "../../api/client";
import type { RoomResponse, VoteValue } from "../../api/client";
import { socketManager } from "../../api/socket";

const AVATAR_COLORS = ['#4f6ef7', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ── Card back pattern (SVG inline) ── */
function CardBack() {
  return (
    <div style={{
      width: '3.5rem',
      height: '5rem',
      borderRadius: 'var(--radius-md)',
      border: '2px dashed #d4a0b9',
      background: 'linear-gradient(135deg, #f0c4d8 25%, #e8b0cc 25%, #e8b0cc 50%, #f0c4d8 50%, #f0c4d8 75%, #e8b0cc 75%)',
      backgroundSize: '8px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }} />
  );
}

function CardEmpty() {
  return (
    <div style={{
      width: '3.5rem',
      height: '5rem',
      borderRadius: 'var(--radius-md)',
      background: '#e5e7eb',
      border: '2px solid #d1d5db',
    }} />
  );
}

function CardRevealed({ value }: { value: string }) {
  return (
    <div style={{
      width: '3.5rem',
      height: '5rem',
      borderRadius: 'var(--radius-md)',
      background: 'white',
      border: '2px solid var(--accent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '1.25rem',
      color: 'var(--accent)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {value}
    </div>
  );
}

/* ── Vote option card ── */
function VoteCard({ value, selected, onClick }: { value: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '3.5rem',
        height: '5rem',
        borderRadius: 'var(--radius-md)',
        border: selected ? '2.5px solid var(--accent)' : '1.5px solid var(--border)',
        background: selected ? 'var(--accent)' : 'white',
        color: selected ? 'white' : 'var(--text-primary)',
        fontWeight: 700,
        fontSize: '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: selected ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: selected ? '0 8px 20px rgba(79, 110, 247, 0.3)' : 'var(--shadow-sm)',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {value}
    </button>
  );
}

function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.session);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const isOwner = session?.user.id === room?.created_by.id;
  const myVote = room?.votes[session?.user.id || ''];
  const allVotes = room ? Object.keys(room.votes).length : 0;
  const totalParticipants = room?.participants.length || 0;
  const userName = session?.user.name || '';
  const initial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!roomId || !session?.token) return;

    const loadRoom = async () => {
      try {
        setIsLoading(true);
        await apiClient.joinRoom(roomId);
        const roomData = await apiClient.getRoom(roomId);
        setRoom(roomData);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load room';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoom();

    socketManager.connect(session.token);
    socketManager.subscribeToRoom(roomId);

    const handleRoomUpdate = (updatedRoom: RoomResponse) => {
      setRoom(updatedRoom);
    };

    socketManager.onRoomUpdate(handleRoomUpdate);

    return () => {
      socketManager.offRoomUpdate(handleRoomUpdate);
      socketManager.unsubscribeFromRoom(roomId);
    };
  }, [roomId, session?.token]);

  const handleVote = async (vote: VoteValue) => {
    if (!roomId) return;
    try {
      if (myVote === vote) {
        await apiClient.cancelVote(roomId);
      } else {
        await apiClient.submitVote(roomId, vote);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    }
  };

  const handleStartVoting = async () => {
    if (!roomId) return;
    try {
      await apiClient.startVoting(roomId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start voting');
    }
  };

  const handleCloseVoting = async () => {
    if (!roomId) return;
    try {
      await apiClient.closeVoting(roomId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close voting');
    }
  };

  const handleResetVoting = async () => {
    if (!roomId) return;
    try {
      await apiClient.resetVoting(roomId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset voting');
    }
  };

  const handleSetAgreedValue = async (value: VoteValue) => {
    if (!roomId) return;
    try {
      await apiClient.setAgreedValue(roomId, value);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set agreed value');
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!roomId) return;
    try {
      await apiClient.removeParticipant(roomId, participantId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove participant');
    }
  };

  const handleShareRoom = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShareMessage('Room link copied!');
      setTimeout(() => setShareMessage(null), 3000);
    }).catch(() => {
      setShareMessage('Failed to copy link');
      setTimeout(() => setShareMessage(null), 3000);
    });
  };

  /* ── Loading / Error ── */
  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="room-card" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading room...</p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="app-shell">
        <div className="page-card" style={{ textAlign: 'center' }}>
          <p className="toast toast-error" style={{ marginBottom: '1rem' }}>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const voteOptions: VoteValue[] = ['XS', 'S', 'M', 'L'];

  return (
    <div className="app-shell">
      <div className="room-card">

        {/* ── Top Bar ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-light)',
        }}>
          {/* Left: room name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent)', fontSize: '1.25rem' }}>&#9830;</span>
            <h2 style={{ margin: 0 }}>{room.name || 'Planning Room'}</h2>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Owner controls in top bar */}
            {isOwner && room.votingStatus === 'idle' && (
              <button className="btn-outline" onClick={handleStartVoting}>Start Voting</button>
            )}
            {isOwner && room.votingStatus === 'closed' && (
              <button className="btn-outline" onClick={handleResetVoting}>New Round</button>
            )}

            <button className="btn-outline" onClick={handleShareRoom}>+ Invite Players</button>
            <button className="btn-ghost" onClick={() => navigate('/')}>Home</button>

            {/* User avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <div
                className="avatar"
                style={{ background: getAvatarColor(userName) }}
              >
                {initial}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{userName}</span>
            </div>
          </div>
        </div>

        {/* ── Toasts ── */}
        {(shareMessage || error) && (
          <div style={{ padding: '0.75rem 1.5rem 0' }}>
            {shareMessage && <p className="toast toast-success">{shareMessage}</p>}
            {error && <p className="toast toast-error">{error}</p>}
          </div>
        )}

        {/* ── Table Area ── */}
        <div style={{
          flex: 1,
          background: 'var(--bg-table)',
          margin: '1rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          gap: '1.5rem',
          minHeight: '350px',
        }}>

          {/* Vote counter */}
          {room.votingStatus === 'active' && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {allVotes} of {totalParticipants} voted
            </p>
          )}

          {/* Agreed value banner */}
          {room.votingStatus === 'closed' && room.agreedValue && (
            <div style={{
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}>
              Agreed: {room.agreedValue}
            </div>
          )}

          {/* Participants around the table */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '2rem',
          }}>
            {room.participants.map((participant) => {
              const hasVotedP = !!room.votes[participant.id];
              const isMe = participant.id === session?.user.id;
              const isRoomOwner = participant.id === room.created_by.id;
              const pInitial = participant.name.charAt(0).toUpperCase();
              const revealedVote = room.revealed ? room.votes[participant.id] : null;

              return (
                <div key={participant.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  position: 'relative',
                }}>
                  {/* Card */}
                  {revealedVote ? (
                    <CardRevealed value={revealedVote} />
                  ) : hasVotedP ? (
                    <CardBack />
                  ) : (
                    <CardEmpty />
                  )}

                  {/* Avatar + name */}
                  <div
                    className="avatar"
                    style={{
                      background: getAvatarColor(participant.name),
                      border: isMe ? '2px solid var(--accent)' : '2px solid white',
                      width: '1.75rem',
                      height: '1.75rem',
                      fontSize: '0.7rem',
                    }}
                  >
                    {pInitial}
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: isMe ? 600 : 400,
                    color: 'var(--text-primary)',
                    maxWidth: '5rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}>
                    {participant.name}
                    {isRoomOwner && ' \u{1F451}'}
                  </span>

                  {/* Remove button for owner */}
                  {isOwner && !isRoomOwner && (
                    <button
                      className="btn-danger"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Central action button */}
          {isOwner && room.votingStatus === 'active' && (
            <button className="btn-primary" onClick={handleCloseVoting}
              style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
            >
              Reveal Cards
            </button>
          )}

          {/* Set agreed value (owner, after reveal) */}
          {isOwner && room.votingStatus === 'closed' && room.revealed && !room.agreedValue && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Set agreed value:</span>
              {voteOptions.map((option) => (
                <button
                  key={option}
                  className="btn-outline"
                  onClick={() => handleSetAgreedValue(option)}
                  style={{ padding: '0.375rem 0.75rem', fontWeight: 600 }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom Card Picker ── */}
        {room.votingStatus === 'active' && (
          <div style={{
            padding: '1rem 1.5rem 1.25rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '0.75rem',
          }}>
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              marginRight: '0.5rem',
              paddingBottom: '1.5rem',
            }}>
              Pick your card
            </span>
            {voteOptions.map((option) => (
              <VoteCard
                key={option}
                value={option}
                selected={myVote === option}
                onClick={() => handleVote(option)}
              />
            ))}
          </div>
        )}

        {/* Idle state prompt */}
        {room.votingStatus === 'idle' && !isOwner && (
          <div style={{
            padding: '1.25rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}>
            Waiting for the host to start voting...
          </div>
        )}

      </div>
    </div>
  );
}

export default Room;
