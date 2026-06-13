import { useState, useRef, useEffect } from 'react';
import './App.css';

const playRollSound = () => {
  try {
    const audio = new Audio('/dice-roll.mp3');
    audio.playbackRate = 1.8; 
    audio.play().catch(e => console.log("Audio play failed. Ensure dice-roll.mp3 is in the public folder:", e));
  } catch (e) { 
    console.log(e); 
  }
};

function Dice({ currentRoll, onRoll, currentPlayer, currentPlayerName, isAnimating, isBot, botRolling, consecutiveSixes, isMyTurn }) {
  const [localIsRolling, setLocalIsRolling] = useState(false);
  const clickLock = useRef(false);

  useEffect(() => {
    if (botRolling) {
      playRollSound();
    }
  }, [botRolling]);

  const isCurrentlyRolling = localIsRolling || botRolling;
  const hasRolled = currentRoll > 0;
  
  // Also disable if it's not the local user's turn
  const isDisabled = isCurrentlyRolling || hasRolled || isAnimating || isBot || (!isMyTurn && !isBot);

  const rollDice = () => {
    if (isDisabled || clickLock.current) return; 
    
    clickLock.current = true;
    setLocalIsRolling(true);
    playRollSound();

    setTimeout(() => {
      const newValue = Math.floor(Math.random() * 6) + 1;
      onRoll(newValue); 
      setLocalIsRolling(false);
      clickLock.current = false;
    }, 250); 
  };

  let statusText = "Click the dice to roll!";
  
  if (consecutiveSixes === 3) {
    statusText = "Three 6s! Turn Skipped!";
  } else if (isBot) {
    if (botRolling) statusText = `${currentPlayerName} is rolling...`;
    else if (hasRolled) statusText = `${currentPlayerName} is moving...`;
    else statusText = `${currentPlayerName} is thinking...`;
  } else if (!isMyTurn) {
    statusText = `Waiting for ${currentPlayerName}...`;
  } else {
    if (localIsRolling) statusText = "Rolling...";
    else if (isAnimating) statusText = "Piece is moving...";
    else if (hasRolled) statusText = "Make your move!";
  }

  const renderDots = (roll) => {
    if (!roll) return <div className="dot center"></div>; 
    
    const dots = [];
    if (roll === 1) {
        dots.push(<div key={1} className="dot center"></div>);
    } else if (roll === 2) {
        dots.push(<div key={1} className="dot top-left"></div>, <div key={2} className="dot bottom-right"></div>);
    } else if (roll === 3) {
        dots.push(<div key={1} className="dot top-left"></div>, <div key={2} className="dot center"></div>, <div key={3} className="dot bottom-right"></div>);
    } else if (roll === 4) {
        dots.push(<div key={1} className="dot top-left"></div>, <div key={2} className="dot top-right"></div>, <div key={3} className="dot bottom-left"></div>, <div key={4} className="dot bottom-right"></div>);
    } else if (roll === 5) {
        dots.push(<div key={1} className="dot top-left"></div>, <div key={2} className="dot top-right"></div>, <div key={3} className="dot center"></div>, <div key={4} className="dot bottom-left"></div>, <div key={5} className="dot bottom-right"></div>);
    } else if (roll === 6) {
        dots.push(<div key={1} className="dot top-left"></div>, <div key={2} className="dot top-right"></div>, <div key={3} className="dot middle-left"></div>, <div key={4} className="dot middle-right"></div>, <div key={5} className="dot bottom-left"></div>, <div key={6} className="dot bottom-right"></div>);
    }
    return dots;
  };

  return (
    <div className="dice-wrapper">
      <h2 style={{ color: currentPlayer === 'yellow' ? '#fbbf24' : (currentPlayer==='blue' ? '#38bdf8' : currentPlayer), textTransform: 'capitalize', margin: '10px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
        {currentPlayerName}'s Turn
      </h2>
      
      <div 
        className={`real-dice ${isCurrentlyRolling ? 'rolling' : ''}`} 
        onClick={rollDice}
        style={{ opacity: isDisabled && !isCurrentlyRolling ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
      >
        {isCurrentlyRolling ? renderDots(Math.floor(Math.random() * 6) + 1) : renderDots(currentRoll)}
      </div>

      <div className="dice-status" style={{ color: consecutiveSixes === 3 ? '#ef4444' : '#94a3b8' }}>
        {statusText}
      </div>
    </div>
  );
}

export default Dice;