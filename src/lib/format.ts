/**
 * Return a formatted representation of the monetary amount using scale sympols (e.g. $6.50M)
 * @param {number} num - The number to format
 * @param {number=} maxSignificantFigures - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 **/
export function formatMoney(num: number, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
    let numberShort = formatNumberShort(num, maxSignificantFigures, maxDecimalPlaces);
    return num >= 0 ? "$" + numberShort : numberShort.replace("-", "-$");
}

const symbols = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "e33", "e36", "e39"];

/**
 * Return a formatted representation of the monetary amount using scale sympols (e.g. 6.50M) 
 * @param {number} num - The number to format
 * @param {number=} maxSignificantFigures - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 **/
export function formatNumberShort(num: number, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
    for (var i = 0, sign = Math.sign(num), num = Math.abs(num); num >= 1000 && i < symbols.length; i++) num /= 1000;
    // TODO: A number like 9.999 once rounted to show 3 sig figs, will become 10.00, which is now 4 sig figs.
    return ((sign < 0) ? "-" : "") + num.toFixed(Math.max(0, Math.min(maxDecimalPlaces, maxSignificantFigures - Math.floor(1 + Math.log10(num))))) + symbols[i];
}

const ramSuffixList = ["GB", "TB", "PB", "EB"];
export function formatRam(n: number) {
  // NaN does not get formatted
  if (Number.isNaN(n)) return `NaN${ramSuffixList[0]}`;
  const nAbs = Math.abs(n);

  // Special handling for Infinities
  if (nAbs === Infinity) return `${n < 0 ? "-∞" : ""}∞${ramSuffixList.at(-1)}`;

  let sign = n < 0 ? "-" : "";
  let displayNumber = n;
  let suffix = 0;
  while(displayNumber > 1000) {
    ++suffix;
    displayNumber /= 1000;
  }

  return `${sign}${displayNumber}${ramSuffixList[suffix]}`;
}

/** Format a duration (in milliseconds) as e.g. '1h 21m 6s' for big durations or e.g '12.5s' / '23ms' for small durations */
export function formatDuration(duration: number) {
    if (duration < 1000) return `${duration.toFixed(0)}ms`
    const portions = [];
    const msInHour = 1000 * 60 * 60;
    const hours = Math.trunc(duration / msInHour);
    if (hours > 0) {
        portions.push(hours + 'h');
        duration -= (hours * msInHour);
    }
    const msInMinute = 1000 * 60;
    const minutes = Math.trunc(duration / msInMinute);
    if (minutes > 0) {
        portions.push(minutes + 'm');
        duration -= (minutes * msInMinute);
    }
    // Include millisecond precision if we're on the order of seconds
    let useMs = (hours == 0 && minutes == 0);
    let seconds = (duration / 1000.0)
    const displaySeconds = useMs ? seconds.toPrecision(3) : seconds.toFixed(0);
    if (seconds > 1 || useMs && seconds > 0) {
        portions.push(displaySeconds + 's');
        duration -= (minutes * 1000);
    }
    return portions.join(' ');
}