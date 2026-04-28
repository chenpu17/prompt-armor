import { EventEmitter } from 'node:events';
export const bus = new EventEmitter();
bus.setMaxListeners(0);

export function emit(channel: string, event: string, data: any) {
  bus.emit(channel, { event, data, ts: Date.now() });
}
