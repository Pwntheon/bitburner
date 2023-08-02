import Scan from 'lib/scan.js';
import Constants from 'data/constants.js';

/** @param {NS} ns */
export async function main(ns) {
	const servers = Scan(ns).filter(s => !s.includes("pserv") && !s.includes("hacknet"));
	for (const t of servers) {
		if (ns.hasRootAccess(t)) {
			ns.print(`${t} already rooted.`);
			await backdoor(ns, t);
			continue;
		}

		let opened = 0;
		if (ns.fileExists("BruteSSH.exe")) {
			ns.brutessh(t);
			++opened;
		}
		if (ns.fileExists("FTPCrack.exe")) {
			ns.ftpcrack(t);
			++opened;
		}
		if (ns.fileExists("relaySMTP.exe")) {
			ns.relaysmtp(t);
			++opened;
		}
		if (ns.fileExists("HTTPWorm.exe")) {
			ns.httpworm(t);
			++opened;
		}
		if (ns.fileExists("SQLInject.exe")) {
			ns.sqlinject(t);
			++opened;
		}
		if (opened >= ns.getServerNumPortsRequired(t) &&
			ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(t)) {
			ns.nuke(t);
		}

		if (ns.hasRootAccess(t)) {
			await backdoor(ns, t);
			ns.tprint(`Gained root on ${t}`);
		} else {
			ns.print(`Failed to root ${t}. ${opened}/${ns.getServerNumPortsRequired(t)} ports opened.`);
		}
	};
}

/** @param {NS} ns */
async function backdoor(ns, target) {
	if(!Constants.backdoor.includes(target)) return;
	if (!ns.getServer(target).backdoorInstalled) {
		const where = ns.singularity.getCurrentServer();
		ns.exec('control/move.js', 'home', 1, '--connectTo', target);
		await ns.sleep(10);
		ns.tprint(`WARN - Installing backdoor on ${target}, please don't move :)`);
		await ns.singularity.installBackdoor();
		ns.tprint(`Gained backdoor on ${target}`);
		ns.exec('control/move.js', 'home', 1, '--connectTo', where);
	}
}