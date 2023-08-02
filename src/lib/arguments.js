/**
 * Helpers for autocomplete and params.
 * 
 * To enable autocomplete:
 * ```
 * export function autocomplete(data, args) {
 *  return arguments.autocomplete(data, args);
 * }
 * ```
 * 
 * To use arguments in code:
 * ```
 * const options = arguments.getOptions(ns);
 * ```
 */
export default class Arguments {

	/**
	 * @param {arg[]} schema - Array of possible arguments.
	 * 
	 * Each argument has a name and an optional default value.
	 * 
	 * If default value is omitted, the argument is required.
	 * Note that i failed to include a default value for function arguments :(
	 * This can be done but i haven't gotten to it yet
	 * 
	 * Default value can be a function that returns an array of strings.
	 * In this case, this list will be used to autocomplete the argument.
	 * This function will be passed the data argument from `autocomplete`.
	 * 
	 * If default value is a boolean, autocomplete will flip it.
	 * 
	 * ```js
	 * 
	 * new Arguments([
	 *   ['reqiredArg'],
	 *   ['isSomeSettingEnabled', true],
	 *   ['fromListOfServers',
	 *     (d) => d.servers]
	 * ]);
	 * ```
	 * 
	 */
	constructor(schema) {
		this.schema = schema;
	}

	/**
	 * Internal use only
	 */
	_checkRequired(ns) {
		const requiredArgs = this.schema.filter(a => a.length === 1 || typeof a[1] === "function");
		const missingArgs = requiredArgs.filter(as => !ns.args.some(a => a === `--${as[0]}`))
		if (missingArgs.length > 0) {
			missingArgs.forEach(a => ns.tprint("Missing required argument --" + a[0]));
			ns.exit();
		}
		const functionArgs = this.schema.filter(a => a.length > 1 && typeof a[1] === "function");
		const missingValues = [];
		functionArgs.forEach(a => {
			const index = ns.args.findIndex(arg => arg === `--${a[0]}`);
			if (index === -1) return;
			else if (index === ns.args.length - 1) missingValues.push(a);
			else if (ns.args[index + 1].startsWith("--")) missingValues.push(a);
		})

		if (missingValues.length > 0) {
			missingValues.forEach(a => ns.tprint("Missing required value for argument --" + a[0]));
			ns.exit();
		}
	}

	/**
	 * Internal use only
	 */
	_getSuggestions(data, args, arg) {
		if (typeof arg === "undefined" || arg.length === 1) {
			data.flags(this.schema.filter(s => !args.some(a => a === `--${s[0]}`)));
			return [];
		}

		if (typeof arg[1] === "boolean") return [!arg[1]];
		if (typeof arg[1] === "function") return arg[1](data);

		data.flags(this.schema.filter(s => !args.some(a => a === `--${s[0]}`)));
		return [];
	}

	/**
	 * Enable autocomplete. Use like this:
	 * 
	 * ```
	 * export function autocomplete(data, args) {
	 *	return a.autocomplete(data, args);
	 * }
	 * ```
	 */
	autocomplete(data, args) {
		const lastArg = args[args.length - 1];
		let arg = this.schema.find(a => `--${a[0]}` === lastArg);

		if (typeof arg === "undefined") {
			const previousArg = args[args.length - 2];
			arg = this.schema.find(a => `--${a[0]}` === previousArg);

			if (this._getSuggestions(data, args, arg).some(s => s === lastArg)) return this._getSuggestions(data, args)
		}

		return this._getSuggestions(data, args, arg)
	}

	/**
	 * Get an object with all the arguments.
	 * 
	 * Unsupplied arguments will use default values. If no default is provided,
	 * the script will print the missing args and exit at this point.
	 * 
	 * @param {NS} ns
	 */
	getOptions(ns) {
		this._checkRequired(ns);
		const formatted = this.schema.map(a => {
			if (a.length === 1) return [a[0], false];
			if (typeof a[1] === "function") return [a[0], null]
			return a;
		});
		return ns.flags(formatted);
	}
}