import Constants from './data/constants';
import { run } from './lib/process.js';
import { formatMoney } from './lib/format.js';

const interval = 1000;
const host = 'home';

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	const { tail } = ns.flags([['tail', false]]);
	if (tail) ns.tail();
	ns.run('control/tor.js');
	let lastTick = new Date();
	while (true) {
		const delta = (new Date() - lastTick) / 1000;
		lastTick = new Date();
		buyServers(ns, delta);
		periodicNuke(ns, delta);
		targetAttackers(ns, delta);
		spendHacknet(ns, delta);
		upgradeDaemon(ns, delta);
		doWork(ns, delta);

		await ns.sleep(interval);
	}
}

class Timer {
	constructor(interval) {
		this.interval = interval;
		this.timer = 0;
	}

	// If enough time has passed, fn is run. Return true if we processed a tick, false if we want to try again next time.
	doTick(delta, fn) {
		this.timer += delta;
		if (this.timer > this.interval && fn()) this.timer -= this.interval;
	}
}

const hacknetTimer = new Timer(1);
/** @param {NS} ns */
function spendHacknet(ns, delta) {
	hacknetTimer.doTick(delta, () => {
		ns.run('utils/sellHashes.js');
		return true;
	});
}

const workTimer = new Timer(10);
function doWork(ns, delta) {
	workTimer.doTick(delta, () => {
		return ns.run('control/doWork.js');
	})
}

const upgradeTimer = new Timer(30);
/** @param {NS} ns */
function upgradeDaemon(ns, delta) {
	upgradeTimer.doTick(delta, () => {
		const timeSinceReset = Date.now() - new Date(ns.getResetInfo().lastAugReset);
		if (ns.getServerMaxRam('home') > Constants.daemonLeanRamThreshold && timeSinceReset > Constants.daemonLeanTimeThreshold) {
			ns.tprint("Home memory sufficient - switching from lean to full daemon.");
			ns.spawn('control/daemon.js', 1);
		}
		return true;
	})
}

const nukeTimer = new Timer(10);
/** @param {NS} ns */
function periodicNuke(ns, delta) {
	nukeTimer.doTick(delta, () => {
		return run(ns, host, 1, 'hacking/nuke.js', '--target', 'ALL');
	});
}

const targetTimer = new Timer(10);
let targetsPID = 0;
let attackersPID = 0;
/** @param {NS} ns */
function targetAttackers(ns, delta) {
	targetTimer.doTick(delta, () => {
		if (targetsPID === 0) targetsPID = run(ns, host, 1, 'control/targets.js', ...[
			'--targetsCount', Number.MAX_SAFE_INTEGER,
			'--host', host,
			'--writeToFile', true
		]);

		if (attackersPID === 0) attackersPID = run(ns, host, 1, 'control/attackers.js', ...[
			'--writeToFile', true
		]);

		if (targetsPID === 0 || ns.isRunning(targetsPID) ||
			attackersPID === 0 || ns.isRunning(attackersPID)) {
			ns.print(`Waiting for targets and attackers scripts to finish running. targetsPID: ${targetsPID}, attackersPID: ${attackersPID}`);
			return false;
		}

		targetsPID = 0;
		attackersPID = 0;

		ns.print("Checking for target reassignment.");

		const targets = JSON.parse(ns.read("data/targets.txt"));
		const attackers = JSON.parse(ns.read("data/attackers.txt")).map(a => (
			{ ...a, target: targets.find(t => t.name === a.target) }
		));
		const freeAttackers = attackers.filter(a => !a.busy);
		ns.print(`${attackers.length} attackers found. ${freeAttackers.length} free.`);
		if (freeAttackers.length === 0) {
			const worstAttackers = attackers
				.filter(a => a.actionPID > 0)
				.sort((a, b) => a.target.ev - b.target.ev);
			if (worstAttackers.length === 0) {
				ns.print(`WARN - All attackers are busy but none are running control scripts. Is this right?`);
				ns.tail();
			}
		} else {

			const attacker = freeAttackers[0];
			ns.print(`Best attacker: ${attacker.name} with ${ns.formatRam(attacker.ram)} RAM.`);
			const freeTargets = targets.filter(t => !t.transientTarget && !t.persistentTarget);
			const preppedTargets = freeTargets.filter(t => t.prepTime === 0);
			ns.print(`${freeTargets.length} servers not being targeted. ${preppedTargets.length} of these are prepped.`);
			if (preppedTargets.length > 0) {
				const target = preppedTargets[0];
				const PID = ns.exec('utils/deploy.js', 'home', 1, attacker.name, 'hacking/cyclehack.js', '--target', target.name, '--host', attacker.name);
				ns.print(`Using ${attacker.name} to attack ${target.name}. PID: ${PID}`);
				if (PID === 0) {
					ns.print(`WARN - Failed to deploy hacking package to ${attacker.name}`);
					ns.tail();
				}
			} else {
				if (freeTargets.length > 0) {
					const target = freeTargets[0];
					const PID = ns.exec('utils/deploy.js', 'home', 1, attacker.name, 'hacking/prep.js', '--target', target.name, '--host', attacker.name);
					ns.print(`Using ${attacker.name} to prep ${target.name}. PID: ${PID}`);
					if (PID === 0) {
						ns.print(`WARN - Failed to deploy hacking package to ${attacker.name}`);
						ns.tail();
					}
				} else {
					ns.print(`No targets available.`);
				}
			}
		}
		return true;
	});
}

const buyServersTimer = new Timer(10);
/** @param {NS} ns */
function buyServers(ns, delta) {
	buyServersTimer.doTick(delta, () => {
		ns.print(`Checking for buying new server.`);
		const cash = ns.getServerMoneyAvailable('home');
		if (cash >= ns.singularity.getUpgradeHomeRamCost()) {
			if (ns.singularity.upgradeHomeRam()) {

				ns.print("Upgraded home ram");
				return true;
			} else {
				ns.print("WARN - Attempted to upgrade home ram but failed");
				return false;
			}
		}
		const pservers = ns.getPurchasedServers();
		const attackersJSON = ns.read("data/attackers.txt");
		if (attackersJSON.length === 0) return false;
		const attackers = JSON.parse(attackersJSON);
		const maxRam = attackers.reduce((acc, curr) => Math.max(acc, curr.ram), 0);
		ns.print(`Highest ram on attackers: ${maxRam}`);
		if (pservers.length < ns.getPurchasedServerLimit()) {
			const targetRam = Math.min(maxRam * 2, ns.getPurchasedServerMaxRam());
			const cost = ns.getPurchasedServerCost(targetRam)
			if (cash >= cost) {
				ns.print(`Can afford to buy server with ${ns.formatRam(targetRam)} at ${formatMoney(cost)}`);
				ns.run('control/buyServer.js', 1, '--execute');
			} else {
				ns.print(`Highest current attacker ram is ${ns.formatRam(maxRam)}. Target ram: ${ns.formatRam(targetRam)}.`);
				ns.print(`This would cost ${formatMoney(cost)} which is more than current cash: ${formatMoney(cash)}`);
			}
		} else {
			ns.print(`WARN - We should upgrade a server, but this is not implemented yet.`);
		}

		return true;
	});
}