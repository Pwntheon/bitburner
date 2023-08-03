import { NS } from "@ns";
import Attacker from "/batcher/models/attacker";
import Job from "/batcher/models/job";
import { ramCosts, scriptNames } from "/batcher/config";

const scriptSize = ramCosts.grow;


export default class Swarm {
  ns: NS;
  attackers: Attacker[];
  constructor(ns: NS) {
    this.ns = ns;
    this.attackers = ['home', ...ns.getPurchasedServers()].map(hostname => new Attacker(hostname));
  }

  getFree() {
    return this.attackers.reduce((curr, acc) => curr + acc.free, 0);
  }

  getBlocks() {
    this.refresh();
    return this.attackers.map(a => a.free);
  }

  /*
  Idea: When doing prep,
  check block sizes, divide on ration weaken/grow, then deploy them without partial.
  */
 
  deploy(jobs: Job[]) {
    const pids: number[] = [];
    for (const job of jobs) {
      this.refresh();
      const attacker = this.attackers.filter(a => a.free > scriptSize * job.threads)[0];

      // No more memory in swarm. Shouldn't happen
      if (attacker === undefined) throw Error(`Failed to execute ${job.type}: No attacker with sufficient memory`);

      const pid = this.ns.exec(scriptNames[job.type], attacker.hostname, { threads: job.threads, temporary: true }, job.dto);

      // Failed to execute. Shouldn't happen.
      if (pid === 0) throw Error(`Failed to execute ${job.type} on ${attacker.hostname} for unknown reasons.`);
      pids.push(pid);
    }
    return pids;
  }

  deployPrep(jobs: Job[], limitRamUsage = false): number[] {
    throw new Error("Not implemented");
  }

  refresh() {
    for (const attacker of this.attackers) attacker.refresh(this.ns);
    this.attackers = this.attackers.sort((a, b) => a.free - b.free);
  }
}