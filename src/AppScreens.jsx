import React, { useState, useEffect } from 'react';
import Board from './Board';
import Dice from './Dice';
import { CustomAlert, HostJoinModal, FriendsModal, ProfileModal, LeaderboardModal, SettingsModal } from './Modals';
import { TURN_ORDER, VOICE_PRESETS, EMOJIS, normalizeTokens } from './constants';

export const LoginScreen = ({ uiState, uiActions, gameActions }) => (
  <div className="login-screen">
    <CustomAlert msg={uiState.alertMsg} onClose={() => uiActions.setAlertMsg(null)} />
    <div className="login-card">
      <div className="ludo-title login-logo"><span className="crown">👑</span><br/>LUDO <span>KING</span></div>
      <p className="login-subtitle">Connect and claim your 1000 🪙 bonus!</p>
      <div className="login-actions">
        <button className="btn-google" onClick={gameActions.loginWithGoogle}><img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="G" /> Sign in with Google</button>
        <button className="btn-guest" onClick={gameActions.loginAsGuest}>👤 Play as Guest</button>
      </div>
    </div>
  </div>
);

export const HomeScreen = ({ uiState, uiActions, gameActions }) => (
  <div className="home-container">
    <CustomAlert msg={uiState.alertMsg} onClose={() => uiActions.setAlertMsg(null)} />
    {uiState.pendingInvite && (
      <div className="invite-popup">
        <p><strong>{uiState.pendingInvite.senderName}</strong> invited you!</p>
        <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
          <button className="btn btn-primary" onClick={gameActions.acceptInvite}>Accept</button>
          <button className="btn btn-leave" onClick={gameActions.declineInvite}>Decline</button>
        </div>
      </div>
    )}
    <div className="floating-bg-item token-float-1"></div>
    <div className="floating-bg-item dice-float-1">🎲</div>
    <div className="floating-bg-item coin-float-1">🪙</div>
    
    <div className="home-header">
      <div className="home-profile" onClick={() => uiActions.setActiveModal('profile')}>
        <img src={uiState.profile?.photoURL || 'https://via.placeholder.com/50'} alt="Profile" />
        <div className="home-profile-info">
          <span className="home-name">{uiState.profile?.country} {uiState.profile?.displayName}</span>
          <div className="level-star">⭐ Level {Math.max(1, Math.floor((uiState.profile?.wins || 0)/2) + 1)}</div>
        </div>
      </div>
      <div className="home-coins-container">
         <div className="home-coins"><span className="coin-icon">🪙</span> <span>{uiState.profile?.coins || 0}</span></div>
         <button className="btn-more-coins" onClick={() => uiActions.setAlertMsg("Daily Reward: +50 Coins coming soon!")}>MORE COINS</button>
      </div>
    </div>

    <div className="home-main-logo"><h1 className="ludo-title animated-title"><span className="crown glow-pulse">👑</span><br/>LUDO <span>KING</span></h1></div>

    <div className="home-actions">
      <button className="btn-huge btn-multiplayer" onClick={() => uiActions.setActiveModal('host')}><span className="btn-icon">🌍</span> ONLINE MULTIPLAYER</button>
      <button className="btn-huge btn-computer" onClick={() => gameActions.createRoom(true)}><span className="btn-icon">📱</span> VS COMPUTER</button>
      <button className="btn-huge btn-leaderboard" onClick={() => { gameActions.fetchLeaderboard(); uiActions.setActiveModal('leaderboard'); }}><span className="btn-icon">🏆</span> RANKINGS</button>
      <button className="btn-huge btn-friends" onClick={() => uiActions.setActiveModal('friends')}><span className="btn-icon">👥</span> FRIENDS</button>
    </div>

    <div className="home-bottom-nav">
      <button className="nav-btn" onClick={() => uiActions.setActiveModal('settings')}>⚙️ Settings</button>
      <button className="nav-btn" onClick={gameActions.handleSignOut}>🚪 Logout</button>
    </div>

    {uiState.activeModal === 'host' && <HostJoinModal playerSelect={uiState.playerSelect} setPlayerSelect={uiActions.setPlayerSelect} createRoom={gameActions.createRoom} joinInput={uiState.joinInput} setJoinInput={uiActions.setJoinInput} joinRoom={gameActions.joinRoom} setActiveModal={uiActions.setActiveModal} />}
    {uiState.activeModal === 'friends' && <FriendsModal profile={uiState.profile} friendCodeInput={uiState.friendCodeInput} setFriendCodeInput={uiActions.setFriendCodeInput} challengeFriend={gameActions.challengeFriend} setActiveModal={uiActions.setActiveModal} setAlertMsg={uiActions.setAlertMsg} />}
    {uiState.activeModal === 'profile' && <ProfileModal profile={uiState.profile} setProfile={uiActions.setProfile} user={uiState.user} linkGoogleAccount={gameActions.linkGoogleAccount} handleImageUpload={gameActions.handleImageUpload} saveProfile={gameActions.saveProfile} setActiveModal={uiActions.setActiveModal} />}
    {uiState.activeModal === 'leaderboard' && <LeaderboardModal leaderboard={uiState.leaderboard} user={uiState.user} profile={uiState.profile} challengeFriend={gameActions.challengeFriend} addFriendDirectly={gameActions.addFriendDirectly} setActiveModal={uiActions.setActiveModal} />}
    {uiState.activeModal === 'settings' && <SettingsModal bgmVolume={uiState.bgmVolume} setBgmVolume={uiActions.setBgmVolume} isMusicMuted={uiState.isMusicMuted} setIsMusicMuted={uiActions.setIsMusicMuted} isSfxMuted={uiState.isSfxMuted} setIsSfxMuted={uiActions.setIsSfxMuted} setActiveModal={uiActions.setActiveModal} />}
  </div>
);

