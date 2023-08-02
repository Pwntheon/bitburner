import Arguments from './lib/arguments.js';
import GetAttackers from './lib/attackers.js';
import {formatMoney } from './lib/format.js';

const a = new Arguments([
	['writeToFile', false]
]);

export function autocomplete(data, args) {
	return a.autocomplete(data, args);
}

/** @param {NS} ns */
export async function main(ns) {
	const { writeToFile } = a.getOptions(ns);
	const attackers = GetAttackers(ns, (writeToFile ? "data/attackers.txt": ""));
	if(!writeToFile) {
		ns.tprint(`Hostname     │        Ram │ Action               │ Busy? │ Target               │ Income`);
		ns.tprint(`═════════════╪════════════╪══════════════════════╪═══════╪══════════════════════╪═════════════`);
		attackers.forEach(a => print(ns, a));
	}
}

/**
 * @param {NS} ns
 */
function print(ns, attacker) {
	const details = [attacker.name.padEnd(12)];
	details.push(ns.formatRam(attacker.ram).padStart(10))
	details.push(attacker.action.padEnd(20))
	details.push((attacker.busy ? "Yes" : "No").padStart(5))
	details.push(attacker.target.padEnd(20));
	details.push(formatMoney(attacker.income));
	ns.tprint(details.join(' │ '));
}