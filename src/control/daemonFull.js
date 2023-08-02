import Constants from './data/constants';
import { run } from './lib/process.js';
import { formatMoney } from './lib/format.js';
import GetAttackers from './lib/attackers.js';

const interval = 1000;
const host = 'home';
const children = [];

/** @param {NS} ns */
export async function main(ns) {
	ns.tprint("Daemon pid: ", ns.pid);
	ns.disableLog("ALL");
	const { tail } = ns.flags([['tail', false]]);
	if (tail) ns.tail();
	ns.atExit(() => {
		for (const child of children) ns.kill(child);
	});
	for (const attacker of GetAttackers(ns)) {
		if (attacker.actionPID > 0) ns.kill(attacker.actionPID);
	}
	ns.tprint(`Sufficient home memory detected. Running full mode.`);
	children.push(ns.run('control/tor.js'));
	children.push(ns.run('shotgun/controller.js'));
	let lastTick = new Date();
	while (true) {
		const delta = (new Date() - lastTick) / 1000;
		lastTick = new Date();
		nukeServers(ns, delta);
		solveContracts(ns, delta);
		getRam(ns, delta);
		doWork(ns, delta);
		hacknet(ns, delta);

		await ns.sleep(interval);
	}
}

class Timer {
	constructor(interval) {
		this.interval = interval;
		this.timer = interval;
	}

	// If enough time has passed, fn is run. Return true if we processed a tick, false if we want to try again next time.
	doTick(delta, fn) {
		this.timer += delta;
		if (this.timer > this.interval && fn()) this.timer -= this.interval;
	}
}

const hacknetTimer = new Timer(10);
function hacknet(ns, delta) {
	hacknetTimer.doTick(delta, () => {
		return run(ns, host, 1, 'utils/upgradeHacknet.js') && run(ns, host, 1, 'utils/spendHashes.js');
		
	});
}

const doWorkTimer = new Timer(20);
/** @param {NS} ns */
function doWork(ns, delta) {
	doWorkTimer.doTick(delta, () => {
		return run(ns, host, 1, 'control/doWork.js');
	})
}


const nukeTimer = new Timer(120);
/** @param {NS} ns */
function nukeServers(ns, delta) {
	nukeTimer.doTick(delta, () => {
		if (!ns.ps('home').some(p => p.filename.includes("nuke.js"))) {
			const pid = run(ns, host, 1, 'hacking/nuke.js');
			if (pid > 0) children.push(pid);
			return pid;
		}
		else return true;
	});
}

const contractTimer = new Timer(60);
/** @param {NS} ns */
function solveContracts(ns, delta) {
	contractTimer.doTick(delta, () => {
		return run(ns, host, 1, 'utils/contracts.js');
	})
}

const buyServersTimer = new Timer(10);
/** @param {NS} ns */
function getRam(ns, delta) {
	buyServersTimer.doTick(delta, () => {

		const attackers = GetAttackers(ns);
		const maxRam = attackers.reduce((acc, curr) => Math.max(acc, curr.ram), 0);
		const imperfectAttackers = attackers.filter(a => a.name !== 'home' && a.ram < ns.getPurchasedServerMaxRam()).sort((a, b) => a.ram - b.ram);

		// Upgrade home if we can
		if (ns.getServerMoneyAvailable('home') >= ns.singularity.getUpgradeHomeRamCost()) {
			if (ns.singularity.upgradeHomeRam()) {

				ns.print("Upgraded home ram");
				return true;
			} else {
				ns.print("WARN - Attempted to upgrade home ram but failed");
				ns.tail();
				return false;
			}
		}

		// Try to buy a bigger server
		if (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) {
			const targetRam = Math.min(maxRam * 2, ns.getPurchasedServerMaxRam());
			const cost = ns.getPurchasedServerCost(targetRam)
			if (ns.getServerMoneyAvailable('home') >= cost) {
				ns.print(`Can afford to buy server with ${ns.formatRam(targetRam)} at ${formatMoney(cost)}`);
				ns.run('control/buyServer.js', 1, '--execute');
			} else {
				ns.print(`Highest current attacker ram is ${ns.formatRam(maxRam)}. Target ram: ${ns.formatRam(targetRam)}.`);
				ns.print(`This would cost ${formatMoney(cost)} which is more than current cash: ${formatMoney(ns.getServerMoneyAvailable('home'))}`);
			}
		}

		// Try to upgrade our worst attacker
		if (imperfectAttackers.length > 0) {
			const worstAttacker = imperfectAttackers[0];
			const cost = ns.getPurchasedServerUpgradeCost(worstAttacker.name, worstAttacker.ram * 2);
			if (ns.getServerMoneyAvailable('home') >= cost) {
				if (ns.upgradePurchasedServer(worstAttacker.name, worstAttacker.ram * 2)) {
					ns.print(`Upgraded server ${worstAttacker.name} to ${ns.formatRam(worstAttacker.ram * 2)}`)
				} else {
					ns.print(`WARN - Tried to upgrade pserver but something went wrong.`);
					ns.tail();
					return false;
				}
			}
		}

		return true;
	});
}