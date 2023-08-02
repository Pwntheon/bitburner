import Constants from './data/constants.js';
import Arguments from './lib/arguments.js';

const a = new Arguments([
	['target', (d) => d.servers],
	['host', (d) => d.servers],
	['noExecute', false]
]);

export function autocomplete(data, args) {
	return a.autocomplete(data, args);
}

/** @param {NS} ns */
export async function main(ns) {
	const options = a.getOptions(ns);

	const target = options.target;
	const host = options.host;
	const hacktime = ns.getHackTime(target);
	const weakentime = hacktime * 4;
	const growtime = hacktime * 3.2;

	const free = (ns.getServerMaxRam(host) - ns.getServerUsedRam(host)) - Constants.reserve;
	const ramCost = (1.70 * 0.25) + (1.75 * 2 * 1) + (1.75 * 15 * 0.8);

	const possibleBatches = Math.floor(free / ramCost);
	const speed = possibleBatches / (weakentime / 1000)

	const growdelay = weakentime - growtime;
	const hackdelay = weakentime - hacktime;

	let current = 0; //Keeps track of time so the timed attack works properly
	while (1) {
		if (!options.noExecute) {
			ns.exec("/utils/weaken.js", host, { temorary: true, threads: 2 }, '--target', target, current);
			if (current >= growdelay) ns.exec("/utils/grow.js", host, { temorary: true, threads: 15 }, '--target', target, current);
			if (current >= hackdelay) ns.exec("/utils/hack.js", host, { temorary: true, threads: 1 }, '--target', target, current);
		}
		await ns.sleep(Math.max(50, 1000 / speed));
		current += Math.max(50, 1000 / speed);
	}
}