import { NS } from "@ns";
import { JobDetails, greedIncrement, growthHeadroom, prepLeeway, ramCosts, spacer, weakenHeadroom } from "/batcher/config";

export default class Target {
  ns: NS;
  hostname: string;
  isPrepped = false;

  money = 0;
  maxMoney = 0;
  security = 0;
  minSecurity = 0;
  requiredLevel = 0;
  hackChance = 0;

  times: JobDetails;
  threads: JobDetails;
  prepThreads: JobDetails;

  greed = 0;
  ev = 0;

  constructor(ns: NS, hostname: string) {
    this.ns = ns;
    this.hostname = hostname;
    this.times = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
    this.threads = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
    this.prepThreads = { weaken1: 0, grow: 0, weaken2: 0 };
    this.refresh();
  }

  refresh() {
    this.money = this.ns.getServerMoneyAvailable(this.hostname);
    this.maxMoney = this.ns.getServerMaxMoney(this.hostname);
    this.security = this.ns.getServerSecurityLevel(this.hostname);
    this.minSecurity = this.ns.getServerMinSecurityLevel(this.hostname);

    const preppedServer = this.ns.getServer(this.hostname);
    preppedServer.moneyAvailable = this.maxMoney;
    preppedServer.hackDifficulty = this.minSecurity;

    const player = this.ns.getPlayer();
    this.times.hack = this.ns.formulas.hacking.hackTime(preppedServer, player);
    this.times.grow = this.ns.formulas.hacking.growTime(preppedServer, player);
    this.times.weaken1 = this.ns.formulas.hacking.weakenTime(preppedServer, player);
    this.times.weaken2 = this.times.weaken1;

    this.hackChance = this.ns.formulas.hacking.hackChance(preppedServer, player);
    this.requiredLevel = this.ns.getServerRequiredHackingLevel(this.hostname);
    this.isPrepped = (this.maxMoney - this.money) + (this.security - this.minSecurity) < prepLeeway;
  }

  setStrategy(maxRam: number) {
    this.refresh();
    const player = this.ns.getPlayer();
    const server = this.ns.getServer(this.hostname);
    server.hackDifficulty = this.minSecurity;
    const hackPercent = this.ns.formulas.hacking.hackPercent(server, player);

    if (!this.isPrepped) {
      this.prepThreads.weaken1 = Math.ceil(weakenHeadroom * (this.security - this.minSecurity / 0.05));
      this.prepThreads.grow = Math.ceil(growthHeadroom * this.ns.formulas.hacking.growThreads(server, player, this.maxMoney));
      this.prepThreads.weaken2 = Math.ceil(weakenHeadroom * ((this.prepThreads.grow * 0.004) / 0.05));
    }

    this.greed = 0;
    let usedRam = 0;
    while (usedRam < maxRam) {
      this.greed += greedIncrement;
      this.threads.hack = Math.max(1, Math.floor(this.greed / hackPercent));
      const cashPerBatch = this.maxMoney * hackPercent * this.threads.hack;
      server.moneyAvailable = this.maxMoney - cashPerBatch;
      this.threads.grow = Math.ceil(growthHeadroom * this.ns.formulas.hacking.growThreads(server, player, this.maxMoney));
      this.threads.weaken1 = Math.ceil(weakenHeadroom * ((this.threads.hack * 0.002) / 0.05));
      this.threads.weaken2 = Math.ceil(weakenHeadroom * ((this.threads.grow * 0.004) / 0.05));
      const batchCost = (this.threads.hack * ramCosts.hack) + (
        (this.threads.grow + this.threads.weaken1 + this.threads.weaken2) * ramCosts.grow
      );
      const batchesPerCycle = Math.ceil(this.times.weaken1 / spacer);
      usedRam = batchCost * batchesPerCycle;
      this.ev = cashPerBatch * spacer * (maxRam / usedRam);
      if (this.greed >= 0.99) break;
    }
  }
}