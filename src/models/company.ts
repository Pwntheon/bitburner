import { Faction } from "./faction";
import { NS } from "@ns";

export class Company {
  name: string;
  rep: number;
  favor: number;
  server: string;
  constructor(ns: NS, name: string, serverName: string) {
    this.name = name;
    this.rep = ns.singularity.getCompanyRep(name);
    this.favor = ns.singularity.getCompanyFavor(name);
    this.server = serverName;
  }
}