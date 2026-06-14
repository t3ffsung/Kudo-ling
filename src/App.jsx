import { useState, useEffect, useRef } from 'react';
import { db, auth, googleProvider } from './firebase';
import { ref, onValue, update, push, set, get, remove } from "firebase/database";
import { signInWithPopup, signInWithRedirect, signInAnonymously, signOut, onAuthStateChanged, linkWithPopup, getRedirectResult } from "firebase/auth";
import './App.css';
import './Game.css';
import { BET_AMOUNT, BASE_POSITIONS, TURN_ORDER, SAFE_SPOTS, PATHS, AVATARS, normalizeTokens } from './constants';
import { SplashScreen, LoginScreen, HomeScreen, LobbyScreen, GameScreen } from './AppScreens';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeModal, setActiveModal] = useState(null); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [alertMsg, setAlertMsg] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [friendCodeInput, setFriendCodeInput] = useState("");
  
  const [roomCode, setRoomCode] = useState(null);
  const [joinInput, setJoinInput] = useState("");
  const [playerSelect, setPlayerSelect] = useState(4);
  const [gameState, setGameState] = useState(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState('text');
  const [chatMsg, setChatMsg] = useState("");
  
  const [bgmVolume, setBgmVolume] = useState(0.15); 
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);

  const [isHost, setIsHost] = useState(false); 
  const [musicStarted, setMusicStarted] = useState(false);
  
  const isProcessingMove = useRef(false);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const lastPlayedChatRef = useRef(null);
  
  const isSfxMutedRef = useRef(isSfxMuted);
  useEffect(() => { isSfxMutedRef.current = isSfxMuted; }, [isSfxMuted]);

  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // THIS RUNS AFTER THE SPLASH SCREEN / VIDEO FINISHES
  const handleSplashComplete = async (enteredName) => {
    localStorage.setItem('ludo_player_name', enteredName); // Save for next time
    
    // If they aren't logged in, log them in as a guest automatically!
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Guest login failed", e);
      }
    } else {
      // If they are already logged in, update their name in the database
      update(ref(db, `users/${auth.currentUser.uid}`), { displayName: enteredName });
    }
    
    setShowSplash(false);
  };

  const playSound = (type) => {
    if (isSfxMutedRef.current) return;
    try {
      if (type === 'roll') { const a = new Audio('/dice-roll.mp3'); a.playbackRate = 1.8; a.play().catch(()=>{}); return; }
      if (type === 'monster') { const a = new Audio('/Monster-laugh.mp3'); a.play().catch(()=>{}); return; }
      const ctx = window.AudioContext ? new AudioContext() : null;
      if (!ctx) return;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'move') { osc.type = 'sine'; osc.frequency.setValueAtTime(900, ctx.currentTime); gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05); osc.start(); osc.stop(ctx.currentTime + 0.05); }
      else if (type === 'cut') { osc.type = 'triangle'; osc.frequency.setValueAtTime(200, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3); gain.gain.setValueAtTime(0.6, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); osc.start(); osc.stop(ctx.currentTime + 0.3); }
      else if (type === 'home') { osc.type = 'triangle'; osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3); gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8); }
    } catch (e) {}
  };
  
  const playChatVoice = (audioId) => { if (isSfxMutedRef.current) return; try { new Audio(`/${audioId}.mp3`).play().catch(()=>{}); } catch(e){} };

  useEffect(() => {
    getRedirectResult(auth).catch(()=>{});
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        onValue(ref(db, `users/${currentUser.uid}`), (snap) => {
          if (snap.exists()) {
            const data = snap.val();
            if (!data.friendCode) { const code = Math.random().toString(36).substring(2, 8).toUpperCase(); update(ref(db, `users/${currentUser.uid}`), { friendCode: code }); data.friendCode = code; }
            setProfile(data);
          } else {
            // Apply the name they just entered on the first screen
            const savedName = localStorage.getItem('ludo_player_name');
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const newProfile = { 
              displayName: savedName || currentUser.displayName || `Player_${Math.floor(Math.random()*1000)}`, 
              photoURL: currentUser.photoURL || AVATARS[0], 
              coins: 1000, gender: 'Unspecified', country: '🌍', friendCode: code, friends: {}, wins: 0, gamesPlayed: 0 
            };
            set(ref(db, `users/${currentUser.uid}`), newProfile); setProfile(newProfile);
          }
        });
        onValue(ref(db, `users/${currentUser.uid}/invite`), (snap) => setPendingInvite(snap.exists() ? snap.val() : null));
      }
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    try { const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && window.location.hostname !== 'localhost') await signInWithRedirect(auth, googleProvider);
      else await signInWithPopup(auth, googleProvider); 
    } catch (e) { setAlertMsg(`Google Login Error: ${e.message}`); }
  };

  const loginAsGuest = async () => { try { await signInAnonymously(auth); } catch (e) { setAlertMsg(`Guest Error: ${e.message}`); } };
  const handleSignOut = () => signOut(auth);
  const copyRoomCode = () => { if (roomCode) { navigator.clipboard.writeText(roomCode); setAlertMsg("Code copied!"); } }

  const fetchLeaderboard = async () => {
    const snap = await get(ref(db, 'users'));
    if (snap.exists()) setLeaderboard(Object.entries(snap.val()).map(([uid, data]) => ({ ...data, uid })).sort((a, b) => (b.coins || 0) - (a.coins || 0)).slice(0, 50));
  };

  const addFriendDirectly = async (friendUid, friendName, friendPhoto) => {
    if (friendUid === user.uid) return setAlertMsg("You can't add yourself!");
    await update(ref(db, `users/${user.uid}/friends/${friendUid}`), { name: friendName, photoURL: friendPhoto });
    setAlertMsg(`${friendName} added to friends!`);
  };

  const inviteFriend = (friendUid) => { if(!roomCode) return; set(ref(db, `users/${friendUid}/invite`), { roomCode, senderName: profile.displayName }); setAlertMsg("Invite sent!"); };
  const declineInvite = () => remove(ref(db, `users/${user.uid}/invite`));
  const acceptInvite = () => { if(pendingInvite?.roomCode) { setJoinInput(pendingInvite.roomCode); declineInvite(); joinRoom(pendingInvite.roomCode); } };

  const challengeFriend = async (friendUid, friendName) => {
    if (!profile || profile.coins < BET_AMOUNT) return setAlertMsg(`Need ${BET_AMOUNT} coins!`);
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    try {
      await update(ref(db, `users/${user.uid}`), { coins: profile.coins - BET_AMOUNT, gamesPlayed: profile.gamesPlayed + 1 });
      await update(ref(db, `rooms/${code}`), {
        tokens: { red: BASE_POSITIONS.red, yellow: BASE_POSITIONS.yellow },
        players: { red: { name: profile.displayName, uid: user.uid, isBot: false, photoURL: profile.photoURL || '' }, yellow: { name: "Waiting...", isBot: false } },
        activeColors: ['red', 'yellow'], currentPlayer: 'red', currentRoll: 0, consecutiveSixes: 0, winner: "", isAnimating: false, botRolling: false, attackingToken: null, payoutClaimed: false, pot: BET_AMOUNT * 2, scores: { red: 0, green: 0, yellow: 0, blue: 0 }
      });
      await set(ref(db, `users/${friendUid}/invite`), { roomCode: code, senderName: profile.displayName });
      setIsHost(true); setRoomCode(code); setActiveModal(null); setAlertMsg(`Invited ${friendName}! Waiting in lobby...`);
    } catch (e) { setAlertMsg("Failed to connect."); }
  };

  const createRoom = async (vsBot = false) => {
    if (!profile || profile.coins < BET_AMOUNT) return setAlertMsg(`Need ${BET_AMOUNT} coins!`);
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    let count = vsBot ? 2 : playerSelect;
    const initialTokens = {}; const playersInfo = {};

    if (count >= 2) { 
      if (vsBot) { initialTokens.blue = BASE_POSITIONS.blue; initialTokens.green = BASE_POSITIONS.green; playersInfo.blue = { name: profile.displayName, uid: user.uid, isBot: false, photoURL: profile.photoURL || '' }; playersInfo.green = { name: "AI Bot", isBot: true, photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AIBot' }; } 
      else { initialTokens.red = BASE_POSITIONS.red; initialTokens.yellow = BASE_POSITIONS.yellow; playersInfo.red = { name: profile.displayName, uid: user.uid, isBot: false, photoURL: profile.photoURL || '' }; playersInfo.yellow = { name: "Waiting...", isBot: false }; }
    } 
    if (count >= 3 && !vsBot) { initialTokens.green = BASE_POSITIONS.green; playersInfo.green = { name: "Waiting...", isBot: false }; }
    if (count === 4 && !vsBot) { initialTokens.blue = BASE_POSITIONS.blue; playersInfo.blue = { name: "Waiting...", isBot: false }; }
    const orderedColors = TURN_ORDER.filter(color => initialTokens[color]);
    
    try {
      await update(ref(db, `users/${user.uid}`), { coins: profile.coins - BET_AMOUNT, gamesPlayed: profile.gamesPlayed + 1 });
      await update(ref(db, `rooms/${code}`), { tokens: initialTokens, players: playersInfo, activeColors: orderedColors, currentPlayer: orderedColors[0], currentRoll: 0, consecutiveSixes: 0, winner: "", isAnimating: false, botRolling: false, attackingToken: null, payoutClaimed: false, pot: vsBot ? (BET_AMOUNT * 2) : BET_AMOUNT, scores: { red: 0, green: 0, yellow: 0, blue: 0 } });
      setIsHost(true); setRoomCode(code); setActiveModal(null);
    } catch (e) { setAlertMsg("Failed to connect."); }
  };

  const joinRoom = (codeOverride) => {
    const codeToJoin = typeof codeOverride === 'string' ? codeOverride : joinInput;
    if (!profile || profile.coins < BET_AMOUNT) return setAlertMsg(`Need ${BET_AMOUNT} coins!`);
    get(ref(db, `rooms/${codeToJoin}`)).then(async (snap) => {
      if (snap.exists()) {
        const data = snap.val(); if(data.winner) return setAlertMsg("Game finished!");
        let assignedColor = Object.keys(data?.players || {}).find(c => data.players[c]?.name === "Waiting...");
        if (assignedColor) {
           await update(ref(db, `users/${user.uid}`), { coins: profile.coins - BET_AMOUNT, gamesPlayed: profile.gamesPlayed + 1 });
           await update(ref(db, `rooms/${codeToJoin}`), { pot: (data.pot || 0) + BET_AMOUNT });
           await update(ref(db, `rooms/${codeToJoin}/players/${assignedColor}`), { name: profile.displayName, uid: user.uid, photoURL: profile.photoURL || '' });
           setIsHost(false); setRoomCode(codeToJoin); setActiveModal(null);
        } else setAlertMsg("Room full!");
      } else setAlertMsg("Room not found!");
    });
  };

  const leaveLobby = async () => {
    const snap = await get(ref(db, `users/${user.uid}`));
    if(snap.exists()) await update(ref(db, `users/${user.uid}`), { coins: snap.val().coins + BET_AMOUNT, gamesPlayed: Math.max(0, snap.val().gamesPlayed - 1) });
    setRoomCode(null); setIsHost(false);
  };

  const handleForfeit = async () => {
    if (gameState && roomCode && user) {
       let myColor = Object.keys(gameState.players || {}).find(c => gameState.players[c].uid === user.uid);
       if (myColor && !gameState.winner) {
          const active = gameState.activeColors || []; const remaining = active.filter(c => c !== myColor);
          let updates = { activeColors: remaining };
          if (remaining.length === 1) updates.winner = remaining[0]; else if (remaining.length === 0) updates.winner = "Draw"; 
          else if (gameState.currentPlayer === myColor) updates.currentPlayer = active[(active.indexOf(myColor) + 1) % active.length];
          await update(ref(db, `rooms/${roomCode}`), updates);
       }
    }
    setRoomCode(null); setIsHost(false);
  };

  const handleSendChat = (e, type = 'text', payload = null) => {
    if (e) e.preventDefault();
    let text = ""; let audioId = null;
    if (type === 'text') { if (!chatMsg.trim()) return; text = chatMsg; setChatMsg(""); } else if (type === 'voice') { text = payload.label; audioId = payload.id; } else if (type === 'emoji') { text = payload; }
    push(ref(db, `rooms/${roomCode}/chat`), { sender: profile?.displayName || 'Player', text: text, type: type, audioId: audioId, timestamp: Date.now() });
  };

  const getValidMoves = (roll, currentTokens, player) => {
    const state = stateRef.current; if (!roll || state?.winner || state?.isAnimating || !currentTokens?.[player]) return [];
    const valid = [];
    currentTokens[player].forEach(pos => {
      const numPos = Number(pos);
      if (BASE_POSITIONS[player].includes(numPos)) { if (roll === 6) valid.push(numPos); } 
      else { const p = PATHS[player].indexOf(numPos); if (p !== -1 && p + roll < PATHS[player].length) valid.push(numPos); }
    });
    return valid;
  };

  const handleRoll = async (value) => {
    const state = stateRef.current; if (state?.isAnimating) return;
    const activePlayer = state.players?.[state.currentPlayer]; if (!activePlayer?.isBot && activePlayer?.uid !== user.uid) return;
    
    try {
      const newSixes = value === 6 ? (state?.consecutiveSixes || 0) + 1 : 0;
      if (newSixes === 3) {
        await update(ref(db, `rooms/${roomCode}`), { currentRoll: value, botRolling: false, consecutiveSixes: 3, isAnimating: true });
        setTimeout(async () => {
          const safeColors = stateRef.current?.activeColors || ['red'];
          await update(ref(db, `rooms/${roomCode}`), { currentPlayer: safeColors[(safeColors.indexOf(stateRef.current?.currentPlayer) + 1) % safeColors.length], currentRoll: 0, consecutiveSixes: 0, isAnimating: false });
        }, 800); return; 
      }
      await update(ref(db, `rooms/${roomCode}`), { currentRoll: value, botRolling: false, consecutiveSixes: newSixes });
      const tokensObj = normalizeTokens(state?.tokens); const playableTokens = getValidMoves(value, tokensObj, state?.currentPlayer);
      
      if (playableTokens.length === 0) {
         setTimeout(async () => { 
           const safeColors = stateRef.current?.activeColors || ['red'];
           await update(ref(db, `rooms/${roomCode}`), { currentPlayer: safeColors[(safeColors.indexOf(stateRef.current?.currentPlayer) + 1) % safeColors.length], currentRoll: 0, consecutiveSixes: 0 });
         }, 500); 
      } else if ([...new Set(playableTokens)].length === 1 && !activePlayer?.isBot) {
         setTimeout(() => { handleTokenClick(state.currentPlayer, [...new Set(playableTokens)][0], tokensObj[state.currentPlayer].findIndex(p => p === [...new Set(playableTokens)][0])); }, 300); 
      }
    } catch (error) {}
  };

  const handleTokenClick = async (color, index, tokenArrayIndex) => {
    const state = stateRef.current;
    if (isProcessingMove.current || !state || color !== state.currentPlayer || state.currentRoll === 0 || state.winner || state.isAnimating) return; 
    const activePlayer = state.players?.[state.currentPlayer]; if (!activePlayer?.isBot && activePlayer?.uid !== user.uid) return;

    isProcessingMove.current = true; let localTokens = normalizeTokens(state.tokens); 

    if (BASE_POSITIONS[color].includes(Number(index)) && Number(state.currentRoll) === 6) {
      playSound('move'); localTokens[color][tokenArrayIndex] = PATHS[color][0]; 
      await update(ref(db, `rooms/${roomCode}`), { isAnimating: true, tokens: localTokens });
      setTimeout(async () => { isProcessingMove.current = false; await update(ref(db, `rooms/${roomCode}`), { currentRoll: 0, isAnimating: false }); }, 100); return;
    } 
    
    const targetPathIndex = PATHS[color].indexOf(Number(index)) + Number(state.currentRoll); let currentStepIdx = PATHS[color].indexOf(Number(index));
    await update(ref(db, `rooms/${roomCode}`), { isAnimating: true });
    
    const moveStep = async () => {
      currentStepIdx++; const stepPos = PATHS[color][currentStepIdx]; localTokens[color][tokenArrayIndex] = stepPos; playSound('move'); 
      if (currentStepIdx === targetPathIndex) {
        if (stepPos === 999) playSound('home');
        let cutOpponents = [];
        if (!SAFE_SPOTS.includes(stepPos) && stepPos !== 999) {
          Object.keys(localTokens).forEach(oppColor => { if (oppColor !== color) localTokens[oppColor].forEach((oppPos, oppIdx) => { if (Number(oppPos) === stepPos) cutOpponents.push({ oppColor, oppIdx, pathIdx: PATHS[oppColor].indexOf(stepPos) }); }); });
        }
        const finishTurn = async (didCut) => {
          const updates = { isAnimating: false, attackingToken: null };
          if (localTokens[color].every(pos => Number(pos) === 999)) { updates.winner = color; updates[`scores/${color}`] = (stateRef.current?.scores?.[color] || 0) + 1; } 
          else {
            if (state.currentRoll === 6 || didCut || stepPos === 999) updates.currentRoll = 0; 
            else { const safeColors = stateRef.current?.activeColors || ['red']; updates.currentPlayer = safeColors[(safeColors.indexOf(stateRef.current?.currentPlayer) + 1) % safeColors.length]; updates.currentRoll = 0; updates.consecutiveSixes = 0; }
          }
          isProcessingMove.current = false; await update(ref(db, `rooms/${roomCode}`), updates);
        };
        if (cutOpponents.length > 0) {
          await update(ref(db, `rooms/${roomCode}`), { tokens: localTokens, attackingToken: { color, index: tokenArrayIndex } });
          
          setTimeout(() => {
            playSound('cut');
            playSound('monster'); 
            const animateCuts = async () => {
              let stillMoving = false;
              cutOpponents.forEach(opp => {
                if (opp.pathIdx > 0) { opp.pathIdx = Math.max(0, opp.pathIdx - 2); localTokens[opp.oppColor][opp.oppIdx] = PATHS[opp.oppColor][opp.pathIdx]; stillMoving = true; } 
                else if (opp.pathIdx === 0) { localTokens[opp.oppColor][opp.oppIdx] = BASE_POSITIONS[opp.oppColor].find(bp => !localTokens[opp.oppColor].includes(bp)); opp.pathIdx = -1; stillMoving = true; }
              });
              await update(ref(db, `rooms/${roomCode}`), { tokens: localTokens });
              if (stillMoving) setTimeout(animateCuts, 4); else finishTurn(true);
            }; animateCuts();
          }, 800); 
        } else { await update(ref(db, `rooms/${roomCode}`), { tokens: localTokens }); setTimeout(() => finishTurn(false), 50); }
      } else { await update(ref(db, `rooms/${roomCode}`), { tokens: localTokens }); setTimeout(moveStep, 16); }
    }; moveStep();
  };

  useEffect(() => {
    if (gameState?.winner && roomCode && profile && user) {
      const myPlayer = Object.entries(gameState.players || {}).find(([_, p]) => p.uid === user.uid);
      if (myPlayer && myPlayer[0] === gameState.winner && !gameState.payoutClaimed) {
        get(ref(db, `users/${user.uid}`)).then(snap => { if (snap.exists()) { update(ref(db, `users/${user.uid}`), { coins: snap.val().coins + (gameState.pot || 0), wins: (snap.val().wins || 0) + 1 }); update(ref(db, `rooms/${roomCode}`), { payoutClaimed: true }); }});
      }
    }
  }, [gameState?.winner, roomCode, user?.uid]);

  useEffect(() => {
    if (!audioRef.current) { audioRef.current = new Audio('/bg-music.mp3'); audioRef.current.loop = true; }
    
    const startAudio = () => { 
      if (!showSplash && !musicStarted && audioRef.current) {
        audioRef.current.play().then(() => setMusicStarted(true)).catch(()=>{}); 
      }
    };

    if (!showSplash) {
      startAudio();
    }
    
    window.addEventListener('click', startAudio);
    return () => window.removeEventListener('click', startAudio);
  }, [showSplash, musicStarted]);

  useEffect(() => { if (audioRef.current) { audioRef.current.volume = bgmVolume; audioRef.current.muted = (isMusicMuted || bgmVolume === 0); } }, [bgmVolume, isMusicMuted]);

  useEffect(() => {
    if (!roomCode) return;
    const unsub = onValue(ref(db, `rooms/${roomCode}`), (snapshot) => { if (snapshot.exists()) setGameState(snapshot.val()); else { setAlertMsg("Room closed."); setRoomCode(null); setActiveModal(null); } });
    return () => unsub();
  }, [roomCode]);

  useEffect(() => {
    const chatList = gameState?.chat ? Object.values(gameState.chat) : [];
    if (chatList.length > 0) {
      const latestChat = chatList[chatList.length - 1];
      if (latestChat.type === 'voice' && latestChat.timestamp !== lastPlayedChatRef.current) { lastPlayedChatRef.current = latestChat.timestamp; playChatVoice(latestChat.audioId); }
      if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [gameState?.chat, isChatOpen]);

  useEffect(() => {
    const state = gameState; if (!state || !isHost || isProcessingMove.current || state.winner || state.isAnimating) return;
    const currentPlayerKey = state.currentPlayer;
    if (state.players?.[currentPlayerKey]?.isBot) {
      if (state.currentRoll === 0 && !state.botRolling) {
        isProcessingMove.current = true; update(ref(db, `rooms/${roomCode}`), { botRolling: true }).then(() => { setTimeout(() => { isProcessingMove.current = false; handleRoll(Math.floor(Math.random() * 6) + 1); }, 400); });
      } else if (state.currentRoll > 0 && !state.botRolling) {
        const tokensObj = normalizeTokens(state.tokens); const validMoves = getValidMoves(state.currentRoll, tokensObj, currentPlayerKey);
        if (validMoves.length > 0) {
          isProcessingMove.current = true;
          setTimeout(() => {
            let bestMove = { pos: validMoves[0], score: -1 };
            validMoves.forEach(pos => {
               let score = 0; const isBase = BASE_POSITIONS[currentPlayerKey].includes(pos);
               if (isBase && state.currentRoll === 6) score = 5; 
               else {
                 const target = PATHS[currentPlayerKey][PATHS[currentPlayerKey].indexOf(pos) + state.currentRoll];
                 if (target === 999) score = 10; else if (!SAFE_SPOTS.includes(target)) { Object.keys(tokensObj).forEach(opp => { if (opp !== currentPlayerKey && tokensObj[opp].includes(target)) score = 8; }); } else score = 2; 
               }
               if (score > bestMove.score) bestMove = { pos, score };
            });
            isProcessingMove.current = false; handleTokenClick(currentPlayerKey, bestMove.pos, tokensObj[currentPlayerKey].findIndex(p => p === bestMove.pos));
          }, 400); 
        } 
      }
    }
  }, [gameState?.currentPlayer, gameState?.currentRoll, gameState?.isAnimating, gameState?.botRolling]);

  const uiState = { user, profile, activeModal, leaderboard, alertMsg, pendingInvite, friendCodeInput, roomCode, joinInput, playerSelect, gameState, isChatOpen, chatMode, chatMsg, bgmVolume, isMusicMuted, isSfxMuted, isHost };
  const uiActions = { setActiveModal, setAlertMsg, setFriendCodeInput, setJoinInput, setPlayerSelect, setIsChatOpen, setChatMode, setChatMsg, setBgmVolume, setIsMusicMuted, setIsSfxMuted, setRoomCode, setIsHost, setProfile };
  const gameActions = { loginWithGoogle, loginAsGuest, fetchLeaderboard, addFriendDirectly, inviteFriend, acceptInvite, declineInvite, challengeFriend, createRoom, joinRoom, leaveLobby, handleForfeit, handleSendChat, getValidMoves, handleRoll, handleTokenClick, playSound, playChatVoice, handleSignOut, copyRoomCode };

  // 1. App Loads -> Show Splash Screen (Which asks for name first)
  if (showSplash) return <SplashScreen onComplete={handleSplashComplete} />;
  
  // 2. Fallback Login Screen (Only if they explicitly log out)
  if (!user) return <LoginScreen uiState={uiState} uiActions={uiActions} gameActions={gameActions} />;
  
  // 3. Home Screen (User drops straight in here after intro!)
  if (!roomCode) return <HomeScreen uiState={uiState} uiActions={uiActions} gameActions={gameActions} />;
  
  // 4. Game Lobby & Match
  const players = gameState?.players || {};
  if (!Object.values(players).every(p => p.name !== "Waiting...")) return <LobbyScreen uiState={uiState} uiActions={uiActions} gameActions={gameActions} />;
  
  return <GameScreen uiState={uiState} uiActions={uiActions} gameActions={gameActions} chatEndRef={chatEndRef} />;
}

export default App;
