export interface GenericStringRecord {
  [name: string]: number | string
}

export type BatcherState = {
  target: string,
  hackStart: number,
  prepTarget: string,
  prepStarted: number,
  prepDone: number,
  income: number,
  dropped: number,
  ramUsage: number
} & GenericStringRecord;
 
export const BatcherStateDefaults: BatcherState = {
  target: "",
  hackStart: 0,
  prepTarget: "",
  prepStarted: 0,
  prepDone: 0,
  income: 0,
  dropped: 0,
  ramUsage: 0
};

export type State = BatcherState;

export type StatusMessage = {
  component: string,
  status: BatcherState
};