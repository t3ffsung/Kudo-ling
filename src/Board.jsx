import './App.css';

function Board({ tokens, onTokenClick, currentPlayer, validMoves, attackingToken }) {
  const totalCells = 225;
  const cells = Array.from({ length: totalCells });

  const getCellData = (index) => {
    const row = Math.floor(index / 15);
    const col = index % 15;

    let cornerClass = '';
    if ((row === 1 || row === 10) && (col === 1 || col === 10)) cornerClass = ' slot-tl';
    if ((row === 1 || row === 10) && (col === 4 || col === 13)) cornerClass = ' slot-tr';
    if ((row === 4 || row === 13) && (col === 1 || col === 10)) cornerClass = ' slot-bl';
    if ((row === 4 || row === 13) && (col === 4 || col === 13)) cornerClass = ' slot-br';

    // TOP LEFT (RED)
    if (row < 6 && col < 6) {
      if ((row === 1 && col === 1) || (row === 1 && col === 4) || (row === 4 && col === 1) || (row === 4 && col === 4))
        return { className: `cell slot-red white-box${cornerClass}`, content: '' };
      if (row >= 1 && row <= 4 && col >= 1 && col <= 4) return { className: 'cell white-box', content: '' };
      return { className: 'cell red base-bg', content: '' };
    }

    // TOP RIGHT (GREEN)
    if (row < 6 && col > 8) {
      if ((row === 1 && col === 10) || (row === 1 && col === 13) || (row === 4 && col === 10) || (row === 4 && col === 13))
        return { className: `cell slot-green white-box${cornerClass}`, content: '' };
      if (row >= 1 && row <= 4 && col >= 10 && col <= 13) return { className: 'cell white-box', content: '' };
      return { className: 'cell green base-bg', content: '' };
    }

    // BOTTOM LEFT (BLUE)
    if (row > 8 && col < 6) {
      if ((row === 10 && col === 1) || (row === 10 && col === 4) || (row === 13 && col === 1) || (row === 13 && col === 4))
        return { className: `cell slot-blue white-box${cornerClass}`, content: '' };
      if (row >= 10 && row <= 13 && col >= 1 && col <= 4) return { className: 'cell white-box', content: '' };
      return { className: 'cell blue base-bg', content: '' };
    }

    // BOTTOM RIGHT (YELLOW)
    if (row > 8 && col > 8) {
      if ((row === 10 && col === 10) || (row === 10 && col === 13) || (row === 13 && col === 10) || (row === 13 && col === 13))
        return { className: `cell slot-yellow white-box${cornerClass}`, content: '' };
      if (row >= 10 && row <= 13 && col >= 10 && col <= 13) return { className: 'cell white-box', content: '' };
      return { className: 'cell yellow base-bg', content: '' };
    }

    // CENTER HOME AREA
    if (row === 6 && col === 6) return { className: 'cell center-tl', content: '' };
    if (row === 6 && col === 7) return { className: 'cell green path-cell', content: '' };
    if (row === 6 && col === 8) return { className: 'cell center-tr', content: '' };
    if (row === 7 && col === 6) return { className: 'cell red path-cell', content: '' };
    if (row === 7 && col === 7) return { className: 'cell home-center', content: '★' };
    if (row === 7 && col === 8) return { className: 'cell yellow path-cell', content: '' };
    if (row === 8 && col === 6) return { className: 'cell center-bl', content: '' };
    if (row === 8 && col === 7) return { className: 'cell blue path-cell', content: '' };
    if (row === 8 && col === 8) return { className: 'cell center-br', content: '' };

    // SAFE ZONES AND COLORED PATHS
    if (row === 7 && col >= 1 && col <= 5) return { className: 'cell red path-cell', content: '' };
    if (col === 7 && row >= 1 && row <= 5) return { className: 'cell green path-cell', content: '' };
    if (col === 7 && row >= 9 && row <= 13) return { className: 'cell blue path-cell', content: '' };
    if (row === 7 && col >= 9 && col <= 13) return { className: 'cell yellow path-cell', content: '' };

    // STARTING SQUARES (With Stars)
    if (row === 6 && col === 1) return { className: 'cell red path-cell start-star', content: '★' };
    if (row === 1 && col === 8) return { className: 'cell green path-cell start-star', content: '★' };
    if (row === 13 && col === 6) return { className: 'cell blue path-cell start-star', content: '★' };
    if (row === 8 && col === 13) return { className: 'cell yellow path-cell start-star', content: '★' };

    // DIRECTIONAL ARROWS
    if (row === 7 && col === 0) return { className: 'cell path-cell arrow-red', content: '➡' };
    if (row === 0 && col === 7) return { className: 'cell path-cell arrow-green', content: '⬇' };
    if (row === 14 && col === 7) return { className: 'cell path-cell arrow-blue', content: '⬆' };
    if (row === 7 && col === 14) return { className: 'cell path-cell arrow-yellow', content: '⬅' };

    // SAFE STARS
    if (row === 2 && col === 6) return { className: 'cell safe-star path-cell', content: '★' };
    if (row === 6 && col === 12) return { className: 'cell safe-star path-cell', content: '★' };
    if (row === 8 && col === 2) return { className: 'cell safe-star path-cell', content: '★' };
    if (row === 12 && col === 8) return { className: 'cell safe-star path-cell', content: '★' };

    return { className: 'cell path-cell', content: '' };
  };

  const getTokensInCell = (index) => {
    const foundTokens = [];
    Object.keys(tokens).forEach(color => {
      const colorArray = Array.isArray(tokens[color]) ? tokens[color] : Object.values(tokens[color] || {});
      colorArray.forEach((pos, tokenIndex) => {
        if (Number(pos) === index || (index === 112 && Number(pos) === 999)) {
          foundTokens.push({ color, tokenIndex, position: Number(pos) });
        }
      });
    });
    return foundTokens;
  };

  return (
    <div className="board">
      {cells.map((_, index) => {
        const { className, content } = getCellData(index);
        const tokensHere = getTokensInCell(index);
        
        // Determine if THIS specific cell contains the attacking monster
        const cellHasMonster = tokensHere.some(t => attackingToken?.color === t.color && attackingToken?.index === t.tokenIndex);

        return (
          <div key={index} className={`${className} ${cellHasMonster ? 'has-monster' : ''}`}>
            {content}
            {tokensHere.length > 0 && (
              <div className="token-group">
                {tokensHere.map((token, i) => {
                  const isPlayable = token.color === currentPlayer && validMoves.includes(index);
                  const isMonster = attackingToken?.color === token.color && attackingToken?.index === token.tokenIndex;

                  return (
                    <div
                      key={`${token.color}-${token.tokenIndex}-${i}`}
                      className={`token ${token.color} 
                        ${tokensHere.length > 1 ? 'multiple' : 'single'} 
                        ${isPlayable ? 'valid-move' : ''}
                        ${isMonster ? 'monster' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTokenClick(token.color, Number(token.position), token.tokenIndex);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Board;