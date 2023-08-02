
/** @param {NS} ns */
export async function main(ns) {
	let { target, delay } = ns.flags([
		['target', null],
		['delay', 0]
	]);
	if (target === null) {
		throw new Error("Script ran with incorrect params");
	}
	await ns.hack(ns.args[1], { additionalMsec: delay });
}