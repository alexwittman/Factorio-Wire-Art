import { IPinLayout } from "../pins/IPinLayout";
import type { ThreadResult } from "../threading/ThreadResult";

export interface IExportProcessor {
  export(results: ThreadResult[], layout: IPinLayout): void;
}
