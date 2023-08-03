export interface IJobOptions {
  batch?: number;
  time?: number;
  end?: number;
  reportPid?: number;
}

export default class Job {
  type: string;
  target: string;
  threads: number;
  batch: number | null;
  time: number | null;
  end: number | null;
  reportPid: number | null;
  constructor(type: string, target: string, threads: number, options: IJobOptions = {}) {
    this.type = type;
    this.target = target;
    this.threads = threads;
    this.batch = options.batch || null;
    this.time = options.time || null;
    this.end = options.end || null;
    this.reportPid = options.reportPid || null;
  }

  get dto() {
    return JSON.stringify(this);
  }

  static fromDto(dto: string) {
    const parsed = JSON.parse(dto);
    return new Job(parsed.type, parsed.target, parsed.threads, {
      batch: parsed.batch,
      time: parsed.time,
      end: parsed.end,
      reportPid: parsed.reportPid
    });
  }
}