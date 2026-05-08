/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Play, ArrowLeft, Lock, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useBubbleGame } from './useBubbleGame';
import { type GameState } from '../constants';

export default function BubbleShooterApp() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [liveScore, setLiveScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [tempName, setTempName] = useState('');

  const { 
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
  } = useBubbleGame(
    gameState,
    (s) => setLiveScore(s),
    (st) => setGameState(st)
  );

  const accuracy = totalShots > 0 ? Math.round((bubblesPopped / totalShots) * 100) : 0;

  const leaderboard = [
    { name: 'Rakib Khan', score: 2500, rank: 1 },
    { name: 'Alex Rivera', score: 2150, rank: 2 },
    { name: 'Sarah Chen', score: 1980, rank: 3 },
    { name: 'John Doe', score: 1750, rank: 4 },
    { name: 'Elena Petrova', score: 1620, rank: 5 },
  ];

  const startNameEntry = () => {
    setGameState('NAME_ENTRY');
  };

  const startGame = () => {
    if (!tempName.trim()) return;
    setPlayerName(tempName);
    setGameState('LEVEL_SELECT');
  };

  const playLevel = (l: number) => {
    setScore(0);
    setLiveScore(0);
    initGrid(l);
    setGameState('PLAYING');
  };

  const restart = () => {
    setScore(0);
    setLiveScore(0);
    setGameState('PLAYING');
    initGrid(level);
  };

  return (
    <div className="min-h-screen app-bg flex flex-col items-center justify-between p-4 font-sans text-slate-100 overflow-hidden relative">
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-slate-950/20 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.h2 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-7xl font-gaming font-black text-white tracking-[0.2em] drop-shadow-[0_0_30px_rgba(59,130,246,0.8)]"
              >
                LEVEL UP
              </motion.h2>
              <p className="text-xl font-bold text-blue-400 mt-4 tracking-widest uppercase">+200 COMPLETION BONUS</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"></div>
      </div>

      <div className="watermark-text">Rakib Khan</div>
      
      {/* Header Branding */}
      <header className="w-full max-w-lg text-center mt-6 z-10">
        <h1 className="text-5xl font-black tracking-tighter text-white mb-0 uppercase leading-none">
          Rakib Khan
        </h1>
        <p className="text-sm font-light text-blue-300 uppercase tracking-[0.4em] mt-2 opacity-80">
          Bubble Shooter
        </p>
      </header>

      {/* Main Game Content Area */}
      <main className="relative flex-grow flex flex-col xl:flex-row items-start justify-center w-full max-w-[1400px] gap-6 z-10 py-6">
        
        {/* Left Side: Leaderboard */}
        <aside className="hidden xl:flex flex-col gap-4 w-72 h-[580px]">
          <div className="glass flex-1 p-6 rounded-3xl flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Trophy className="text-yellow-500" size={20} />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Leaderboard</h3>
            </div>
            <div className="flex flex-col gap-3">
              {leaderboard.map((player) => (
                <div key={player.rank} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${
                      player.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : 
                      player.rank === 2 ? 'bg-slate-300/20 text-slate-300' : 
                      player.rank === 3 ? 'bg-amber-600/20 text-amber-600' : 'bg-white/10 text-slate-400'
                    }`}>
                      {player.rank}
                    </span>
                    <span className="text-xs font-medium text-slate-200">{player.name}</span>
                  </div>
                  <span className="text-xs font-bold text-blue-400">{player.score}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-white/10">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Your Rank</span>
                  <span className="text-xs font-medium text-white">{playerName || 'Guest'}</span>
                </div>
                <span className="text-xs font-bold text-white">#--</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Game Canvas Container */}
        <div className="relative glass rounded-3xl p-1 shadow-2xl mx-auto xl:mx-0">
          <AnimatePresence mode="wait">
            {gameState === 'MENU' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0f1e]/95 backdrop-blur-xl rounded-[1.4rem]"
              >
                <div className="text-center p-8 w-full">
                  <div className="w-40 h-40 mx-auto mb-8 relative">
                    {/* Gold Border Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#8A6E2F] via-[#D4AF37] to-[#F9E498] p-[4px] shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                      <div className="w-full h-full rounded-full border-2 border-[#5C4A1F] bg-slate-900 overflow-hidden relative">
                        <img
                          src="/rakib.jpg"
                          alt="Rakib Khan"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop";
                          }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-5xl font-gaming font-black mb-10 text-white tracking-[0.15em] drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse">
                    MISSION START
                  </h2>
                  
                  <button
                    onClick={startNameEntry}
                    className="px-12 py-3 bg-[#1D4ED8] text-white rounded-[10px] font-semibold text-lg hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                  >
                    Start Game
                  </button>
                </div>
              </motion.div>
            )}

            {gameState === 'NAME_ENTRY' && (
              <motion.div
                key="name-entry"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 backdrop-blur-xl rounded-[1.4rem]"
              >
                <button 
                  onClick={() => setGameState('MENU')}
                  className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <div className="text-center p-8 w-full max-w-xs">
                  <h3 className="text-2xl font-bold mb-6 text-white uppercase tracking-tight">Enter Your Name</h3>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter Name..."
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-4 text-white text-center focus:outline-none focus:border-blue-500 transition-colors mb-6 shadow-2xl"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && startGame()}
                  />
                  <button
                    onClick={startGame}
                    disabled={!tempName.trim()}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {gameState === 'LEVEL_SELECT' && (
              <motion.div
                key="level-select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0f1e]/90 backdrop-blur-xl rounded-[1.4rem] p-8"
              >
                <div className="text-center w-full max-w-md">
                  <h3 className="text-3xl font-gaming font-black mb-8 text-white uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    SELECT MISSION
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {[1, 2, 3, 4, 5, 6].map((l) => {
                      const isUnlocked = unlockedLevels.includes(l);
                      return (
                        <motion.button
                          key={l}
                          whileHover={isUnlocked ? { scale: 1.05 } : {}}
                          whileTap={isUnlocked ? { scale: 0.95 } : {}}
                          onClick={() => isUnlocked && playLevel(l)}
                          className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all group overflow-hidden ${
                            isUnlocked 
                              ? 'border-blue-500/50 bg-blue-500/10 hover:border-blue-400 hover:bg-blue-500/20' 
                              : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {!isUnlocked && <Lock size={16} className="text-slate-500 mb-1" />}
                          <span className={`text-base font-black ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                            {l < 10 ? `0${l}` : l}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isUnlocked ? 'text-blue-400' : 'text-slate-600'}`}>
                            Level
                          </span>
                          
                          {isUnlocked && (
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight size={14} className="text-blue-400" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => setGameState('NAME_ENTRY')}
                    className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold mx-auto"
                  >
                    <ArrowLeft size={16} /> Change Profile
                  </button>
                </div>
              </motion.div>
            )}

            {(gameState === 'GAME_OVER' || gameState === 'WIN') && (
              <motion.div
                key="end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6 rounded-2xl"
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${gameState === 'WIN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {gameState === 'WIN' ? <Trophy className="w-8 h-8" /> : <RefreshCw className="w-8 h-8" />}
                  </div>
                  <h2 className="text-2xl font-bold mb-2 uppercase tracking-wide text-white">
                    {gameState === 'WIN' ? 'Rakib Khan - You Win!' : 'Rakib Khan - Game Over'}
                  </h2>
                  <p className="text-slate-400 mb-2">{playerName}'s Score</p>
                  <p className="text-slate-400 mb-8"><span className="font-bold text-white text-3xl block py-2">{score}</span></p>
                  <button
                    onClick={restart}
                    className="w-full py-4 bg-slate-100 text-slate-950 rounded-xl font-bold hover:bg-white transition-all shadow-lg flex items-center justify-center"
                  >
                    <RefreshCw size={24} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <canvas
            ref={canvasRef}
            width={470}
            height={580}
            onMouseMove={handleMouseMove}
            onClick={shoot}
            onTouchStart={shoot}
            className="cursor-crosshair block"
          />
        </div>

        {/* Right Side: Stats Panel */}
        <aside className="flex flex-row xl:flex-col gap-4 w-full xl:w-72 h-auto xl:h-[580px]">
          {gameState !== 'MENU' && gameState !== 'NAME_ENTRY' && (
            <div className="glass flex-1 p-6 flex flex-col gap-6 rounded-3xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <RefreshCw className="text-blue-500 animate-spin-slow" size={20} />
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Live Stats</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest opacity-60 block mb-1">
                      Mission
                    </span>
                    <span className="text-xl font-black text-white">LEVEL {level < 10 ? `0${level}` : level}</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Trophy size={18} className="text-blue-400" />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest opacity-60 block mb-1">
                    Score
                  </span>
                  <span className="text-3xl font-black text-white">{liveScore.toString().padStart(4, '0')}</span>
                </div>

                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest opacity-60 block mb-1">
                    Bubbles Popped
                  </span>
                  <span className="text-2xl font-black text-white">{bubblesPopped}</span>
                </div>

                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest opacity-60 block mb-1">
                    Accuracy
                  </span>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-white">{accuracy}%</span>
                    <div className="flex-grow h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${accuracy}%` }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center pt-6">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest opacity-60 block mb-3">
                    Next Bubble
                  </span>
                  <motion.div 
                    key={nextColor}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-14 h-14 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden ring-1 ring-white/10"
                    style={{ 
                      background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${nextColor} 15%, #000000 100%)`,
                    }}
                  >
                    <div className="absolute top-[5%] left-[5%] w-[50%] h-[40%] bg-gradient-to-br from-white/70 to-transparent rounded-full rotate-[-45deg] filter blur-[0.5px]" />
                    <div className="absolute bottom-[10%] right-[10%] w-[20%] h-[20%] bg-white/10 rounded-full filter blur-sm" />
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          <div className="glass p-4 rounded-3xl flex items-center justify-center xl:mt-auto">
            <button
              onClick={restart}
              disabled={gameState === 'NAME_ENTRY' || gameState === 'MENU'}
              className="w-full py-4 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Restart Mission
            </button>
          </div>
        </aside>
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-lg text-center pb-6 text-slate-500 z-10 border-t border-white/5 pt-4">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase">
          Developed by <span className="text-slate-300 font-bold">Rakib Khan</span>
        </p>
      </footer>
    </div>
  );
}
