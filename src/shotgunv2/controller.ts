import { NS } from "@ns";
import getAttackers from "/shotgunv2/attackers";
import getTargets from "/shotgunv2/targets";
import Target from "/shotgunv2/models/target";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  const workers = [];
  
  let attackers = getAttackers(ns);
  let targets = getTargets(ns);

  prep(ns, targets);
}

function prep(ns: NS, targets: Target[]) {
  ns.print("Number of targets to prep: " + targets.length);
  const toPrep = targets.filter(target => {
    // Take all servers with less prep time.
    // If at least one has higher max money,
    // we don't include this because it's strictly worse
    if(targets.filter(t => t.weakenTime < target.weakenTime).some(t => t.maxMoney > target.maxMoney)) return false;
    return true;
    // And sort by fastest preptime
  }).sort((a, b) => a.weakenTime - b.weakenTime);
  ns.print("Number of targets to prep after weeding out subomptimal ones: " + toPrep.length);
}