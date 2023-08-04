import { NS } from "@ns";
import Attacker from "/batcher/models/attacker";
import Job from "/batcher/models/job";
import { ramCosts, scriptNames, weakenHeadroom } from "/batcher/config";
import { maxPrepCost } from "/batcher/config";

const scriptSize = ramCosts.grow;


export default class Swarm {
  ns: NS;
  attackers: Attacker[];
  constructor(ns: NS) {
    this.ns = ns;
    this.attackers = ['home', ...ns.getPurchasedServers()].map(hostname => new Attacker(hostname));
  }

  getFree() {
    this.refresh();
    return this.attackers.reduce((curr, acc) => curr + acc.free, 0);
  }

  hasEnoughRam(jobs: Job[]) {
    const size = jobs.reduce((acc, job) => job.threads * ramCosts[job.type], 0);
    return this.getBlocks(size).length > 0;
  }

  deploy(jobs: Job[]) {
    const pids: number[] = [];
    for (const job of jobs) {
      this.refresh();
      pids.push(this.run(job));
    }
    return pids;
  }

  deployPrep(jobs: Job[], limitRamUsage = false): number[] {
    const pids: number[] = [];
    const initialWeakenJob = jobs.shift();
    if (initialWeakenJob === undefined) throw Error("Prep with no jobs?");

    if (initialWeakenJob.threads > 0) {
      const actualThreads = this.limitThreads(initialWeakenJob.threads, limitRamUsage);
      if (actualThreads > 0) {
        pids.push(this.run(initialWeakenJob, actualThreads));
      }
      if (actualThreads < initialWeakenJob.threads) return pids;
    }
    this.refresh();
    while (!this.hasEnoughRam(jobs)) {
      jobs[0].threads -= 1;
      jobs[1].threads = Math.ceil(weakenHeadroom * ((jobs[0].threads * 0.004) / 0.05));
    }
    pids.push(...this.deploy(jobs));

    return pids;
  }

  private getBlocks(minSize = 0) {
    this.refresh();
    return this.attackers.map(a => a.free).filter(f => f >= minSize);
  }
  
  private refresh() {
    for (const attacker of this.attackers) attacker.refresh(this.ns);
    this.attackers = this.attackers.sort((a, b) => a.free - b.free);
  }

  private run(job: Job, threadsOverride: number | null = null): number {
    const threads = threadsOverride || job.threads;
    const attacker = this.attackers.filter(a => a.free > ramCosts[job.type] * job.threads)[0];
    if (!attacker) throw Error("Failed to find attacker for job?");
    const pid = this.ns.exec(scriptNames[job.type], attacker.hostname, { temporary: true, threads }, job.dto);
    if (pid === 0) throw Error("Failed to launch script?");

    return pid;
  }

  private limitThreads(requestedThreads: number, limitRamUsage: boolean) {
    const maxAllowedMemoryUsage = limitRamUsage ? this.getFree() * maxPrepCost : this.getFree();
    const largestMemoryBlock = Math.max(...this.getBlocks());
    const usableMemory = Math.min(maxAllowedMemoryUsage, largestMemoryBlock);

    return Math.min(requestedThreads, Math.floor(usableMemory / ramCosts["grow"]));
  }
}