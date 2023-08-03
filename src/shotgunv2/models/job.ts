export interface IJobOptions {
  batch?: number;
  time?: number;
  end?: number;
}

export default class Job {
  type: string;
  target: string;
  threads: number;
  batch: number | null;
  time: number | null;
  end: number | null;
  constructor(type: string, target: string, threads: number, options: IJobOptions = {}) {
    this.type = type;
    this.target = target;
    this.threads = threads;
    this.batch = options.batch || null;
    this.time = options.time || null;
    this.end = options.end || null;
  }

  get dto() {
    return JSON.stringify(this);
  }
}