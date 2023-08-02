import { NS } from "@ns";
import { runAsync } from "lib/process";
import { Faction } from "models/faction";
import { Company } from "models/company";

const companyReq = 400e3

export async function main(ns: NS) {
  ns.disableLog("ALL");

  await runAsync(ns, "utils/factions.js");
  await runAsync(ns, "utils/companies.js");

  const factions = (JSON.parse(ns.read('data/factions.txt')) as Faction[])
    .filter(f => f.rep < f.req)
    .sort((a, b) => {
      const remain = (f: Faction) => (f.req - f.rep) / (1 + f.favor);
      return remain(a) - remain(b);
    });

  const jobs = ns.getPlayer().jobs;
  const companies = (JSON.parse(ns.read('data/companies.txt')) as Company[])
    .filter(c => c.rep < companyReq && jobs[c.name] !== undefined);

  if (factions.length > 0) {/* Do faction work */
    await gainRep(ns, factions);
  } else if (companies.length > 0) {
    await work(ns, companies);
  } else {
    await study(ns);
  }
}

async function work(ns: NS, companies: Company[]) {
  const employer = companies[0];
  if (employer === undefined) throw Error("No company");
  ns.singularity.applyToCompany(employer.name, "IT");
  ns.singularity.applyToCompany(employer.name, "Software");
  ns.singularity.workForCompany(employer.name, false);
}

async function study(ns: NS) {
  let location = ns.getPlayer().city;
  if (location !== "Volhaven") {
    ns.print("Attempting to travel to Volhaven to study");
    const travelled = ns.singularity.travelToCity("Volhaven");
    ns.print(`${(travelled ? "Travelled to Volhaven." : "Travelling failed for unknown reason.")}`);
  }
  location = ns.getPlayer().city;
  if (location === "Volhaven") {
    ns.singularity.universityCourse("ZB Institute of Technology", "Algorithms", false);
  } else if (location === "Aevum") {
    ns.singularity.universityCourse("Summit University", "Algorithms", false);
    ns.print("Failed to travel to Volhaven for best uni. Studying at Summit until we can travel.");
  } else if (location === "Sector-12") {
    ns.singularity.universityCourse("Rothman University", "Algorithms", false);
    ns.print("Failed to travel to Volhaven for best uni. Studying at Rothman until we can travel.");
  } else {
    ns.print("Couldn't find a uni in our current town, and we can't afford to travel. Waiting for money.");
  }
}

/** @param {NS} ns */
async function gainRep(ns: NS, factions: Faction[]) {
  const faction = factions[0];
  const couldWork = ns.singularity.workForFaction(faction.name, "hacking", false);
  if (!couldWork) ns.print(`Tried to work for ${faction.name} but something went wrong. Work type unavailable?`);
}