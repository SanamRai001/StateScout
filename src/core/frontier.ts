import type {
  Interaction,
  StateId,
  StatePath,
} from "./model.ts";

export interface FrontierItem {
  fromStateId: StateId;
  interaction: Interaction;
  replayPath: StatePath;
}

function frontierKey(item: FrontierItem): string {
  return JSON.stringify([item.fromStateId, item.interaction.id]);
}

export class BfsFrontier {
  private readonly queue: FrontierItem[] = [];
  private readonly seen = new Set<string>();
  private head = 0;

  enqueue(item: FrontierItem): boolean {
    const key = frontierKey(item);

    if (this.seen.has(key)) {
      return false;
    }

    this.seen.add(key);
    this.queue.push(item);
    return true;
  }

  dequeue(): FrontierItem | undefined {
    const item = this.queue[this.head];

    if (item === undefined) {
      return undefined;
    }

    this.head += 1;

    if (this.head > 128 && this.head * 2 > this.queue.length) {
      this.queue.splice(0, this.head);
      this.head = 0;
    }

    return item;
  }

  hasSeen(fromStateId: StateId, interactionId: string): boolean {
    return this.seen.has(JSON.stringify([fromStateId, interactionId]));
  }

  get size(): number {
    return this.queue.length - this.head;
  }
}
