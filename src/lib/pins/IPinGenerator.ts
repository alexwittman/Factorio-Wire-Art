import { IPinLayout } from "./IPinLayout";

export interface IPinGenerator {
  generate: (count: number) => AsyncGenerator<IPinLayout, IPinLayout, unknown>;
}