export const LobbyScreen = ({ uiState, uiActions, gameActions }) => {
  const players = uiState.gameState?.players || {};
  return (
    <div className="lobby-container">
      <CustomAlert msg={uiState.alertMsg} onClose={() => uiActions.setAlertMsg(null)} />
      <div className="lobby-card waiting-card">
        <div className="room-header pot-display" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontSize:'28px', padding:'15px', margin:'20px 0'}}>
          <strong>{uiState.roomCode}</strong>
          <button className="btn-copy" onClick={gameActions.copyRoomCode}>📋</button>
        </div>
        <p className="lobby-subtitle">Share this code to invite players!</p>
        {Object.keys(uiState.profile?.friends || {}).length > 0 && (
           <div className="invite-friend-scroll">
             <p style={{fontSize:'12px', color:'#94a3b8', margin:'0 0 5px'}}>Invite a Friend:</p>
             <div style={{display:'flex', gap:'10px', overflowX:'auto'}}>
                {Object.entries(uiState.profile.friends).map(([fid, f]) => (
                   <div key={fid} className="friend-invite-chip" onClick={() => gameActions.inviteFriend(fid)}><img src={f.photoURL} alt="f"/> {f.name.split(" ")[0]}</div>
                ))}
             </div>
           </div>
        )}
        <div className="waiting-players-grid">
          {TURN_ORDER.filter(c => players[c]).map(color => {
            const p = players[color]; const isReady = p.name !== "Waiting...";
            return (
               <div key={color} className={`waiting-slot ${color} ${isReady ? 'ready' : ''}`}>
                  <div className="slot-avatar">{isReady ? '👤' : '⏳'}</div><div className="slot-name">{p.name}</div>
               </div>
            )
          })}
        </div>
        <div className="spinner"></div>
        <p style={{marginTop:'20px', color:'#94a3b8', fontSize: '14px', fontWeight: 'bold'}}>Waiting for challengers...</p>
        <button className="btn btn-leave" style={{marginTop:'25px', width:'100%'}} onClick={gameActions.leaveLobby}>Cancel & Refund</button>
      </div>
    </div>
  );
};

