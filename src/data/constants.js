/** @param {NS} ns */

export default {
	reserve: 25,
	augTypes: ["Hacking", "Hacknet", "Faction", "Starting"],
	hacknet: {
		spend: "Generate Coding Contract",
		priorities: [
			{ name: "Company Favor", priority: 0 },
			{ name: "Exchange for Bladeburner Rank", priority: 0 },
			{ name: "Exchange for Bladeburner SP", priority: 0 },
			{ name: "Exchange for Corporation Research", priority: 0 },
			{ name: "Generate Coding Contract", priority: 0 },
			{ name: "Improve Gym Training", priority: 0 },
			{ name: "Improve Studying", priority: 0 },
			{ name: "Increase Maximum Money", priority: 0 },
			{ name: "Reduce Minimum Security", priority: 0 },
			{ name: "Sell for Corporation Funds", priority: 0 },
			{ name: "Sell for Money", priority: 0 },
		]
	},
	daemonLeanRamThreshold: 1024,
	daemonLeanTimeThreshold: 300000,
	backdoor: [
		"run4theh111z",
		"I.I.I.I",
		"avmnite-02h",
		"CSEC",
	],
	scripts: {
		transient: [
			'/hack.js',
			'/weaken.js',
			'/grow.js',
			'/prep.js',
			'/prep2.js'
		],
		persistent: [
			'/cyclehack2.js',
			'/cyclehack.js'
		],
		deployPackage: [
			'hacking/cyclehack.js',
			'hacking/cyclehack2.js',
			'utils/hack.js',
			'utils/weaken.js',
			'utils/grow.js',
			'hacking/prep.js',
			'hacking/prep2.js',
			'lib/arguments.js',
			'lib/format.js',
			'data/constants.js',
			'shotgun/controller.js',
			'shotgun/utils/hack.js',
			'shotgun/utils/grow.js',
			'shotgun/utils/weaken.js',
		]
	}
};
