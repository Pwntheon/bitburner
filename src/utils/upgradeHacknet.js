import Constants from './data/constants.js';

/** @param {NS} ns */
export async function main(ns) {
	if (ns.hacknet.numNodes() === 0) {
		ns.hacknet.purchaseNode();
		return;
	}
	let cash = ns.getServerMoneyAvailable('home') / 10;
	while (1) {
		let income = 0;
		let upgrades = [];
		let cacheUpgrades = [];
		for (let i = 0; i < ns.hacknet.numNodes(); ++i) {
			income += ns.hacknet.getNodeStats(i).production;
			cacheUpgrades.push({
				index: i,
				cost: ns.hacknet.getCacheUpgradeCost(i)
			});
			upgrades.push({
				index: i,
				cost: ns.hacknet.getCoreUpgradeCost(i),
				type: "core"
			});
			upgrades.push({
				index: i,
				cost: ns.hacknet.getLevelUpgradeCost(i),
				type: "level"
			});
			upgrades.push({
				index: i,
				cost: ns.hacknet.getRamUpgradeCost(i),
				type: "ram"
			});
		}

		const cacheUpgrade = cacheUpgrades.sort((a, b) => a.cost - b.cost)[0];
		const upgrade = upgrades.sort((a, b) => a.cost - b.cost)[0];
		if (ns.hacknet.numNodes() < ns.hacknet.maxNumNodes() && ns.hacknet.getPurchaseNodeCost() <= cash) {
			cash -= ns.hacknet.getPurchaseNodeCost();
			ns.hacknet.purchaseNode();
		} else if ((income * 60 > ns.hacknet.hashCapacity()
			|| ns.hacknet.numHashes() * 1.1 > ns.hacknet.hashCapacity())
			&& cacheUpgrade.cost <= cash) {
			cash -= cacheUpgrade.cost;
			ns.hacknet.upgradeCache(cacheUpgrade.index);
		} else if (upgrade.cost <= cash) {
			cash -= upgrade.cost;
			switch (upgrade.type) {
				case "core":
					ns.hacknet.upgradeCore(upgrade.index);
					break;
				case "level":
					ns.hacknet.upgradeLevel(upgrade.index);
					break;
				case "ram":
					ns.hacknet.upgradeRam(upgrade.index);
					break;
			}
		} else {
			break;
		}
	}
}