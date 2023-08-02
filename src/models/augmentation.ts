import { NS } from "@ns";

export class Augmentation {
  name: string;
  selectedFaction: string = "";
  rep: number;
  price: number;
  prereq: string[];
  factions: string[] = [];
  types: string[] = [];
  constructor(ns: NS, name: string) {
    this.name = name;
    this.rep = ns.singularity.getAugmentationRepReq(name);
    this.price = ns.singularity.getAugmentationPrice(name);
    this.prereq = ns.singularity.getAugmentationPrereq(name);
  }
}