import { NS } from "@ns";
import Target from "/batcher/models/target";

export default function Nuke(ns: NS, target: Target): boolean {
  if(ns.hasRootAccess(target.hostname)) return true;
  
  let opened = 0;
  if (ns.fileExists("BruteSSH.exe")) {
    ns.brutessh(target.hostname);
    ++opened;
  }
  if (ns.fileExists("FTPCrack.exe")) {
    ns.ftpcrack(target.hostname);
    ++opened;
  }
  if (ns.fileExists("relaySMTP.exe")) {
    ns.relaysmtp(target.hostname);
    ++opened;
  }
  if (ns.fileExists("HTTPWorm.exe")) {
    ns.httpworm(target.hostname);
    ++opened;
  }
  if (ns.fileExists("SQLInject.exe")) {
    ns.sqlinject(target.hostname);
    ++opened;
  }
  if (opened >= ns.getServerNumPortsRequired(target.hostname) &&
    ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target.hostname)) {
    ns.nuke(target.hostname);
  }
  return ns.hasRootAccess(target.hostname);
}

