import { NS } from '@ns'
import Constants from 'data/constants.js';
import { Augmentation } from 'models/augmentation';
import { Faction } from 'models/faction';

export async function main(ns: NS) {
  ns.clearLog();
  ns.exec('utils/augs.js', 'home');
  const allAugs: Augmentation[] = JSON.parse(ns.read('data/augs.txt'));
  if (allAugs.length <= 0) throw Error("Tried to load augs but 0 found!");

  const availableFactions = [...ns.getPlayer().factions, ...ns.singularity.checkFactionInvitations()];
  let augs = allAugs.filter(a => {

    // Filter augs we already have
    if (ns.singularity.getOwnedAugmentations(true).includes(a.name)) return false;
    let typeMatch = false;
    let factionMatch = false;
    // Check that it's of a type we want
    for (const type of a.types) {
      if (Constants.augTypes.includes(type)) typeMatch = true;
    }

    // Check that it can be bought from a faction we have access to
    for (const faction of availableFactions) {
      if (a.factions.includes(faction)) factionMatch = true;
    }

    // Filter out factions that sell this aug, but whom we don't have access to.
    a.factions = a.factions.filter(f => availableFactions.includes(f));

    return typeMatch && factionMatch;
  }).sort((a, b) => a.rep - b.rep);

  const factions = availableFactions.map(name => new Faction(ns, name));

  for (const aug of augs.filter(a => a.factions.length === 1)) {
    const faction = factions.find(f => f.name === aug.factions[0]);
    if (faction === undefined) throw Error(`Couldn't find faction for aug ${aug.name}`);
    faction.addAug(aug);
  }

  for (const aug of augs.filter(a => a.factions.length > 1)) {
    const potentialSellers = factions.filter(f => aug.factions.includes(f.name));

    // If we already need more rep for a faction that sells this, buy from the lowest rep req faction that sells this.
    const overrepFactions = potentialSellers.filter(f => f.rep >= aug.rep).sort((a, b) => a.rep - b.rep);
    if (overrepFactions.length > 0) {
      overrepFactions[0].addAug(aug);
    } else {
      // Else, join the faction that needs the least extra rep to buy this
      const cheapestFactions = potentialSellers.sort((a, b) => (aug.rep - a.rep) - (aug.rep - b.rep));
      cheapestFactions[0].addAug(aug);
    }
  }

  for(const faction of factions) {
    if(!ns.getPlayer().factions.includes(faction.name) && faction.augs.length > 0) ns.singularity.joinFaction(faction.name);
  }

  ns.write('data/factions.txt', JSON.stringify(factions), "w");
}