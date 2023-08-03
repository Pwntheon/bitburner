import { NS } from "@ns";
import Target from "shotgunv2/models/target";


export default function getTargets(ns: NS, hostname = 'home') {
  const allServers = recursiveScan(ns, hostname);
  for (const server of allServers) {
    server.refresh(ns);
  }
  return allServers.filter(s => s.maxMoney > 0 && s.requiredLevel <= ns.getHackingLevel())
}

function recursiveScan(ns: NS, hostname: string, targets: Target[] = []) {
  targets.push(new Target(hostname));
  ns.scan(hostname).forEach(hostname => {
    if (!targets.some(target => target.hostname === hostname)) recursiveScan(ns, hostname, targets);
  })
  return targets;
}