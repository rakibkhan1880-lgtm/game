/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const BUBBLE_RADIUS = 18;
export const SHOT_SPEED = 12;
export const ROWS = 12;
export const COLS = 13;

export const BUBBLE_COLORS = [
  '#FF3B30', // Crystal Red
  '#2ECC71', // Crystal Green
  '#3498DB', // Crystal Blue
  '#F1C40F', // Crystal Yellow
  '#E67E22', // Crystal Orange
  '#9B59B6', // Crystal Purple
  '#1ABC9C', // Crystal Turquoise
];

export type GameState = 'MENU' | 'NAME_ENTRY' | 'LEVEL_SELECT' | 'PLAYING' | 'GAME_OVER' | 'WIN';

export interface Bubble {
  id: string;
  x: number;
  y: number;
  color: string;
  row: number;
  col: number;
  isPopping?: boolean;
  isFalling?: boolean;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}
