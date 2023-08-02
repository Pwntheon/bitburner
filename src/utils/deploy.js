import Constants from './data/constants.js';

/** @param {NS} ns */
export async function main(ns) {
		ns.scp(Constants.scripts.deployPackage, ns.args[0]);
		if(ns.args.length > 1) {
			const script = ns.args[1];
			const args = (ns.args.length > 2 ? ns.args.slice(2) : []);
			const PID = ns.exec(script, ns.args[0], 1, ...args);
			if(PID === 0) {
				ns.print(`Couldn't start script.`);
				ns.tail();
			}
		}
}