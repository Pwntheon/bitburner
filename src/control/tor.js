import Arguments from './lib/arguments.js';

const a = new Arguments([
	["maxSpendPercent", 100]
]);

export function autocomplete(data, args) {
	return a.autocomplete(data, args);
}

const programs = ["BruteSSH.exe","FTPCrack.exe","relaySMTP.exe","HTTPWorm.exe","SQLInject.exe","ServerProfiler.exe","DeepscanV1.exe","DeepscanV2.exe","AutoLink.exe","Formulas.exe"];

/** @param {NS} ns */
export async function main(ns) {
	const options = a.getOptions(ns);
	if(options.maxSpendPercent <= 0 || options.maxSpendPercent > 100) {
		ns.tprint("Spend percent needs to be > 0 and <= 100");
	}
	
	if(ns.singularity.getDarkwebProgramCost(programs[0]) === -1) {
		if(!ns.singularity.purchaseTor())  {
			ns.tprint(`TOR router not yet purchased. Waiting for money (willing to spend ${options.maxSpendPercent}% of liquid assets)`);
			while(!ns.singularity.purchaseTor()) {
				await ns.sleep(1000);
			}
		}
		ns.tprint("Purchased TOR router.");
	} else {
		ns.tprint("Tor router already purchased.");
	}

	let toBuy = programs.map(p => {
		return {
			name: p,
			price: ns.singularity.getDarkwebProgramCost(p)
		}
	}).filter(p => ns.singularity.getDarkwebProgramCost(p.name) > 0);

	while(toBuy.length > 0) {
		toBuy.forEach(p => {
			const spendableCash = ns.getServerMoneyAvailable("home") * options.maxSpendPercent / 100;
			if(spendableCash > ns.singularity.getDarkwebProgramCost(p.name)) {
				if(ns.singularity.purchaseProgram(p.name)) {
					ns.tprint(`Purchased program ${p.name}`);
				} else {
					ns.tprint(`Attempted to purchase program ${p.name} but it failed!`);
				}
			}
		})

		toBuy = toBuy.filter(p => ns.singularity.getDarkwebProgramCost(p.name) > 0);
		await ns.sleep(1000);
	}

	ns.tprint("All darkweb programs bought.");
}
