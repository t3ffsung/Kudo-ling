import React from 'react';
import { COUNTRIES, AVATARS, BET_AMOUNT } from './constants';

export const CustomAlert = ({ msg, onClose }) => {
  if (!msg) return null;
  return (
    <div className="modal-overlay" style={{zIndex: 99999}}>
      <div className="custom-alert-box">
        <h3 style={{marginTop:0, color:'#fbbf24'}}>Notice</h3>
        <p>{msg}</p>
        <button className="btn btn-primary" onClick={onClose}>Okay</button>
      </div>
    </div>
  );
};

export const ProfileModal = ({ profile, setProfile, user, linkGoogleAccount, handleImageUpload, saveProfile, setActiveModal }) => (
  <div className="modal-overlay">
    <div className="modal-content profile-modal-content">
      <h2>Player Profile</h2>
      <div style={{background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'10px', width:'100%', marginBottom:'15px', textAlign: 'center'}}>
        <p style={{margin:0, color:'#94a3b8', fontSize:'12px'}}>Your Friend Code:</p>
        <h3 style={{margin:'5px 0', color: '#fbbf24', letterSpacing:'2px'}}>{profile?.friendCode}</h3>
      </div>
      <div className="avatar-selection-area">
        <img src={profile?.photoURL} alt="Profile" className="profile-large" />
        <input type="file" accept="image/*" onChange={handleImageUpload} id="pic-upload" style={{display:'none'}}/>
        <label htmlFor="pic-upload" className="btn btn-secondary" style={{fontSize:'12px', padding:'8px 12px'}}>📸 Upload Custom Pic</label>
        <p style={{fontSize: '12px', color: '#94a3b8', margin: '15px 0 5px'}}>Or Select Avatar:</p>
        <div className="avatar-grid">
          {AVATARS.map((url, i) => (
            <img key={i} src={url} alt="avatar" className={`avatar-option ${profile?.photoURL === url ? 'selected' : ''}`} onClick={() => setProfile({...profile, photoURL: url})}/>
          ))}
        </div>
      </div>
      <label>Nickname:</label>
      <input className="modal-input" value={profile?.displayName || ''} onChange={(e) => setProfile({...profile, displayName: e.target.value})} />
      <label>Country:</label>
      <select className="modal-input" value={profile?.country || '🌍'} onChange={(e) => setProfile({...profile, country: e.target.value})}>
        {COUNTRIES.map(c => <option key={c.name} value={c.flag}>{c.flag} {c.name}</option>)}
      </select>
      <label>Gender:</label>
      <select className="modal-input" value={profile?.gender || 'Unspecified'} onChange={(e) => setProfile({...profile, gender: e.target.value})}>
        <option value="Unspecified">Unspecified</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
      {user?.isAnonymous && (
         <button className="btn btn-google" style={{width:'100%', marginBottom:'20px', padding:'10px'}} onClick={linkGoogleAccount}>
            <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="G" /> Secure Account with Google
         </button>
      )}
      <div className="stats-row">
        <div><strong>{profile?.gamesPlayed || 0}</strong> Matches</div>
        <div><strong>{profile?.wins || 0}</strong> Wins</div>
      </div>
      <button className="btn btn-primary" style={{width: '100%'}} onClick={saveProfile}>Save Changes</button>
      <button className="btn-close" onClick={() => setActiveModal(null)}>Close</button>
    </div>
  </div>
);

export const FriendsModal = ({ profile, friendCodeInput, setFriendCodeInput, challengeFriend, setActiveModal, setAlertMsg }) => (
  <div className="modal-overlay">
    <div className="modal-content profile-modal-content">
      <h2>👥 Friends List</h2>
      <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'10px', width:'100%', marginBottom:'20px'}}>
         <p style={{margin:0, color:'#94a3b8', fontSize:'14px'}}>Your Friend Code:</p>
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
           <h3 style={{margin:'5px 0', letterSpacing:'2px'}}>{profile?.friendCode}</h3>
           <button className="btn btn-secondary" onClick={() => {navigator.clipboard.writeText(profile?.friendCode); setAlertMsg("Code Copied!");}}>Copy</button>
         </div>
      </div>
      <div style={{width:'100%', display:'flex', gap:'10px', marginBottom:'20px'}}>
         <input className="modal-input" style={{margin:0}} placeholder="Friend Code" maxLength={6} value={friendCodeInput} onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())} />
         <button className="btn btn-primary" style={{margin:0}} onClick={() => setAlertMsg("Ensure the Friend Code matches exactly to add.")}>Add</button>
      </div>
      <div className="leaderboard-list" style={{maxHeight:'200px'}}>
        {Object.keys(profile?.friends || {}).length === 0 ? <p style={{color:'#94a3b8'}}>No friends added yet.</p> : null}
        {Object.entries(profile?.friends || {}).map(([uid, f]) => (
          <div key={uid} className="lb-item">
            <img src={f.photoURL || 'https://via.placeholder.com/30'} alt="pic" />
            <span className="lb-name" style={{flex: 1}}>{f.name}</span>
            <button className="btn-add-friend-small" style={{backgroundColor: '#10b981', borderColor: '#059669', color: 'white'}} onClick={() => challengeFriend(uid, f.name)}>
              ⚔️ Play
            </button>
          </div>
        ))}
      </div>
      <button className="btn-close" onClick={() => setActiveModal(null)}>Close</button>
    </div>
  </div>
);

