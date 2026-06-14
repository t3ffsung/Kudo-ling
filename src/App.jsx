import { useState, useEffect, useRef } from 'react';
import { db, auth, googleProvider } from './firebase';
import { ref, onValue, update, push, set, get } from "firebase/database";
import { signInWithPopup, signInWithRedirect, signInAnonymously, signOut, onAuthStateChanged, linkWithPopup, linkWithRedirect, getRedirectResult } from "firebase/auth";
import './App.css';
import Board from './Board';
import Dice from './Dice';

const BET_AMOUNT = 100;
let globalSfxMuted = false;

const playSound = (type) => {
  if (globalSfxMuted) return;
  try {
    if (type === 'monster') {
      const monsterAudio = new Audio('/Monster-laugh.mp3');
      monsterAudio.play().catch(() => {});
      return; 
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'move') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(900, ctx.currentTime); 
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'cut') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(200, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.6, ctx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'home') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); 
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0, ctx.currentTime); gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime + 0.3); gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
    }
  } catch (e) {}
};

const playChatVoice = (audioId) => {
  if (globalSfxMuted) return;
  try {
    const audio = new Audio(`/${audioId}.mp3`);
    audio.play().catch(() => {});
  } catch(e) {}
};

const BASE_POSITIONS = { red: [16, 19, 61, 64], green: [25, 28, 70, 73], blue: [151, 154, 196, 199], yellow: [160, 163, 205, 208] };
const TURN_ORDER = ['red', 'green', 'yellow', 'blue'];
const SAFE_SPOTS = [36, 102, 122, 188, 91, 23, 133, 201];
const MASTER_PATH = [ 91, 92, 93, 94, 95, 81, 66, 51, 36, 21, 6, 7, 8, 23, 38, 53, 68, 83, 99, 100, 101, 102, 103, 104, 119, 134, 133, 132, 131, 130, 129, 143, 158, 173, 188, 203, 218, 217, 216, 201, 186, 171, 156, 141, 125, 124, 123, 122, 121, 120, 105, 90 ];
const PATHS = {
  red: [...MASTER_PATH.slice(0, 51), 106, 107, 108, 109, 110, 999],
  green: [...MASTER_PATH.slice(13, 52), ...MASTER_PATH.slice(0, 12), 22, 37, 52, 67, 82, 999],
  yellow: [...MASTER_PATH.slice(26, 52), ...MASTER_PATH.slice(0, 25), 118, 117, 116, 115, 114, 999],
  blue: [...MASTER_PATH.slice(39, 52), ...MASTER_PATH.slice(0, 38), 202, 187, 172, 157, 142, 999]
};

const VOICE_PRESETS = [
  { id: 'ab-dekhna-m', label: 'Ab Dekhna', gender: 'm' }, { id: 'agli-baar-kismat-sath-degi-m', label: 'Agli Baar Kismat', gender: 'm' }, { id: 'amazing-m', label: 'Amazing', gender: 'm' }, { id: 'arey-baap-re-f', label: 'Arey Baap Re', gender: 'f' }, { id: 'arey-nahi-m', label: 'Arey Nahi', gender: 'm' }, { id: 'arey-wah-aaj-toh-f', label: 'Arey Wah Aaj Toh', gender: 'f' }, { id: 'arey-yr-meri-f', label: 'Arey Yaar Meri', gender: 'f' }, { id: 'aur-batao-f', label: 'Aur Batao', gender: 'f' }, { id: 'bach-gaye-m', label: 'Bach Gaye', gender: 'm' }, { id: 'badhiya-chal-m', label: 'Badhiya Chal', gender: 'm' }, { id: 'better-luck-next-time-m', label: 'Better Luck Next Time', gender: 'm' }, { id: 'bohot-badhiya-khela-m', label: 'Bohot Badhiya Khela', gender: 'm' }, { id: 'Good-Luck-m', label: 'Good Luck', gender: 'm' }, { id: 'haha-ye-chaal-toh-f', label: 'Haha Ye Chaal', gender: 'f' }, { id: 'himmat-hai-toh-hara-f', label: 'Himmat Hai Toh Hara', gender: 'f' }, { id: 'hurry-up-m', label: 'Hurry Up', gender: 'm' }, { id: 'jaldi-karo-m', label: 'Jaldi Karo', gender: 'm' }, { id: 'koi-baat-nhi-f', label: 'Koi Baat Nahi', gender: 'f' }, { id: 'koi-baat-nhi-m', label: 'Koi Baat Nahi', gender: 'm' }, { id: 'lets-play-again-m', label: 'Lets Play Again', gender: 'm' }, { id: 'mujhe-harana-itna-f', label: 'Mujhe Harana Itna', gender: 'f' }, { id: 'Nice-move-m', label: 'Nice Move', gender: 'm' }, { id: 'ohho-m', label: 'Ohho', gender: 'm' }, { id: 'oops-m', label: 'Oops', gender: 'm' }, { id: 'pakad-liya-m', label: 'Pakad Liya', gender: 'm' }, { id: 'sambhal-ke-f', label: 'Sambhal Ke', gender: 'f' }, { id: 'soch-lo-f', label: 'Soch Lo', gender: 'f' }, { id: 'subhkamnaye-m', label: 'Subhkamnaye', gender: 'm' }, { id: 'thank-you-m', label: 'Thank You', gender: 'm' }, { id: 'well-played-m', label: 'Well Played', gender: 'm' }, { id: 'yeh-toh-sarasar-f', label: 'Yeh Toh Sarasar', gender: 'f' }, { id: 'your-turn-m', label: 'Your Turn', gender: 'm' }
];

