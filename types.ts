export enum FunctionType {
  LinearOrigin = 'LINEAR_ORIGIN', // y = ax
  LinearAffine = 'LINEAR_AFFINE', // y = ax + b
  Quadratic = 'QUADRATIC'         // y = ax²
}

export interface FunctionParams {
  a: number;
  b: number; // For y=ax, b is 0. For y=ax², b is 0 (in this context)
}

export interface Point {
  x: number;
  y: number;
  label?: string;
}

export interface AppState {
  step: 'MENU' | 'INPUT' | 'RESULT';
  funcType: FunctionType | null;
  params: FunctionParams;
  xValues: number[];
  points: Point[];
}

export const COLORS = {
  primary: '#8B5A2B', // Brown
  secondary: '#B22222', // Red
  accent: '#FFD700', // Gold
  warning: '#FF0000', // Bright Red
  text: '#FFFFFF',
  background: '#FFF8E1' // Light cream for inner content
};