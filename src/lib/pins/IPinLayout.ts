export interface IPoint2D {
  x: number;
  y: number;
}

export interface IPinLayout {
  pins: IPoint2D[];
  adjacencies: number[][];
}
