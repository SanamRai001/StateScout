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

export interface BfsFrontierSnapshot {
  schemaVersion: 1;
  pending: readonly FrontierItem[];
  seenKeys: readonly string[];
}

function frontierKey(item: FrontierItem): string {
  return JSON.stringify([item.fromStateId, item.interaction.id]);
}

export class BfsFrontier {
  private readonly queue: FrontierItem[] = [];
  private readonly seen = new Set<string>();
  private head = 0;

  static fromSnapshot(snapshot: BfsFrontierSnapshot): BfsFrontier {
    if (
      snapshot.schemaVersion !== 1 ||
      !Array.isArray(snapshot.pending) ||
      !Array.isArray(snapshot.seenKeys)
    ) {
      throw new Error("Unsupported or invalid BFS frontier snapshot.");
    }

    const frontier = new BfsFrontier();

    for (const key of snapshot.seenKeys) {
      if (typeof key !== "string") {
        throw new Error("Invalid BFS frontier seen key.");
      }
      frontier.seen.add(key);
    }

    for (const item of snapshot.pending) {
      const key = frontierKey(item);
      if (!frontier.seen.has(key)) {
        throw new Error(
          `BFS frontier snapshot pending item missing seen key: ${key}`,
        );
      }
      frontier.queue.push(item);
    }

    return frontier;
  }

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

  exportSnapshot(): BfsFrontierSnapshot {
    return {
      schemaVersion: 1,
      pending: this.queue.slice(this.head),
      seenKeys: [...this.seen].sort(),
    };
  }

  get size(): number {
    return this.queue.length - this.head;
  }
}