const EMOJIS = ['😂', '😎', '😡', '😭', '👍', '👎', '🎲', '🔥', '🎉', '😱', '🤫', '🤦‍♂️', '😈', '💀', '✌️', '💪'];

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cleo'
];

const normalizeTokens = (firebaseTokens) => {
  const norm = {};
  if (!firebaseTokens) return norm;
  Object.keys(firebaseTokens).forEach(color => {
    if (Array.isArray(firebaseTokens[color])) norm[color] = [...firebaseTokens[color]].map(Number);
    else if (typeof firebaseTokens[color] === 'object') norm[color] = Object.values(firebaseTokens[color]).map(Number);
    else norm[color] = [];
  });
  return norm;
};

const CustomAlert = ({ msg, onClose }) => {
  if (!msg) return null;
  return (
    <div className="modal-overlay" style={{zIndex: 9999}}>
      <div className="custom-alert-box">
        <h3 style={{marginTop:0, color:'#fbbf24'}}>Notice</h3>
        <p>{msg}</p>
        <button className="btn btn-primary" onClick={onClose}>Okay</button>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeModal, setActiveModal] = useState(null); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [alertMsg, setAlertMsg] = useState(null);
  
  const [roomCode, setRoomCode] = useState(null);
  const [joinInput, setJoinInput] = useState("");
  const [playerSelect, setPlayerSelect] = useState(4);
  const [gameState, setGameState] = useState(null);
  
  // Chat Overlay States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState('text');
  const [chatMsg, setChatMsg] = useState("");
  
  const [bgmVolume, setBgmVolume] = useState(0.35);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);

  const [isHost, setIsHost] = useState(false); 
  const [musicStarted, setMusicStarted] = useState(false);
  
  const isProcessingMove = useRef(false);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const monsterAudioRef = useRef(null);
  const lastPlayedChatRef = useRef(null);
  
  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  useEffect(() => { globalSfxMuted = isSfxMuted; }, [isSfxMuted]);

  // Handle Auth with Redirect Catch
  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect login error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.val());
          } else {
            const isGuest = currentUser.isAnonymous;
            const newProfile = {
              displayName: currentUser.displayName || (isGuest ? `Guest_${Math.floor(Math.random()*1000)}` : 'Player'),
              photoURL: currentUser.photoURL || AVATARS[Math.floor(Math.random()*AVATARS.length)],
              coins: 1000,
              gender: 'Unspecified',
              wins: 0,
              gamesPlayed: 0
            };
            set(userRef, newProfile);
            setProfile(newProfile);
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try { 
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider); 
      }
    } catch (e) { console.error(e); setAlertMsg("Google Login Failed."); }
  };

  const loginAsGuest = async () => {
    try { await signInAnonymously(auth); }
    catch (e) { setAlertMsg("Failed to sign in as guest. Please try again."); }
  };

  const linkGoogleAccount = async () => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await linkWithRedirect(auth.currentUser, googleProvider);
      } else {
        const result = await linkWithPopup(auth.currentUser, googleProvider);
        const linkedUser = result.user;
        const updates = {
          displayName: linkedUser.displayName || profile.displayName,
          photoURL: linkedUser.photoURL || profile.photoURL
        };
        await update(ref(db, `users/${linkedUser.uid}`), updates);
        setProfile({...profile, ...updates});
        setAlertMsg("Account successfully secured with Google!");
      }
    } catch (e) {
      setAlertMsg("Failed to link account. It might already be in use.");
    }
  };

  // Client-side sorting bypasses Firebase Index Rules allowing all users to show
  const fetchLeaderboard = async () => {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const usersObj = snapshot.val();
      const usersArray = Object.values(usersObj)
        .sort((a, b) => (b.coins || 0) - (a.coins || 0))
        .slice(0, 50); // Get top 50
      setLeaderboard(usersArray);
    }
  };

  useEffect(() => {
    if (gameState?.winner && roomCode && profile && user) {
      const myPlayer = Object.entries(gameState.players || {}).find(([_, p]) => p.uid === user.uid);
      if (myPlayer && myPlayer[0] === gameState.winner && !gameState.payoutClaimed) {
        const winRef = ref(db, `users/${user.uid}`);
        get(winRef).then(snap => {
          if (snap.exists()) {
            const uData = snap.val();
            update(winRef, { coins: uData.coins + (gameState.pot || 0), wins: (uData.wins || 0) + 1 });
            update(ref(db, `rooms/${roomCode}`), { payoutClaimed: true });
          }
        });
      }
    }
  }, [gameState?.winner, roomCode, user?.uid]);

  useEffect(() => {
    if (!monsterAudioRef.current) {
      monsterAudioRef.current = new Audio('/Monster-laugh.mp3');
      monsterAudioRef.current.loop = true;
    }
  }, []);

  useEffect(() => {
    if (gameState?.attackingToken && !isSfxMuted) {
      monsterAudioRef.current?.play().catch(e => {});
    } else {
      if (monsterAudioRef.current) {
        monsterAudioRef.current.pause();
        monsterAudioRef.current.currentTime = 0; 
      }
    }
  }, [gameState?.attackingToken, isSfxMuted]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/bg-music.mp3');
      audioRef.current.loop = true;
    }
    const startAudio = () => {
      if (!musicStarted && audioRef.current) {
        audioRef.current.play().then(() => { setMusicStarted(true); window.removeEventListener('click', startAudio); }).catch(() => {});
      }
    };
    startAudio();
    window.addEventListener('click', startAudio);
    return () => window.removeEventListener('click', startAudio);
  }, [musicStarted]);

  useEffect(() => { 
    if (audioRef.current) {
      audioRef.current.volume = bgmVolume; 
      audioRef.current.muted = (isMusicMuted || bgmVolume === 0);
    }
  }, [bgmVolume, isMusicMuted]);

  useEffect(() => {
    if (!roomCode) return;
    const gameRef = ref(db, `rooms/${roomCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) setGameState(snapshot.val());
      else { setAlertMsg("Room Code not found or game ended!"); setRoomCode(null); setActiveModal(null); }
    });
    return () => unsubscribe();
  }, [roomCode]);

  useEffect(() => {
    const chatList = gameState?.chat ? Object.values(gameState.chat) : [];
    if (chatList.length > 0) {
      const latestChat = chatList[chatList.length - 1];
      if (latestChat.type === 'voice' && latestChat.timestamp !== lastPlayedChatRef.current) {
        lastPlayedChatRef.current = latestChat.timestamp;
        playChatVoice(latestChat.audioId);
      }
      if (isChatOpen) {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [gameState?.chat, isChatOpen]);

  const createRoom = async (vsBot = false) => {
    if (!profile || profile.coins < BET_AMOUNT) return setAlertMsg(`Not enough coins! You need ${BET_AMOUNT} coins to play.`);
    
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    let count = vsBot ? 2 : playerSelect;
    const initialTokens = {};
    const playersInfo = {};

    if (count >= 2) { 
      if (vsBot) {
        initialTokens.blue = BASE_POSITIONS.blue; 
        initialTokens.green = BASE_POSITIONS.green; 
        playersInfo.blue = { name: profile.displayName, uid: user.uid, isBot: false };
        playersInfo.green = { name: "AI Bot", isBot: true };
      } else {
        initialTokens.red = BASE_POSITIONS.red; 
        initialTokens.yellow = BASE_POSITIONS.yellow; 
        playersInfo.red = { name: profile.displayName, uid: user.uid, isBot: false };
        playersInfo.yellow = { name: "Waiting...", isBot: false };
      }
    } 
    if (count >= 3 && !vsBot) { 
      initialTokens.green = BASE_POSITIONS.green; 
      playersInfo.green = { name: "Waiting...", isBot: false };
    }
    if (count === 4 && !vsBot) { 
      initialTokens.blue = BASE_POSITIONS.blue; 
      playersInfo.blue = { name: "Waiting...", isBot: false };
    }

    const orderedColors = TURN_ORDER.filter(color => initialTokens[color]);
    
    try {
      await update(ref(db, `users/${user.uid}`), { coins: profile.coins - BET_AMOUNT, gamesPlayed: profile.gamesPlayed + 1 });
      await update(ref(db, `rooms/${code}`), {
        tokens: initialTokens,
        players: playersInfo,
        activeColors: orderedColors,
        currentPlayer: orderedColors[0],
        currentRoll: 0,
        consecutiveSixes: 0,
        winner: "",
        isAnimating: false,
        botRolling: false,
        attackingToken: null,
        payoutClaimed: false,
        pot: vsBot ? (BET_AMOUNT * 2) : BET_AMOUNT,
        scores: { red: 0, green: 0, yellow: 0, blue: 0 }
      });
      setIsHost(true); 
      setRoomCode(code);
      setActiveModal(null);
    } catch (e) { setAlertMsg("Failed to connect to server."); }
  };

  const joinRoom = () => {
    if (!profile || profile.coins < BET_AMOUNT) return setAlertMsg(`Not enough coins! You need ${BET_AMOUNT} coins to join.`);
    if (joinInput.length !== 4) return setAlertMsg("Enter a valid 4-letter code");
    
    const gameRef = ref(db, `rooms/${joinInput}`);
    get(gameRef).then(async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if(data.winner) return setAlertMsg("Game already finished!");

        let assignedColor = null;
        Object.keys(data?.players || {}).forEach(color => {
          if (data.players[color]?.name === "Waiting..." && !assignedColor) assignedColor = color;
        });
        
        if (assignedColor) {
           await update(ref(db, `users/${user.uid}`), { coins: profile.coins - BET_AMOUNT, gamesPlayed: profile.gamesPlayed + 1 });
           await update(ref(db, `rooms/${joinInput}`), { pot: (data.pot || 0) + BET_AMOUNT });
           await update(ref(db, `rooms/${joinInput}/players/${assignedColor}`), { name: profile.displayName, uid: user.uid });
           
           setIsHost(false);
           setRoomCode(joinInput);
           setActiveModal(null);
        } else {
           setAlertMsg("Room is full or doesn't exist!");
        }
      } else { setAlertMsg("Room not found!"); }
    });
  };

  const leaveLobby = async () => {
    const winRef = ref(db, `users/${user.uid}`);
    const snap = await get(winRef);
    if(snap.exists()) {
      const uData = snap.val();
      await update(winRef, { 
        coins: uData.coins + BET_AMOUNT,
        gamesPlayed: Math.max(0, uData.gamesPlayed - 1)
      });
    }
    setRoomCode(null);
    setIsHost(false);
  };

  const handleForfeit = async () => {
    if (gameState && roomCode && user) {
       let myColor = null;
       Object.keys(gameState.players || {}).forEach(c => {
          if (gameState.players[c].uid === user.uid) myColor = c;
       });

       if (myColor && !gameState.winner) {
          const active = gameState.activeColors || [];
          const remaining = active.filter(c => c !== myColor);
          
          let updates = { activeColors: remaining };
          
          if (remaining.length === 1) {
             updates.winner = remaining[0]; 
          } else if (remaining.length === 0) {
             updates.winner = "Draw"; 
          } else if (gameState.currentPlayer === myColor) {
             const nextIndex = (active.indexOf(myColor) + 1) % active.length;
             updates.currentPlayer = active[nextIndex];
          }
          await update(ref(db, `rooms/${roomCode}`), updates);
       }
    }
    setRoomCode(null);
    setIsHost(false);
  };

  const handleSendChat = (e, type = 'text', payload = null) => {
    if (e) e.preventDefault();
    let textContent = ""; let audioId = null;

    if (type === 'text') {
      if (!chatMsg.trim()) return;
      textContent = chatMsg; setChatMsg("");
    } else if (type === 'voice') {
      textContent = payload.label; audioId = payload.id;
    } else if (type === 'emoji') {
      textContent = payload;
    }

    push(ref(db, `rooms/${roomCode}/chat`), { 
      sender: profile?.displayName || 'Player', text: textContent, type: type, audioId: audioId, timestamp: Date.now()
    });
  };

  const getValidMoves = (roll, currentTokens, player) => {
    const state = stateRef.current;
    if (!roll || state?.winner || state?.isAnimating || !currentTokens?.[player]) return [];
    const valid = [];
    currentTokens[player].forEach(pos => {
      const numPos = Number(pos);
      if (BASE_POSITIONS[player].includes(numPos)) { if (roll === 6) valid.push(numPos); } 
      else { const p = PATHS[player].indexOf(numPos); if (p !== -1 && p + roll < PATHS[player].length) valid.push(numPos); }
    });
    return valid;
  };

  const handleRoll = async (value) => {
    const state = stateRef.current;
    if (state?.isAnimating) return;
    
    const activePlayer = state.players?.[state.currentPlayer];
    if (!activePlayer?.isBot && activePlayer?.uid !== user.uid) return;
    
    try {
      const currentSixes = state?.consecutiveSixes || 0;
      const newSixes = value === 6 ? currentSixes + 1 : 0;

      if (newSixes === 3) {
        await update(ref(db, `rooms/${roomCode}`), { currentRoll: value, botRolling: false, consecutiveSixes: 3, isAnimating: true });
        setTimeout(async () => {
          const latestState = stateRef.current;
          const safeColors = latestState?.activeColors || ['red'];
          const nextIndex = (safeColors.indexOf(latestState?.currentPlayer) + 1) % safeColors.length;
          await update(ref(db, `rooms/${roomCode}`), { currentPlayer: safeColors[nextIndex], currentRoll: 0, consecutiveSixes: 0, isAnimating: false });
        }, 800); 
        return; 
      }

      await update(ref(db, `rooms/${roomCode}`), { currentRoll: value, botRolling: false, consecutiveSixes: newSixes });

      const tokensObj = normalizeTokens(state?.tokens);
      const playableTokens = getValidMoves(value, tokensObj, state?.currentPlayer);
      const uniqueMoves = [...new Set(playableTokens)];

      if (playableTokens.length === 0) {
         setTimeout(async () => { 
           const latestState = stateRef.current;
           if (!latestState || latestState.currentRoll !== value || latestState.currentPlayer !== state.currentPlayer) return;
           const safeColors = latestState?.activeColors || ['red'];
           const nextIndex = (safeColors.indexOf(latestState?.currentPlayer) + 1) % safeColors.length;
           await update(ref(db, `rooms/${roomCode}`), { currentPlayer: safeColors[nextIndex], currentRoll: 0, consecutiveSixes: 0 });
         }, 500); 
      } else if (uniqueMoves.length === 1) {
         const isBotTurn = state?.players?.[state?.currentPlayer]?.isBot;
         if (!isBotTurn) {
           setTimeout(() => {
             const latestState = stateRef.current;
             if (!latestState || latestState.currentRoll !== value || latestState.isAnimating) return; 
             const pos = uniqueMoves[0];
             const arrIdx = tokensObj[latestState.currentPlayer].findIndex(p => p === pos);
             handleTokenClick(latestState.currentPlayer, pos, arrIdx);
           }, 300); 
         }
      }
    } catch (error) { console.error(error); }
  };

  const handleTokenClick = async (color, index, tokenArrayIndex) => {
    const state = stateRef.current;
    if (isProcessingMove.current || !state) return; 

    const activePlayer = state.players?.[state.currentPlayer];
    if (!activePlayer?.isBot && activePlayer?.uid !== user.uid) return;

    const targetIndex = Number(index);
    const rollValue = Number(state.currentRoll || 0);
    const playableTokens = getValidMoves(rollValue, normalizeTokens(state.tokens), state.currentPlayer);
    
    if (color !== state.currentPlayer || rollValue === 0 || state.winner || state.isAnimating) return;
    if (!playableTokens.includes(targetIndex)) return; 

    isProcessingMove.current = true;
    let localTokens = normalizeTokens(state.tokens); 

    if (BASE_POSITIONS[color].includes(targetIndex) && rollValue === 6) {
      playSound('move'); 
      localTokens[color][tokenArrayIndex] = PATHS[color][0]; 
      await update(ref(db, `rooms/${roomCode}`), { isAnimating: true, tokens: localTokens });
      setTimeout(async () => {
        isProcessingMove.current = false;
        await update(ref(db, `rooms/${roomCode}`), { currentRoll: 0, isAnimating: false });
      }, 100); 
      return;
    } 
    
    const currentPath = PATHS[color];
    const targetPathIndex = currentPath.indexOf(targetIndex) + rollValue;
    let currentStepIdx = currentPath.indexOf(targetIndex);
    
    await update(ref(db, `rooms/${roomCode}`), { isAnimating: true });
    
    const moveStep = async () => {
      currentStepIdx++;
      const stepPos = currentPath[currentStepIdx];
      localTokens[color][tokenArrayIndex] = stepPos;
      
      playSound('move'); 

      if (currentStepIdx === targetPathIndex) {
        if (stepPos === 999) playSound('home');

        let cutOpponents = [];
        if (!SAFE_SPOTS.includes(stepPos) && stepPos !== 999) {
          Object.keys(localTokens).forEach(oppColor => {
            if (oppColor !== color) {
              localTokens[oppColor].forEach((oppPos, oppIdx) => {
                if (Number(oppPos) === stepPos) cutOpponents.push({ oppColor, oppIdx, pathIdx: PATHS[oppColor].indexOf(stepPos) });
              });
            }
          });
        }

        const finishTurn = async (didCut) => {
          const currentState = stateRef.current;
          const hasWonGame = localTokens[color].every(pos => Number(pos) === 999);
          const updates = { isAnimating: false, attackingToken: null };

          if (hasWonGame) {
            updates.winner = color;
            updates[`scores/${color}`] = (currentState?.scores?.[color] || 0) + 1; 
          } else {
            if (rollValue === 6 || didCut || stepPos === 999) {
              updates.currentRoll = 0; 
            } else {
              const safeColors = currentState?.activeColors || ['red'];
              const nextIndex = (safeColors.indexOf(currentState?.currentPlayer) + 1) % safeColors.length;
              updates.currentPlayer = safeColors[nextIndex];
              updates.currentRoll = 0;
              updates.consecutiveSixes = 0; 
            }
          }
          isProcessingMove.current = false;
          await update(ref(db, `rooms/${roomCode}`), updates);
        };

        if (cutOpponents.length > 0) {
          await update(ref(db, `rooms/${roomCode}`), { tokens: localTokens, attackingToken: { color, index: tokenArrayIndex } });

          setTimeout(() => {
            playSound('cut');
            const animateCuts = async () => {
              let stillMoving = false;
              cutOpponents.forEach(opp => {
                if (opp.pathIdx > 0) {
                  opp.pathIdx = Math.max(0, opp.pathIdx - 2); 
                  localTokens[opp.oppColor][opp.oppIdx] = PATHS[opp.oppColor][opp.pathIdx];
                  stillMoving = true;
                } else if (opp.pathIdx === 0) {
                  const emptyBase = BASE_POSITIONS[opp.oppColor].find(bp => !localTokens[opp.oppColor].includes(bp));
                  if (emptyBase) localTokens[opp.oppColor][opp.oppIdx] = emptyBase;
                  opp.pathIdx = -1; 
                  stillMoving = true;
                }
              });

              await update(ref(db, `rooms/${roomCode}`), { tokens: localTokens });
              if (stillMoving) setTimeout(animateCuts, 4); 
              else finishTurn(true);
            };
            animateCuts();
          }, 800); 
        } else {
          await update(ref(db, `rooms/${roomCode}`), { tokens: localTokens });
          setTimeout(() => finishTurn(false), 50);
        }
      } else {
        await update(ref(db, `rooms/${roomCode}`), { tokens: localTokens });
        setTimeout(moveStep, 16); 
      }
    };
    moveStep();
  };

  useEffect(() => {
    const state = gameState;
    if (!state || !isHost || isProcessingMove.current || state.winner || state.isAnimating) return;

    const currentPlayerKey = state.currentPlayer;
    const isBotTurn = state.players?.[currentPlayerKey]?.isBot;

    if (isBotTurn) {
      if (state.currentRoll === 0 && !state.botRolling) {
        isProcessingMove.current = true;
        update(ref(db, `rooms/${roomCode}`), { botRolling: true }).then(() => {
           setTimeout(() => {
             isProcessingMove.current = false; 
             const roll = Math.floor(Math.random() * 6) + 1;
             handleRoll(roll); 
           }, 400); 
        });
      } else if (state.currentRoll > 0 && !state.botRolling) {
        const tokensObj = normalizeTokens(state.tokens);
        const validMoves = getValidMoves(state.currentRoll, tokensObj, currentPlayerKey);
        
        if (validMoves.length > 0) {
          isProcessingMove.current = true;
          setTimeout(() => {
            let bestMove = { pos: validMoves[0], score: -1 };
            validMoves.forEach(pos => {
               let score = 0;
               const isBase = BASE_POSITIONS[currentPlayerKey].includes(pos);
               if (isBase && state.currentRoll === 6) score = 5; 
               else {
                 const pIdx = PATHS[currentPlayerKey].indexOf(pos);
                 const target = PATHS[currentPlayerKey][pIdx + state.currentRoll];
                 if (target === 999) score = 10; 
                 else if (!SAFE_SPOTS.includes(target)) {
                    Object.keys(tokensObj).forEach(opp => {
                       if (opp !== currentPlayerKey && tokensObj[opp].includes(target)) score = 8; 
                    });
                 } else { score = 2; } 
               }
               if (score > bestMove.score) bestMove = { pos, score };
            });

            const arrIdx = tokensObj[currentPlayerKey].findIndex(p => p === bestMove.pos);
            isProcessingMove.current = false; 
            handleTokenClick(currentPlayerKey, bestMove.pos, arrIdx);
          }, 400); 
        } 
      }
    }
  }, [gameState?.currentPlayer, gameState?.currentRoll, gameState?.isAnimating, gameState?.botRolling]);

  const saveProfile = () => {
    if(!user || !profile) return;
    update(ref(db, `users/${user.uid}`), { displayName: profile.displayName, gender: profile.gender, photoURL: profile.photoURL });
    setActiveModal(null);
    setAlertMsg("Profile Successfully Updated!");
  };

  if (!user) {
    return (
      <div className="login-screen">
        <CustomAlert msg={alertMsg} onClose={() => setAlertMsg(null)} />
        <div className="login-card">
          <div className="ludo-title login-logo">
            <span className="crown">👑</span><br/>
            LUDO <span>KING</span>
          </div>
          <p className="login-subtitle">Connect and claim your 1000 🪙 bonus!</p>
          <div className="login-actions">
            <button className="btn-google" onClick={loginWithGoogle}>
              <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="G" /> Sign in with Google
            </button>
            <button className="btn-guest" onClick={loginAsGuest}>
              👤 Play as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!roomCode) {
    return (
      <div className="home-container">
        <CustomAlert msg={alertMsg} onClose={() => setAlertMsg(null)} />
        
        <div className="floating-bg-item token-float-1"></div>
        <div className="floating-bg-item dice-float-1">🎲</div>
        <div className="floating-bg-item coin-float-1">🪙</div>
        
        <div className="home-header">
          <div className="home-profile" onClick={() => setActiveModal('profile')}>
            <img src={profile?.photoURL || 'https://via.placeholder.com/50'} alt="Profile" />
            <div className="home-profile-info">
              <span className="home-name">{profile?.displayName || 'Unknown Player'}</span>
              <div className="level-star">⭐ Level {Math.max(1, Math.floor((profile?.wins || 0)/2) + 1)}</div>
            </div>
          </div>
          <div className="home-coins-container">
             <div className="home-coins">
               <span className="coin-icon">🪙</span>
               <span>{profile?.coins || 0}</span>
             </div>
             <button className="btn-more-coins" onClick={() => setAlertMsg("Daily Reward: +50 Coins coming soon!")}>MORE COINS</button>
          </div>
        </div>

        <div className="home-main-logo">
          <h1 className="ludo-title animated-title">
            <span className="crown glow-pulse">👑</span><br/>
            LUDO <span>KING</span>
          </h1>
        </div>

        <div className="home-actions">
          <button className="btn-huge btn-multiplayer" onClick={() => setActiveModal('host')}>
             <span className="btn-icon">🌍</span> ONLINE MULTIPLAYER
          </button>
          <button className="btn-huge btn-computer" onClick={() => createRoom(true)}>
             <span className="btn-icon">📱</span> VS COMPUTER
          </button>
          <button className="btn-huge btn-leaderboard" onClick={() => { fetchLeaderboard(); setActiveModal('leaderboard'); }}>
             <span className="btn-icon">🏆</span> GLOBAL RANKINGS
          </button>
        </div>

        <div className="home-bottom-nav">
          <button className="nav-btn" onClick={() => setActiveModal('settings')}>
             ⚙️ Settings
          </button>
          <button className="nav-btn" onClick={() => signOut(auth)}>
             🚪 Logout
          </button>
        </div>

        {/* MODALS */}
        {activeModal === 'host' && (
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
              <button className="btn btn-join" style={{width: '100%', marginTop: '10px'}} onClick={joinRoom}>Join Game</button>
              <button className="btn-close" onClick={() => setActiveModal(null)}>Cancel</button>
            </div>
          </div>
        )}

        {activeModal === 'profile' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Player Profile</h2>
              <div className="avatar-selection-area">
                <img src={profile?.photoURL} alt="Profile" className="profile-large" />
                <p style={{fontSize: '12px', color: '#94a3b8', margin: '5px 0'}}>Select Avatar:</p>
                <div className="avatar-grid">
                  {AVATARS.map((url, i) => (
                    <img key={i} src={url} alt="avatar" className={`avatar-option ${profile?.photoURL === url ? 'selected' : ''}`} onClick={() => setProfile({...profile, photoURL: url})}/>
                  ))}
                </div>
              </div>
              <label>Nickname:</label>
              <input className="modal-input" value={profile?.displayName || ''} onChange={(e) => setProfile({...profile, displayName: e.target.value})} />
              <label>Gender:</label>
              <select className="modal-input" value={profile?.gender || 'Unspecified'} onChange={(e) => setProfile({...profile, gender: e.target.value})}>
                <option value="Unspecified">Unspecified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              {user.isAnonymous && (
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
        )}

        {activeModal === 'leaderboard' && (
          <div className="modal-overlay">
            <div className="modal-content leaderboard-modal">
              <h2>🏆 Top 50 Players</h2>
              <div className="leaderboard-list">
                {leaderboard.map((u, i) => (
                  <div key={i} className={`lb-item ${u.displayName === profile?.displayName ? 'is-me' : ''}`}>
                    <span className="lb-rank">#{i+1}</span>
                    <img src={u.photoURL || 'https://via.placeholder.com/30'} alt="pic" />
                    <span className="lb-name">{u.displayName || 'Unknown Player'}</span>
                    <span className="lb-coins">{u.coins} 🪙</span>
                  </div>
                ))}
              </div>
              <button className="btn-close" onClick={() => setActiveModal(null)}>Close</button>
            </div>
          </div>
        )}

        {activeModal === 'settings' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>⚙️ Global Settings</h2>
              <div className="settings-row">
                <span>Music Volume</span>
                <input type="range" min="0" max="1" step="0.01" value={bgmVolume} onChange={(e) => setBgmVolume(parseFloat(e.target.value))} />
              </div>
              <div className="settings-row">
                <span>Mute Music completely</span>
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
        )}

      </div>
    );
  }

  const players = gameState?.players || {};
  const isGameReady = Object.values(players).every(p => p.name !== "Waiting...");

  if (!isGameReady) {
    return (
      <div className="lobby-container">
        <CustomAlert msg={alertMsg} onClose={() => setAlertMsg(null)} />
        <div className="lobby-card waiting-card">
          <h2 className="glitch-text">ROOM: <span>{roomCode}</span></h2>
          <p className="lobby-subtitle">Share this code to invite players!</p>
          <div className="waiting-players-grid">
            {TURN_ORDER.filter(c => players[c]).map(color => {
              const p = players[color];
              const isReady = p.name !== "Waiting...";
              return (
                 <div key={color} className={`waiting-slot ${color} ${isReady ? 'ready' : ''}`}>
                    <div className="slot-avatar">{isReady ? '👤' : '⏳'}</div>
                    <div className="slot-name">{p.name}</div>
                 </div>
              )
            })}
          </div>
          <div className="spinner"></div>
          <p style={{marginTop:'20px', color:'#94a3b8', fontSize: '14px', fontWeight: 'bold'}}>Waiting for challengers...</p>
          <button className="btn btn-leave" style={{marginTop:'25px', width:'100%'}} onClick={leaveLobby}>Cancel & Refund</button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="game-wrapper">
      <CustomAlert msg={alertMsg} onClose={() => setAlertMsg(null)} />
      <div className="game-container">
        
        <div className="top-bar">
          <div className="room-header">Code: <strong>{roomCode}</strong></div>
          <div className="room-header pot-display">Pot: <strong>{gameState?.pot || 0} 🪙</strong></div>
          <button className="settings-icon-btn" onClick={() => setActiveModal('settings')}>⚙️</button>
        </div>

        <div className="board-scaler">
          <Board 
            tokens={normalizeTokens(gameState?.tokens)} 
            onTokenClick={handleTokenClick} 
            currentPlayer={currentPlayer} 
            validMoves={isAnimating ? [] : getValidMoves(currentRoll, normalizeTokens(gameState?.tokens), currentPlayer)} 
            attackingToken={attackingToken}
          />
        </div>
        
        <div className="dice-and-chat-controls">
          <Dice 
            currentRoll={currentRoll} 
            onRoll={handleRoll} 
            currentPlayer={currentPlayer} 
            currentPlayerName={players?.[currentPlayer]?.name || currentPlayer} 
            isAnimating={isAnimating} 
            isBot={players?.[currentPlayer]?.isBot || false} 
            botRolling={botRolling}
            consecutiveSixes={consecutiveSixes}
            isMyTurn={isMyTurn}
          /> 
          
          <div className="action-buttons">
            <button className="btn btn-chat-toggle" onClick={() => setIsChatOpen(true)}>💬 Open Chat</button>
            <button className="btn btn-leave" onClick={handleForfeit}>Forfeit Match</button>
          </div>
        </div>

        {winner && (
          <div className="winner-overlay">
            <h1>{players?.[winner]?.name || winner} Takes The Pot!</h1>
            {winner !== "Draw" && <p className="win-pot-text">+{gameState?.pot} 🪙</p>}
            <button className="btn btn-secondary" style={{ fontSize: '20px', padding: '15px 30px' }} onClick={() => {setRoomCode(null); setIsHost(false);}}>Return to Lobby</button>
          </div>
        )}

        {/* IN-GAME SETTINGS MODAL */}
        {activeModal === 'settings' && (
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
                <span>Sound Effects</span>
                <button className={`toggle-btn ${isSfxMuted ? 'off' : 'on'}`} onClick={() => setIsSfxMuted(!isSfxMuted)}>
                  {isSfxMuted ? 'Muted' : 'Active'}
                </button>
              </div>
              <button className="btn-close" onClick={() => setActiveModal(null)}>Done</button>
            </div>
          </div>
        )}

        {/* --- THE NEW CHAT OVERLAY --- */}
        {isChatOpen && (
          <div className="chat-overlay-backdrop">
            <div className="chat-container">
              <div className="chat-header">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span>Comms Uplink</span>
                  <button className="btn-close-chat" onClick={() => setIsChatOpen(false)}>✖</button>
                </div>
                <div className="chat-tabs">
                  <button className={`tab-btn ${chatMode === 'text' ? 'active' : ''}`} onClick={() => setChatMode('text')}>💬</button>
                  <button className={`tab-btn ${chatMode === 'voice' ? 'active' : ''}`} onClick={() => setChatMode('voice')}>🎤</button>
                  <button className={`tab-btn ${chatMode === 'emoji' ? 'active' : ''}`} onClick={() => setChatMode('emoji')}>😀</button>
                </div>
              </div>
              
              <div className="chat-messages">
                {chatList.map((msg, i) => (
                  <div key={i} className={`chat-msg ${msg.sender === profile?.displayName ? 'self' : ''} ${msg.type === 'emoji' ? 'emoji-msg' : ''}`}>
                    {msg.sender !== profile?.displayName && <div className="chat-sender">{msg.sender}</div>}
                    {msg.type === 'voice' ? (
                       <div className="voice-bubble" onClick={() => playChatVoice(msg.audioId)}>🔊 {msg.text}</div>
                    ) : ( <div>{msg.text}</div> )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {chatMode === 'text' && (
                <form className="chat-input-area" onSubmit={(e) => handleSendChat(e, 'text')}>
                  <input placeholder="Transmit message..." value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} />
                  <button type="submit">➜</button>
                </form>
              )}

              {chatMode === 'voice' && (
                <div className="chat-panel voice-panel">
                  {VOICE_PRESETS.map((preset) => (
                    <button key={preset.id} className={`voice-preset-btn ${preset.gender === 'm' ? 'male' : 'female'}`} onClick={() => handleSendChat(null, 'voice', preset)}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              {chatMode === 'emoji' && (
                <div className="chat-panel emoji-panel">
                  {EMOJIS.map((emoji, index) => (
                    <button key={index} className="emoji-preset-btn" onClick={() => handleSendChat(null, 'emoji', emoji)}>{emoji}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App;
