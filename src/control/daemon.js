import Constants from './data/constants.js';

/** @param {NS} ns */
export async function main(ns) {
	const { tail } = ns.flags([['tail', 'false']]);
	const args = [];
	const timeSinceReset = Date.now() - new Date(ns.getResetInfo().lastAugReset);
	if (tail) args.push('--tail');
	ns.closeTail();
	if (ns.getServerMaxRam('home') < Constants.daemonLeanRamThreshold ||
		timeSinceReset < Constants.daemonLeanTimeThreshold) {
		ns.tprint(`Starting lean daemon.`);
		ns.exec('control/daemonLean.js', 'home', 1, ...args);
	} else {
		ns.tprint(`Starting full daemon.`);
		ns.exec('control/daemonFull.js', 'home', 1, ...args);
	}
}