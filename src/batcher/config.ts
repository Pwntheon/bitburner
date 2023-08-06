export type jobType = "hack" | "weaken1" | "grow" | "weaken2";

const jobTypes: jobType[] = ['hack', 'weaken1', 'grow', 'weaken2'];
const scriptNames: Record<jobType, string> = {
  hack: 'batcher/remote/hack.js',
  weaken1: 'batcher/remote/weaken.js',
  grow: 'batcher/remote/grow.js',
  weaken2: 'batcher/remote/weaken.js',
}; 

const ramCosts: Record<jobType, number> = {
  hack: 1.7,
  weaken1: 1.75,
  grow: 1.75,
  weaken2: 1.75,
};

const offsets: Record<jobType, number> = {
  hack: 0,
  weaken1: 1,
  grow: 2,
  weaken2: 3,
};


const initialDelay = 100;
const spacer = 20;
const growthHeadroom = 1.01;
const weakenHeadroom = 1.01;
const greedIncrement = 0.01;
const prepLeeway = 0.0001;
const maxPrepCost = 0.25;

export {
  jobTypes,
  scriptNames,
  ramCosts,
  offsets,
  initialDelay,
  spacer,
  growthHeadroom,
  weakenHeadroom,
  greedIncrement,
  prepLeeway,
  maxPrepCost
};