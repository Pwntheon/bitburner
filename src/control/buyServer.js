import Arguments from './lib/arguments.js';
import { formatMoney } from './lib/format.js';

const prefix = "pserv";

const a = new Arguments([
	['execute', false]
]);

export function autocomplete(data, args) {
	return a.autocomplete(data, args);
}

/** @param {NS} ns */
export async function main(ns) {
	const { execute } = a.getOptions(ns);
	const maxSize = ns.getPurchasedServerMaxRam();
	ns.tprint("Max size: ", ns.formatRam(maxSize));
	const maxPrice = ns.getServerMoneyAvailable("home");
	let size = 2;
	while (size * 2 <= maxSize && ns.getPurchasedServerCost(size * 2) < maxPrice) size *= 2;

	ns.tprint(ns.formatRam(size));
	if (execute) {
		ns.tprint(`Buying ${ns.formatRam(size)}(2^${size}) size server.`);
		const name = ns.purchaseServer(`${prefix}`, size);
		if (name.length) {
			ns.tprint(`Server bought: `, name);
			ns.scp(['utils/hack.js', 'utils/weaken.js', 'utils/grow.js'], name, 'home');
		} else {
			ns.tprint(`Failed to buy server for unknown reason`);
		}
	} else {
		ns.tprint(`Biggest affordable server at ${ns.formatRam(size)} RAM costs ${formatMoney(ns.getPurchasedServerCost(size))}`);
	}

}