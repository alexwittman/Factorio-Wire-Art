import type { ThreadColor } from "./ThreadColorTheme";

export type ThreadResult = {
  color: ThreadColor;
  sequence: Array<[number, number]>;
};
