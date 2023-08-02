import { formatMoney } from 'lib/format.js';
let multiplier = 1.9;

/** @param {NS} ns */
export async function main(ns) {
	const { execute } = ns.flags([["execute", false]]);
	ns.clearLog();
	ns.exec('utils/factions.js', 'home');

	const sf11 = ns.singularity.getOwnedSourceFiles().find(sf => sf.n === 11);
	if (typeof sf11 !== "undefined") {
		multiplier *= [1, 0.96, 0.94, 0.93][sf11.lvl]
	}

	const factions = JSON.parse(ns.read('data/factions.txt')).sort((a, b) => a.req - b.req);
	const allAugs = factions.reduce((acc, curr) => [...acc, ...curr.augs.filter(aug => aug.rep <= curr.rep)], []);

	ns.tprint("Price: ", formatMoney(buy(ns, allAugs, execute)));
	if(!execute) ns.tprint("To buy these augs, run with --execute");

}

/** @param {NS} ns */
function buy(ns, augs, buy) {
	const bought = ns.singularity.getOwnedAugmentations(true);
	const cash = ns.getServerMoneyAvailable('home');
	const order = augs.sort((a, b) => b.price - a.price);
	let totalPrice = 0;
	let numberBought = ns.singularity.getOwnedAugmentations(false).length - bought.length;
	const unbuyable = [];
	while (order.length) {
		const aug = order.shift();
		let canBuy = true;
		const unmetReqs = aug.prereq.filter(p => !bought.includes(p));
		if (unmetReqs.length > 0) {
			if (unmetReqs.some(r => [...bought, ...order.map(o => o.name)].includes(r.name))) {
				// We don't have the reqs, and they aren't in the list to buy
				unbuyable.push(aug);
				continue;
			}
			// Push aug back in queue...
			order.unshift(aug);
			ns.print(`Aug ${aug.name} has unmet dependencies: ${unmetReqs.join(", ")}, shifting them in front.`);
			for (const prereq of unmetReqs) {
				const index = order.findIndex(a => a.name === prereq);
				// ... but with it's requirements moved in front
				order.unshift(...order.splice(index, 1));
			}
			continue;
		}

		let price = aug.price * (Math.pow(multiplier, numberBought));
		totalPrice += price;
		numberBought++;
		bought.push(aug.name);
		ns.print(aug.selectedFaction, aug.name);
		if (buy) ns.singularity.purchaseAugmentation(aug.selectedFaction, aug.name);
	}
	return totalPrice;
}