import { NS } from "@ns";

export default class Target {
  hostname: string;
  money: number = 0;
  maxMoney: number = 0;
  security: number = 0;
  minSecurity: number = 0;
  hackTime: number = 0;
  weakenTime: number = 0;
  growTime: number = 0;
  requiredLevel: number = 0;
  hackChance: number = 0;
  isPrepped: boolean = false;

  constructor(hostname: string) {
    this.hostname = hostname;
  }

  refresh(ns: NS) {
    this.money = ns.getServerMoneyAvailable(this.hostname);
    this.maxMoney = ns.getServerMaxMoney(this.hostname);
    this.security = ns.getServerSecurityLevel(this.hostname);
    this.minSecurity = ns.getServerMinSecurityLevel(this.hostname);
    this.hackTime = ns.getHackTime(this.hostname);
    this.weakenTime = ns.getWeakenTime(this.hostname);
    this.growTime = ns.getGrowTime(this.hostname);
    const server = ns.getServer(this.hostname);
    this.hackChance = ns.formulas.hacking.hackChance(server, ns.getPlayer());
    this.requiredLevel = ns.getServerRequiredHackingLevel(this.hostname);
    this.isPrepped = (this.maxMoney - this.money) + (this.security - this.minSecurity) < 0.00001;
  }
}