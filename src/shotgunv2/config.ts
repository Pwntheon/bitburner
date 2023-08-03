const types = ['hack', 'weaken1', 'grow', 'weaken2'];
const scriptNames: { [name: string]: string } = {
  hack: 'shotgun/utils/hack.js',
  weaken1: 'shotgun/utils/weaken.js',
  grow: 'shotgun/utils/grow.js',
  weaken2: 'shotgun/utils/weaken.js',
};

const ramCosts = {
  hack: 1.7,
  weaken1: 1.75,
  grow: 1.75,
  weaken2: 1.75,
};

const offsets = {
  hack: 0,
  weaken1: 1,
  grow: 2,
  weaken2: 3,
};

const initialDelay = 100;
const spacer = 20;
const growthHeadroom = 1.05;
const weakenHeadroom = 1.05;

export { types, scriptNames, ramCosts, offsets };