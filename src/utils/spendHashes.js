

/** @param {NS} ns */
export async function main(ns) {
	const priorities = [
		{ name: "Company Favor", priority: 0 },
		{ name: "Exchange for Bladeburner Rank", priority: 0 },
		{ name: "Exchange for Bladeburner SP", priority: 0 },
		{ name: "Exchange for Corporation Research", priority: 0 },
		{ name: "Sell for Corporation Funds", priority: 0 },
		{ name: "Generate Coding Contract", priority: 0 },
		{ name: "Improve Gym Training", priority: 0 },
		{ name: "Improve Studying", priority: 0 },
		{ name: "Increase Maximum Money", priority: 0 },
		{ name: "Reduce Minimum Security", priority: 0 },
		{ name: "Sell for Money", priority: 0 },
	];

	/*
		Not handled:

		Company favor
		Bladeburner stuff
		Corp stuff
	*/

	function setItem(name, pri, target = null) {
		const item = priorities.find(p => p.name === name);
		if (!item) throw Error("Attempted to set priority of unknown item");
		item.priority = pri;
		if (target) item.target = target;
	}

	const currentWork = ns.singularity.getCurrentWork();
	if (currentWork.type === "CLASS" && ["def", "dex", "agi", "str"].includes(currentWork.classType)) currentWork.type = "GYM";
	if (currentWork.type === "FACTION") setItem("Generate Coding Contract", 1);
	if (currentWork.type === "CLASS") setItem("Improve Studying", 1);
	if (currentWork.type === "GYM") setItem("Improve Gym Training", 1);

	const target = ns.read('data/target.txt');
	if (target.length > 0) {
		setItem("Increase Maximum Money", 0.1, target);
		setItem("Reduce Minimum Security", 0.1, target);
	}

	const items = priorities.filter(i => i.priority > 0);
	if (items.length === 0) {
		ns.print("Nothing to spend hashes on");
		ns.exit();
	}

	while (1) {
		for (const item of items) {
			item.cost = ns.hacknet.hashCost(item.name);
		}
		const toSpend = items.sort((a, b) => a.cost / a.priority - b.cost / b.priority)[0];
		ns.print(`Spending hashes on ${toSpend.name}`);
		if(ns.hacknet.numHashes() > toSpend.cost) ns.hacknet.spendHashes(toSpend.name, toSpend.target);
		else break;
	}

}