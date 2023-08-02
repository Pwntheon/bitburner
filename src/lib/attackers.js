import Constants from './data/constants.js';

/** @param {NS} ns */
export default function GetAttackers(ns, filename = "", fn = null) {
	const hosts = [...ns.getPurchasedServers(), "home"];
	const attackers = hosts.map(hostname => {
		const busy = ns.ps(hostname).some(process => {
			for (const script of [...Constants.scripts.transient, ...Constants.scripts.persistent]) {
				if (process.filename.includes(script)) return true;
			}
			return false;
		});
		let target = "";
		let income = 0;
		let controllerScript = ns.ps(hostname).find(process => {
			for (const script of Constants.scripts.persistent) {
				if (process.filename.includes(script)) return true;
			}
			return false;
		});
		if(!(typeof controllerScript === "undefined")) {
			// ns.print(`Controller script ${controllerScript} has args: ${controllerScript.args.join(" ")}`);
			for(let i = 0; i < controllerScript.args.length; ++i) {
				if(i > 0 && controllerScript.args[i-1] === "--target") target = controllerScript.args[i];
			}
			income = ns.getScriptIncome(controllerScript.filename, hostname, ...controllerScript.args);
		}

		return {
			name: hostname,
			ram: ns.getServerMaxRam(hostname),
			busy,
			target,
			action: (typeof controllerScript !== "undefined" ? controllerScript.filename : "None"),
			actionPID: (typeof controllerScript !== "undefined" ? controllerScript.pid : 0),
			income
		};
	}).sort((a, b) => b.ram - a.ram);
	
	if(filename.length) ns.write(filename, JSON.stringify(attackers), "w");
	return attackers;
}