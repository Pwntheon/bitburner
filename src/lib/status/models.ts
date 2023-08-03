export interface Indexable {
  [name: string]: number | string
}

export type BatcherState = {
  target: string,
  hackStart: number,
  prepTarget: string,
  prepDone: number,
  income: number,
  dropped: number,
  ramUsage: number
} & Indexable;

export type State = BatcherState;

export type StatusMessage = {
  component: string,
  status: BatcherState
};