export const LeaderboardModal = ({ leaderboard, user, profile, challengeFriend, addFriendDirectly, setActiveModal }) => (
  <div className="modal-overlay">
    <div className="modal-content leaderboard-modal">
      <h2>🏆 Top 50 Players</h2>
      <div className="leaderboard-list">
        {leaderboard.map((u, i) => {
          const isMe = u.uid === user?.uid;
          const isFriend = profile?.friends && profile.friends[u.uid];
          return (
          <div key={i} className={`lb-item ${isMe ? 'is-me' : ''}`}>
            <span className="lb-rank">#{i+1}</span>
            <img src={u.photoURL || 'https://via.placeholder.com/30'} alt="pic" />
            <div className="lb-details">
              <span className="lb-name">{u.country || '🌍'} {u.displayName || 'Unknown'}</span>
              <span className="lb-coins">{u.coins} 🪙</span>
            </div>
            
            {!isMe && !isFriend && (
               <button className="btn-add-friend-small" onClick={() => addFriendDirectly(u.uid, u.displayName, u.photoURL)}>
                 +👤
               </button>
            )}
            
            {!isMe && isFriend && (
               <button className="btn-add-friend-small" style={{backgroundColor: '#10b981', borderColor: '#059669', color: 'white'}} onClick={() => challengeFriend(u.uid, u.displayName)}>
                 ⚔️ Play
               </button>
            )}
          </div>
        )})}
      </div>
      <button className="btn-close" onClick={() => setActiveModal(null)}>Close</button>
    </div>
  </div>
);

export const SettingsModal = ({ bgmVolume, setBgmVolume, isMusicMuted, setIsMusicMuted, isSfxMuted, setIsSfxMuted, setActiveModal }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>⚙️ Global Settings</h2>
      <div className="settings-row">
        <span>Music Volume</span>
        <input type="range" min="0" max="1" step="0.01" value={bgmVolume} onChange={(e) => setBgmVolume(parseFloat(e.target.value))} />
      </div>
      <div className="settings-row">
        <span>Mute Music</span>
        <button className={`toggle-btn ${isMusicMuted ? 'off' : 'on'}`} onClick={() => setIsMusicMuted(!isMusicMuted)}>
          {isMusicMuted ? 'Muted' : 'Playing'}
        </button>
      </div>
      <div className="settings-row">
        <span>Sound Effects (SFX)</span>
        <button className={`toggle-btn ${isSfxMuted ? 'off' : 'on'}`} onClick={() => setIsSfxMuted(!isSfxMuted)}>
          {isSfxMuted ? 'Muted' : 'Active'}
        </button>
      </div>
      <button className="btn-close" onClick={() => setActiveModal(null)}>Done</button>
    </div>
  </div>
);

export const HostJoinModal = ({ playerSelect, setPlayerSelect, createRoom, joinInput, setJoinInput, joinRoom, setActiveModal }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>Multiplayer Room</h2>
      <p className="fee-text">Entry Fee: {BET_AMOUNT} 🪙</p>
      <div className="player-select">
        {[2, 3, 4].map(num => (
          <button key={num} className={`p-btn ${playerSelect === num ? 'active' : ''}`} onClick={() => setPlayerSelect(num)}>{num} Players</button>
        ))}
      </div>
      <button className="btn btn-primary" style={{width: '100%'}} onClick={() => createRoom(false)}>Host Game</button>
      <hr className="divider"/>
      <h3>Join with Code</h3>
      <input className="modal-input" placeholder="Enter 4-letter code" maxLength={4} value={joinInput} onChange={(e) => setJoinInput(e.target.value.toUpperCase())} />
      <button className="btn btn-join" style={{width: '100%', marginTop: '10px'}} onClick={() => joinRoom(joinInput)}>Join Game</button>
      <button className="btn-close" onClick={() => setActiveModal(null)}>Cancel</button>
    </div>
  </div>
);
