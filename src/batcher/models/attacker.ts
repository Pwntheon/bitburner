import { NS } from "@ns";
import constants from "/data/constants";

export default class Attacker {
  hostname: string;
  free = 0;
  maxRam = 0;

  constructor(hostname: string) {
    this.hostname = hostname;
  }

  refresh(ns: NS) {
    this.maxRam = ns.getServerMaxRam(this.hostname);
    this.free = this.maxRam - ns.getServerUsedRam(this.hostname);
    if(this.hostname === 'home') this.free = Math.max(0, this.free - constants.reserve);
  }
}