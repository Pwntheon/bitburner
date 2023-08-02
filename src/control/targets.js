
import Arguments from './lib/arguments.js';
import Targets from './lib/targets.js';
import { formatDuration, formatMoney } from './lib/format.js';

const a = new Arguments([
	['targetsCount', 5],
	['host', 'home'],
	['writeToFile', false]
])

export function autocomplete(data, args) {
	return a.autocomplete(data, args);
}

/** @param {NS} ns */
export async function main(ns) {
	const { targetsCount, host, writeToFile } = a.getOptions(ns);
	const targets = Targets(ns, host, targetsCount, (writeToFile ? "data/targets.txt" : ""));
	if (!writeToFile) {
		ns.tprint(`Income/min │     Money | Max money |    Sec | Min Sec | Prep time │ Is target? │ Hostname`);
		ns.tprint(`═══════════╪═══════════╪═══════════╪════════╪═════════╪═══════════╪════════════╪═══════════════`);
		targets.forEach(s => print(ns, s));
	}
}


/** @param {NS} ns */
function print(ns, server) {
	const {name, security, minSecurity, money, maxMoney} = server;
	const ev = formatMoney(server.ev).padStart(10);
	const prepTime = (server.prepTime === 0 ? "prepped" : formatDuration(server.prepTime)).padStart(9);
	let status = "No";
	if (server.transientTarget) status = "Transient";
	if (server.persistentTarget) status = "Persistent";
	status = status.padStart(10);
	ns.tprint(`${ev} │ ${formatMoney(money).padStart(9)} | ${formatMoney(maxMoney).padStart(9)} | ${ns.formatNumber(security, 1).padStart(6)} | ${ns.formatNumber(minSecurity, 1).padStart(7)} | ${prepTime} │ ${status} │ ${name}`);
}