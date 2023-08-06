import { jobType } from "/batcher/config";

export interface IJobOptions {
  batch?: number;
  reportPid?: number;
}

export default class Job {
  type: jobType;
  target: string;
  threads: number;
  batch: number | null;
  time: number;
  end: number;
  reportPid: number | null;
  constructor(type: jobType, target: string, threads: number, time: number, end: number, options: IJobOptions = {}) {
    this.type = type;
    this.target = target;
    this.threads = threads;
    this.time = time;
    this.end = end;
    this.batch = options.batch || null;
    this.reportPid = options.reportPid || null;
  }

  get dto() {
    return JSON.stringify(this);
  }

  static fromDto(dto: string) {
    const parsed = JSON.parse(dto);
    return new Job(parsed.type, parsed.target, parsed.threads, parsed.time, parsed.end, {
      batch: parsed.batch,
      reportPid: parsed.reportPid
    });
  }
}