import { NS } from "@ns";
import Target from "batcher/models/target";

export default class TargetManager {
  ns: NS;
  allServers: Target[];
  constructor(ns: NS) {
    this.ns = ns;
    const servers = recursiveScan(ns, 'home').filter(t => t.maxMoney > 0);

    this.allServers = servers.filter(server => {
      // Take all servers with less prep time.
      // If at least one has higher max money,
      // we don't include this because it's strictly worse
      if(servers.filter(t => t.times.weaken1 < server.times.weaken1).some(t => t.maxMoney > server.maxMoney)) return false;
      return true;
    });
    ns.print(`Filtering "Useless" servers removed ${servers.length - this.allServers.length}`);
  }

  get targets() {
    return this.allServers.filter(s => s.requiredLevel <= this.ns.getHackingLevel());
  }

  refresh() {
    this.allServers.forEach(t => t.refresh());
  }

  setStrategy(maxRam: number) {
    this.refresh();
    this.targets.forEach(t => t.setStrategy(maxRam))
  }

  getPrepTarget(): Target | undefined {
    return this.targets.filter(t => !t.isPrepped).sort((a, b) => a.times.weaken1 - b.times.weaken1)[0];
  }

  getHackingTarget(): Target | undefined {
    return this.targets.filter(t => t.isPrepped).sort((a, b) => b.ev - a.ev)[0];
  }
}

function recursiveScan(ns: NS, hostname: string, targets: Target[] = []) {
  targets.push(new Target(ns, hostname));
  ns.scan(hostname).forEach(hostname => {
    if (!targets.some(target => target.hostname === hostname)) recursiveScan(ns, hostname, targets);
  })
  return targets;
}