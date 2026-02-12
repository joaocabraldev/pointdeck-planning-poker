import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useSessionStore } from "../../store/sessionStore";
import { apiClient } from "../../api/client";
import type { RoomResponse, VoteValue } from "../../api/client";
import { socketManager } from "../../api/socket";

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
  const hasVoted = !!myVote;
  const allVotes = room ? Object.values(room.votes).length : 0;
  const totalParticipants = room?.participants.length || 0;

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
      await apiClient.submitVote(roomId, vote);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      setError(errorMessage);
    }
  };

  const handleCancelVote = async () => {
    if (!roomId) return;
    try {
      await apiClient.cancelVote(roomId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel vote';
      setError(errorMessage);
    }
  };

  const handleStartVoting = async () => {
    if (!roomId) return;
    try {
      await apiClient.startVoting(roomId);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start voting';
      setError(errorMessage);
    }
  };

  const handleCloseVoting = async () => {
    if (!roomId) return;
    try {
      await apiClient.closeVoting(roomId);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close voting';
      setError(errorMessage);
    }
  };

  const handleResetVoting = async () => {
    if (!roomId) return;
    try {
      await apiClient.resetVoting(roomId);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset voting';
      setError(errorMessage);
    }
  };

  const handleSetAgreedValue = async (value: VoteValue) => {
    if (!roomId) return;
    try {
      await apiClient.setAgreedValue(roomId, value);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set agreed value';
      setError(errorMessage);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!roomId) return;
    try {
      await apiClient.removeParticipant(roomId, participantId);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove participant';
      setError(errorMessage);
    }
  };

  const handleShareRoom = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShareMessage('Room link copied to clipboard!');
      setTimeout(() => setShareMessage(null), 3000);
    }).catch(() => {
      setShareMessage('Failed to copy link');
      setTimeout(() => setShareMessage(null), 3000);
    });
  };

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Loading room...</div>;
  }

  if (error && !room) {
    return (
      <div style={{ padding: '2rem' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  if (!room) return null;

  const voteOptions: VoteValue[] = ['XS', 'S', 'M', 'L'];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>{room.name || 'Poker Planning Room'}</h1>
          <p style={{ color: '#666' }}>
            Created by {room.created_by.name} • Room ID: {room.room_id.slice(0, 8)}...
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleShareRoom}>📋 Share Room</button>
          <button onClick={() => navigate('/')}>🏠 Home</button>
        </div>
      </div>

      {shareMessage && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {shareMessage}
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h2>Voting Status: {room.votingStatus.toUpperCase()}</h2>
            {room.votingStatus === 'active' && (
              <p>
                Votes: {allVotes}/{totalParticipants}
                {room.votingDuration && ` • Duration: ${room.votingDuration}`}
              </p>
            )}
            {room.votingStatus === 'closed' && room.agreedValue && (
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                Agreed Value: {room.agreedValue}
              </p>
            )}
          </div>

          {isOwner && (
            <div style={{ marginBottom: '2rem' }}>
              <h3>Owner Controls</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {room.votingStatus === 'idle' && (
                  <button onClick={handleStartVoting}>▶️ Start Voting</button>
                )}
                {room.votingStatus === 'active' && (
                  <button onClick={handleCloseVoting}>⏹️ Close Voting</button>
                )}
                {room.votingStatus === 'closed' && (
                  <button onClick={handleResetVoting}>🔄 Reset Voting</button>
                )}
              </div>
            </div>
          )}

          {room.votingStatus === 'active' && (
            <div>
              <h3>Cast Your Vote</h3>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                {voteOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleVote(option)}
                    style={{
                      padding: '2rem',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      backgroundColor: myVote === option ? '#007bff' : '#fff',
                      color: myVote === option ? '#fff' : '#000',
                      border: '2px solid #007bff',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      minWidth: '80px'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {hasVoted && (
                <button onClick={handleCancelVote} style={{ color: '#dc3545' }}>
                  ❌ Cancel My Vote
                </button>
              )}
            </div>
          )}

          {room.votingStatus === 'closed' && room.revealed && (
            <div>
              <h3>Voting Results</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                {Object.entries(room.votes).map(([userId, vote]) => {
                  const participant = room.participants.find(p => p.id === userId);
                  return (
                    <div
                      key={userId}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#e9ecef',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{participant?.name}</div>
                      <div style={{ fontSize: '2rem', color: '#007bff' }}>{vote}</div>
                    </div>
                  );
                })}
              </div>

              {isOwner && !room.agreedValue && (
                <div>
                  <h4>Set Agreed Value</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {voteOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleSetAgreedValue(option)}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <h3>Participants ({totalParticipants})</h3>
            <div style={{ marginTop: '1rem' }}>
              {room.participants.map((participant) => {
                const hasVotedCheck = !!room.votes[participant.id];
                const isMe = participant.id === session?.user.id;
                const isRoomOwner = participant.id === room.created_by.id;

                return (
                  <div
                    key={participant.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      backgroundColor: isMe ? '#e7f3ff' : '#fff',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: isMe ? 'bold' : 'normal' }}>
                        {participant.name}
                        {isMe && ' (You)'}
                        {isRoomOwner && ' 👑'}
                      </div>
                      {room.votingStatus === 'active' && hasVotedCheck && (
                        <span style={{ fontSize: '0.9rem', color: '#28a745' }}>✓ Voted</span>
                      )}
                    </div>
                    {isOwner && !isRoomOwner && (
                      <button
                        onClick={() => handleRemoveParticipant(participant.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.8rem',
                          color: '#dc3545'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room;