export const GameScreen = ({ uiState, uiActions, gameActions, chatEndRef }) => {
  const { gameState, roomCode, user, isChatOpen, chatMode, chatMsg, bgmVolume, isMusicMuted, isSfxMuted } = uiState;
  const players = gameState?.players || {};
  const activeColors = gameState?.activeColors || ['red'];
  const currentPlayer = gameState?.currentPlayer || 'red';
  const currentRoll = gameState?.currentRoll || 0;
  const consecutiveSixes = gameState?.consecutiveSixes || 0;
  const winner = gameState?.winner || "";
  const isAnimating = gameState?.isAnimating || false;
  const botRolling = gameState?.botRolling || false;
  const chatList = gameState?.chat ? Object.values(gameState.chat) : [];
  const attackingToken = gameState?.attackingToken || null;
  const isMyTurn = players?.[currentPlayer]?.uid === user?.uid;

  const [boardScale, setBoardScale] = useState(1);
  
  useEffect(() => {
    const handleResize = () => {
      const screenW = window.innerWidth;
      if (screenW < 530) {
        setBoardScale(screenW / 530);
      } else {
        setBoardScale(1);
      }
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="game-wrapper">
      <CustomAlert msg={uiState.alertMsg} onClose={() => uiActions.setAlertMsg(null)} />
      <div className="game-container">
        <div className="top-bar" style={{justifyContent: 'flex-end'}}>
          <div className="room-header pot-display">Pot: <strong>{gameState?.pot || 0} 🪙</strong></div>
          <button className="settings-icon-btn" onClick={() => uiActions.setActiveModal('settings')}>⚙️</button>
        </div>

        <div className="board-scaler" style={{ transform: `scale(${boardScale})`, height: `${520 * boardScale}px` }}>
          <Board tokens={normalizeTokens(gameState?.tokens)} onTokenClick={gameActions.handleTokenClick} currentPlayer={currentPlayer} validMoves={isAnimating ? [] : gameActions.getValidMoves(currentRoll, normalizeTokens(gameState?.tokens), currentPlayer)} attackingToken={attackingToken} />
        </div>
        
        <div className="dice-and-chat-controls">
          <Dice currentRoll={currentRoll} onRoll={gameActions.handleRoll} currentPlayer={currentPlayer} currentPlayerName={players?.[currentPlayer]?.name || currentPlayer} isAnimating={isAnimating} isBot={players?.[currentPlayer]?.isBot || false} botRolling={botRolling} consecutiveSixes={consecutiveSixes} isMyTurn={isMyTurn} playRollSound={() => gameActions.playSound('roll')} /> 
          <div className="action-buttons">
            <button className="btn btn-chat-toggle" onClick={() => uiActions.setIsChatOpen(true)}>💬 Live Chat</button>
            <button className="btn btn-leave" onClick={gameActions.handleForfeit}>🏳️ Surrender</button>
          </div>
        </div>

        {winner && (
          <div className="winner-overlay">
            <h1>{players?.[winner]?.name || winner} Takes The Pot!</h1>
            {winner !== "Draw" && <p className="win-pot-text">+{gameState?.pot} 🪙</p>}
            <button className="btn btn-secondary" style={{ fontSize: '20px', padding: '15px 30px' }} onClick={() => {uiActions.setRoomCode(null); uiActions.setIsHost(false);}}>Return to Lobby</button>
          </div>
        )}

        {uiState.activeModal === 'settings' && <SettingsModal bgmVolume={bgmVolume} setBgmVolume={uiActions.setBgmVolume} isMusicMuted={isMusicMuted} setIsMusicMuted={uiActions.setIsMusicMuted} isSfxMuted={isSfxMuted} setIsSfxMuted={uiActions.setIsSfxMuted} setActiveModal={uiActions.setActiveModal} />}

        {isChatOpen && (
          <div className="chat-overlay-backdrop" onClick={(e) => { if(e.target === e.currentTarget) uiActions.setIsChatOpen(false) }}>
            <div className="chat-container">
              <div className="chat-header">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span>Live Chat</span><button className="btn-close-chat" onClick={() => uiActions.setIsChatOpen(false)}>✖</button>
                </div>
                <div className="chat-tabs">
                  <button className={`tab-btn ${chatMode === 'text' ? 'active' : ''}`} onClick={() => uiActions.setChatMode('text')}>💬</button>
                  <button className={`tab-btn ${chatMode === 'voice' ? 'active' : ''}`} onClick={() => uiActions.setChatMode('voice')}>🎤</button>
                  <button className={`tab-btn ${chatMode === 'emoji' ? 'active' : ''}`} onClick={() => uiActions.setChatMode('emoji')}>😀</button>
                </div>
              </div>
              
              <div className="chat-messages">
                {chatList.map((msg, i) => (
                  <div key={i} className={`chat-msg ${msg.sender === uiState.profile?.displayName ? 'self' : ''} ${msg.type === 'emoji' ? 'emoji-msg' : ''}`}>
                    {msg.sender !== uiState.profile?.displayName && <div className="chat-sender">{msg.sender}</div>}
                    {msg.type === 'voice' ? <div className="voice-bubble" onClick={() => gameActions.playChatVoice(msg.audioId)}>🔊 {msg.text}</div> : <div>{msg.text}</div>}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {chatMode === 'text' && (
                <form className="chat-input-area" onSubmit={(e) => gameActions.handleSendChat(e, 'text')}>
                  <input placeholder="Transmit message..." value={chatMsg} onChange={(e) => uiActions.setChatMsg(e.target.value)} /><button type="submit">➜</button>
                </form>
              )}
              {chatMode === 'voice' && (
                <div className="chat-panel voice-panel">
                  {VOICE_PRESETS.map((preset) => <button key={preset.id} className={`voice-preset-btn ${preset.gender === 'm' ? 'male' : 'female'}`} onClick={() => gameActions.handleSendChat(null, 'voice', preset)}>{preset.label}</button>)}
                </div>
              )}
              {chatMode === 'emoji' && (
                <div className="chat-panel emoji-panel">
                  {EMOJIS.map((emoji, index) => <button key={index} className="emoji-preset-btn" onClick={() => gameActions.handleSendChat(null, 'emoji', emoji)}>{emoji}</button>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
