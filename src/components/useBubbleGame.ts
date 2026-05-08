/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BUBBLE_RADIUS, SHOT_SPEED, ROWS, COLS, BUBBLE_COLORS, type Bubble, type Projectile, type GameState } from '../constants';

interface FallingBubble {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  opacity: number;
}

export function useBubbleGame(
  currentGameState: GameState,
  onScoreUpdate: (score: number) => void,
  onGameStateChange: (state: GameState) => void
) {
  const [grid, setGrid] = useState<(Bubble | null)[][]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [totalShots, setTotalShots] = useState(0);
  const [bubblesPopped, setBubblesPopped] = useState(0);
  const [currentProjectile, setCurrentProjectile] = useState<Projectile | null>(null);
  const [currentColor, setCurrentColor] = useState(BUBBLE_COLORS[0]);
  const [nextColor, setNextColor] = useState(BUBBLE_COLORS[0]);
  const [shooterAngle, setShooterAngle] = useState(Math.PI / 2);
  const fallingBubblesRef = useRef<FallingBubble[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);

  const getBubbleCenter = (row: number, col: number) => {
    const x = col * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + (row % 2 === 1 ? BUBBLE_RADIUS : 0);
    const y = row * (BUBBLE_RADIUS * 1.7) + BUBBLE_RADIUS;
    return { x, y };
  };

  const getGridPosition = (x: number, y: number) => {
    const row = Math.round((y - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 1.7));
    const colOffset = row % 2 === 1 ? BUBBLE_RADIUS : 0;
    const col = Math.round((x - BUBBLE_RADIUS - colOffset) / (BUBBLE_RADIUS * 2));
    return { row, col };
  };

  const getTargetScore = (l: number) => 500 + (l - 1) * 200;

  const getRandomColorForLevel = (l: number) => {
    const colorCount = Math.min(BUBBLE_COLORS.length, 3 + l);
    const colors = BUBBLE_COLORS.slice(0, colorCount);
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const initGrid = useCallback((targetLevel: number = 1) => {
    setLevel(targetLevel);
    const rowsToFill = Math.min(ROWS - 6, 4 + targetLevel);
    const newGrid: (Bubble | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    for (let r = 0; r < rowsToFill; r++) {
      for (let c = 0; c < COLS; c++) {
        if (r % 2 === 1 && c === COLS - 1) continue;
        const { x, y } = getBubbleCenter(r, c);
        newGrid[r][c] = {
          id: `${r}-${c}-${Math.random()}`,
          x,
          y,
          color: getRandomColorForLevel(targetLevel),
          row: r,
          col: c,
        };
      }
    }
    setGrid(newGrid);
    setTotalShots(0);
    setBubblesPopped(0);
    setCurrentColor(getRandomColorForLevel(targetLevel));
    setNextColor(getRandomColorForLevel(targetLevel));
  }, []);

  const getNeighbors = (row: number, col: number) => {
    const neighbors: { row: number; col: number }[] = [];
    const evenRows = [
      [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
    ];
    const oddRows = [
      [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
    ];
    const offsets = row % 2 === 0 ? evenRows : oddRows;

    for (const [dr, dc] of offsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        neighbors.push({ row: nr, col: nc });
      }
    }
    return neighbors;
  };

  const findMatches = (row: number, col: number, color: string, currentGrid: (Bubble | null)[][]) => {
    const matches: { row: number; col: number }[] = [{ row, col }];
    const visited = new Set<string>();
    visited.add(`${row}-${col}`);
    const queue = [{ row, col }];

    while (queue.length > 0) {
      const { row: r, col: c } = queue.shift()!;
      for (const neighbor of getNeighbors(r, c)) {
        if (!currentGrid[neighbor.row]) continue;
        const nb = currentGrid[neighbor.row][neighbor.col];
        const id = `${neighbor.row}-${neighbor.col}`;
        if (nb && nb.color === color && !visited.has(id)) {
          visited.add(id);
          matches.push(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return matches;
  };

  const findFloating = (currentGrid: (Bubble | null)[][]) => {
    const connectedToTop = new Set<string>();
    const queue: { row: number; col: number }[] = [];

    // All top row bubbles are connected
    if (currentGrid[0]) {
      for (let c = 0; c < COLS; c++) {
        if (currentGrid[0][c]) {
          connectedToTop.add(`0-${c}`);
          queue.push({ row: 0, col: c });
        }
      }
    }

    while (queue.length > 0) {
      const { row: r, col: c } = queue.shift()!;
      for (const neighbor of getNeighbors(r, c)) {
        if (!currentGrid[neighbor.row]) continue;
        const nb = currentGrid[neighbor.row][neighbor.col];
        const id = `${neighbor.row}-${neighbor.col}`;
        if (nb && !connectedToTop.has(id)) {
          connectedToTop.add(id);
          queue.push(neighbor);
        }
      }
    }

    const floating: { row: number; col: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (!currentGrid[r]) continue;
      for (let c = 0; c < COLS; c++) {
        if (currentGrid[r][c] && !connectedToTop.has(`${r}-${c}`)) {
          floating.push({ row: r, col: c });
        }
      }
    }
    return floating;
  };

  const checkCollision = (projectile: Projectile, currentGrid: (Bubble | null)[][]) => {
    for (let r = 0; r < ROWS; r++) {
      if (!currentGrid[r]) continue;
      for (let c = 0; c < COLS; c++) {
        const bubble = currentGrid[r][c];
        if (bubble) {
          const dx = projectile.x - bubble.x;
          const dy = projectile.y - bubble.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BUBBLE_RADIUS * 1.8) return true;
        }
      }
    }
    return projectile.y < BUBBLE_RADIUS;
  };

  const calculateTrajectory = (startX: number, startY: number, angle: number, currentGrid: (Bubble | null)[][]) => {
    const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
    let currX = startX;
    let currY = startY;
    let vx = Math.cos(angle) * SHOT_SPEED;
    let vy = Math.sin(angle) * SHOT_SPEED;
    
    const canvas = canvasRef.current;
    if (!canvas) return points;

    const maxSteps = 200;
    const stepSize = 5;
    
    const tempProjectile: Projectile = { x: currX, y: currY, vx, vy, color: '' };

    for (let i = 0; i < maxSteps; i++) {
      const nextX = currX + (vx / SHOT_SPEED) * stepSize;
      const nextY = currY + (vy / SHOT_SPEED) * stepSize;
      
      tempProjectile.x = nextX;
      tempProjectile.y = nextY;

      // Wall bounce
      if (nextX < BUBBLE_RADIUS || nextX > canvas.width - BUBBLE_RADIUS) {
        vx *= -1;
        points.push({ x: nextX, y: nextY });
      }

      if (checkCollision(tempProjectile, currentGrid) || nextY < BUBBLE_RADIUS) {
        points.push({ x: nextX, y: nextY });
        break;
      }

      currX = nextX;
      currY = nextY;
      
      // Limit number of segments
      if (points.length > 5) break; 
    }
    
    points.push({ x: currX, y: currY });
    return points;
  };

  const drawTrajectory = (ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) => {
    if (points.length < 2) return;
    
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const handleImpact = (projectile: Projectile) => {
    setGrid(prevGrid => {
      const { row, col } = getGridPosition(projectile.x, projectile.y);
      if (row >= ROWS || row < 0 || col < 0 || col >= COLS || !prevGrid[row]) {
         onGameStateChange('GAME_OVER');
         return prevGrid;
      }

      const newGrid = prevGrid.map(r => [...r]);
      const { x, y } = getBubbleCenter(row, col);
      newGrid[row][col] = {
        id: `${row}-${col}-${Math.random()}`,
        x,
        y,
        color: projectile.color,
        row,
        col
      };

      const matches = findMatches(row, col, projectile.color, newGrid);
      if (matches.length >= 3) {
        // Collect bubbles for falling animation
        const toPop: { row: number; col: number }[] = [...matches];
        
        matches.forEach(m => {
          newGrid[m.row][m.col] = null;
        });
        
        const floating = findFloating(newGrid);
        floating.forEach(f => {
          toPop.push(f);
          newGrid[f.row][f.col] = null;
        });

        // Add falling bubbles
        toPop.forEach(p => {
          const bubble = prevGrid[p.row][p.col] || (p.row === row && p.col === col ? newGrid[p.row][p.col] : null);
          if (bubble) {
            fallingBubblesRef.current.push({
              id: bubble.id,
              x: bubble.x,
              y: bubble.y,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 5,
              color: bubble.color,
              opacity: 1
            });
          }
        });

        const totalPopped = matches.length + floating.length;
        setBubblesPopped(prev => prev + totalPopped);
        const points = totalPopped * 10 + (floating.length > 0 ? floating.length * 20 : 0);
        
        setScore(s => {
          const nextScore = s + points;
          const targetScore = getTargetScore(level);
          
          if (nextScore >= targetScore && level < 10) {
            // Level Up!
            const bonus = 200;
            const finalScore = nextScore + bonus;
            setShowLevelUp(true);
            setTimeout(() => {
              setShowLevelUp(false);
              const nextLevel = level + 1;
              setLevel(nextLevel);
              setUnlockedLevels(prev => [...new Set([...prev, nextLevel])]);
              initGrid(nextLevel);
            }, 2000);
            
            onScoreUpdate(finalScore);
            return finalScore;
          }
          
          onScoreUpdate(nextScore);
          return nextScore;
        });

        // Check Win (all cleared)
        const isWin = newGrid.every(row => row.every(b => b === null));
        if (isWin) {
          // Grant level transition even if score didn't reach it? 
          // User said "reached specific score OR clears all bubbles"
          const bonus = 200;
          setScore(s => {
            const finalScore = s + bonus;
            onScoreUpdate(finalScore);
            return finalScore;
          });
          setShowLevelUp(true);
          setTimeout(() => {
            setShowLevelUp(false);
            const nextLevel = level + 1;
            setLevel(nextLevel);
            setUnlockedLevels(prev => [...new Set([...prev, nextLevel])]);
            initGrid(nextLevel);
          }, 2000);
        }

      } else {
        // Check Game Over (if bubbles reached bottom)
        if (row >= ROWS - 1) {
            onGameStateChange('GAME_OVER');
        }
      }

      return newGrid;
    });
    setCurrentProjectile(null);
  };

  const shoot = (e: React.MouseEvent | React.TouchEvent) => {
    if (currentProjectile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const originX = canvas.width / 2;
    const originY = canvas.height - 40;

    const dx = mouseX - originX;
    const dy = mouseY - originY;
    const angle = Math.atan2(dy, dx);

    setTotalShots(prev => prev + 1);

    setCurrentProjectile({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * SHOT_SPEED,
      vy: Math.sin(angle) * SHOT_SPEED,
      color: currentColor
    });

    // Cycle colors
    setCurrentColor(nextColor);
    setNextColor(getRandomColorForLevel(level));
  };

  const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number = BUBBLE_RADIUS - 1, opacity: number = 1) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Outer glow for that "crystal" look
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    
    // Create main radial gradient for 3D effect
    // Shift gradient center slightly to simulate light source (top-left)
    const gradient = ctx.createRadialGradient(
      x - radius * 0.35, 
      y - radius * 0.35, 
      radius * 0.05, 
      x, 
      y, 
      radius
    );
    
    gradient.addColorStop(0, '#FFFFFF');     // Absolute peak highlight
    gradient.addColorStop(0.2, color);       // Pure vibrant color
    gradient.addColorStop(0.8, color);       // Hold the color
    gradient.addColorStop(1, 'rgba(0,0,0,0.4)'); // Deep shadow at edge
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Reset shadow for internal details
    ctx.shadowBlur = 0;
    
    // Glassy highlight (sheen) on top-left - more crisp
    ctx.beginPath();
    ctx.ellipse(
      x - radius * 0.4, 
      y - radius * 0.4, 
      radius * 0.35, 
      radius * 0.2, 
      -Math.PI / 4, 
      0, 
      Math.PI * 2
    );
    const highlightGradient = ctx.createLinearGradient(
      x - radius * 0.7, 
      y - radius * 0.7, 
      x - radius * 0.1, 
      y - radius * 0.1
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.fill();

    // Subtle bottom-right reflection for extra depth
    ctx.beginPath();
    ctx.arc(x + radius * 0.3, y + radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gravity = 0.35;
    const bounceFactor = 0.6;

    const update = () => {
      if (currentProjectile) {
        let nextX = currentProjectile.x + currentProjectile.vx;
        let nextY = currentProjectile.y + currentProjectile.vy;

        // Bounce walls
        if (nextX < BUBBLE_RADIUS || nextX > canvas.width - BUBBLE_RADIUS) {
          currentProjectile.vx *= -1;
          nextX = currentProjectile.x + currentProjectile.vx;
        }

        currentProjectile.x = nextX;
        currentProjectile.y = nextY;

        if (checkCollision(currentProjectile, grid)) {
          handleImpact(currentProjectile);
        } else if (currentProjectile.y < 0) {
           setCurrentProjectile(null);
        }
      }

      // Update falling bubbles
      fallingBubblesRef.current.forEach((fb, index) => {
        fb.vy += gravity;
        fb.x += fb.vx;
        fb.y += fb.vy;
        fb.opacity -= 0.01;

        // Bounce on sides
        if (fb.x < BUBBLE_RADIUS || fb.x > canvas.width - BUBBLE_RADIUS) {
          fb.vx *= -bounceFactor;
          fb.x = fb.x < BUBBLE_RADIUS ? BUBBLE_RADIUS : canvas.width - BUBBLE_RADIUS;
        }

        // Remove if off screen or invisible
        if (fb.y > canvas.height + BUBBLE_RADIUS || fb.opacity <= 0) {
          fallingBubblesRef.current.splice(index, 1);
        }
      });

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Watermark
      ctx.save();
      ctx.font = 'bold 40px Inter';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.textAlign = 'center';
      ctx.fillText('Rakib Khan', canvas.width / 2, canvas.height / 2);
      ctx.restore();

      // Draw Grid
      grid.forEach(row => {
        row.forEach(bubble => {
          if (bubble) {
            drawBubble(ctx, bubble.x, bubble.y, bubble.color);
          }
        });
      });

      // Draw Falling Bubbles
      fallingBubblesRef.current.forEach(fb => {
        drawBubble(ctx, fb.x, fb.y, fb.color, BUBBLE_RADIUS - 1, fb.opacity);
      });

      // Draw Projectile
      if (currentProjectile) {
        drawBubble(ctx, currentProjectile.x, currentProjectile.y, currentProjectile.color);
      } else if (currentGameState !== 'MENU' && currentGameState !== 'NAME_ENTRY') {
        // Draw Trajectory Guide when not shooting
        const originX = canvas.width / 2;
        const originY = canvas.height - 40;
        const points = calculateTrajectory(originX, originY, shooterAngle, grid);
        drawTrajectory(ctx, points);
      }

      // Draw Shooter
      if (currentGameState !== 'MENU' && currentGameState !== 'NAME_ENTRY') {
        const originX = canvas.width / 2;
        const originY = canvas.height - 40;
        ctx.save();
        ctx.translate(originX, originY);
        ctx.rotate(shooterAngle);
        
        // Arrow/Pointer
        ctx.beginPath();
        ctx.moveTo(20, -5);
        ctx.lineTo(40, 0);
        ctx.lineTo(20, 5);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();

        ctx.restore();

        // Base bubble
        drawBubble(ctx, originX, originY, currentColor, BUBBLE_RADIUS + 5);
        ctx.beginPath();
        ctx.arc(originX, originY, BUBBLE_RADIUS + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
      }

      gameLoopRef.current = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [grid, currentProjectile, shooterAngle, currentColor, nextColor, currentGameState]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - canvas.width / 2;
    const dy = y - (canvas.height - 40);
    setShooterAngle(Math.atan2(dy, dx));
  };

  return { 
    canvasRef, 
    initGrid, 
    score, 
    setScore,
    level, 
    setLevel,
    unlockedLevels, 
    showLevelUp, 
    nextColor, 
    shoot, 
    handleMouseMove, 
    totalShots, 
    bubblesPopped 
  };
}
