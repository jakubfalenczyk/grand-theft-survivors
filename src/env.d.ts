/// <reference types="vite/client" />
import type { DebugBridge } from './shared/contracts.ts';
declare global {
  interface Window {
    readonly __gameDebug?: DebugBridge;
  }
}
