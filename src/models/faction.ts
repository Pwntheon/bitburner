import { Augmentation } from "models/augmentation";
import { NS } from "@ns";

export class Faction {
  name: string;
  augs: Augmentation[] = [];
  rep: number;
  favor: number;
  req: number;

  constructor(ns: NS, name: string) {
    this.name = name;
    this.rep = ns.singularity.getFactionRep(name);
    this.favor = ns.singularity.getFactionFavor(name);
    this.req = 0;
  }

  addAug(aug: Augmentation) {
    this.augs.push(aug);
    aug.selectedFaction = this.name;
    this.req = Math.max(...this.augs.map(a => a.rep));
  }
}