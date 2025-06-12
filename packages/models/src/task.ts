/**
 * Stage of task
 *
 * @public
 */
export enum TaskStage {
  /**
   * Task is pending, means it just start executing
   */
  Pending = 0,
  /**
   * Task is succeed
   */
  Resolved = 1,
  /**
   * Task is failed
   */
  Rejected = 2,
  /**
   * Task is aborted
   */
  Aborted = 3,
}

export interface TaskError<D> {
  /**
   * task error type
   */
  type: 'reject' | 'abort';
  /**
   * task error
   */
  reason: D;
}

/**
 * callback that will be called when task is resolved
 *
 * @public
 */
export type ResolvedCallback<R> = (r: R) => void;

/**
 * callback that will be called when task is rejected
 *
 * @public
 */
export type RejectedCallback<D> = (e: TaskError<D>) => void;

/**
 * Task state in different stage
 *
 * @public
 */
export type TaskState<R, D> =
  | {
      stage: TaskStage.Pending;
    }
  | {
      stage: TaskStage.Resolved;
      result: R;
    }
  | {
      stage: TaskStage.Rejected;
      reason: D;
    }
  | {
      stage: TaskStage.Aborted;
      reason: D;
    };

export class TaskAbortedError extends Error {
  constructor(reason: string) {
    super(`Task aborted: ${reason}`);
    this.name = 'TaskAbortedError';
  }
}

export class TaskRejectedError extends Error {
  constructor(reason: string) {
    super(`Task rejected: ${reason}`);
    this.name = 'TaskRejectedError';
  }
}

/**
 * Base class of task
 *
 * @public
 */
export class Task<R, D> {
  state: TaskState<R, D> = {
    stage: TaskStage.Pending,
  };
  /**
   * callbacks that will be executed when task is resolved
   */
  resolvedCallbacks: ResolvedCallback<R>[] = [];
  /**
   * callbacks that will be executed when task is rejected
   */
  rejectedCallbacks: RejectedCallback<D>[] = [];

  /**
   * Promise that will be resolved when task is settled
   */
  private _promise: Promise<R> | null = null;

  /**
   * Convert task to promise
   * @returns promise that will be resolved when task is settled
   */
  toPromise(): Promise<R> {
    if (!this._promise) {
      this._promise = new Promise((resolve, reject) => {
        this.wait(
          (result) => resolve(result),
          (error) => {
            if (error.type === 'abort') {
              reject(new TaskAbortedError(error.reason as string));
            } else {
              reject(new TaskRejectedError(error.reason as string));
            }
          },
        );
      });
    }
    return this._promise;
  }

  /**
   * wait for task to be settled
   * @param resolvedCallback - callback for resolved value
   * @param rejectedCallback - callback for rejected value
   */
  wait(resolvedCallback: ResolvedCallback<R>, rejectedCallback: RejectedCallback<D>) {
    switch (this.state.stage) {
      case TaskStage.Pending:
        this.resolvedCallbacks.push(resolvedCallback);
        this.rejectedCallbacks.push(rejectedCallback);
        break;
      case TaskStage.Resolved:
        resolvedCallback(this.state.result);
        break;
      case TaskStage.Rejected:
        rejectedCallback({
          type: 'reject',
          reason: this.state.reason,
        });
        break;
      case TaskStage.Aborted:
        rejectedCallback({
          type: 'abort',
          reason: this.state.reason,
        });
        break;
    }
  }

  /**
   * resolve task with specific result
   * @param result - result value
   */
  resolve(result: R) {
    if (this.state.stage === TaskStage.Pending) {
      this.state = {
        stage: TaskStage.Resolved,
        result,
      };
      for (const resolvedCallback of this.resolvedCallbacks) {
        try {
          resolvedCallback(result);
        } catch (e) {
          /* ignore */
        }
      }
      this.resolvedCallbacks = [];
      this.rejectedCallbacks = [];
    }
  }

  /**
   * reject task with specific reason
   * @param reason - abort reason
   *
   */
  reject(reason: D) {
    if (this.state.stage === TaskStage.Pending) {
      this.state = {
        stage: TaskStage.Rejected,
        reason,
      };
      for (const rejectedCallback of this.rejectedCallbacks) {
        try {
          rejectedCallback({
            type: 'reject',
            reason,
          });
        } catch (e) {
          /*ignore */
        }
      }
      this.resolvedCallbacks = [];
      this.rejectedCallbacks = [];
    }
  }

  /**
   * abort task with specific reason
   * @param reason - abort reason
   */
  abort(reason: D) {
    if (this.state.stage === TaskStage.Pending) {
      this.state = {
        stage: TaskStage.Aborted,
        reason,
      };
      for (const rejectedCallback of this.rejectedCallbacks) {
        try {
          rejectedCallback({
            type: 'abort',
            reason,
          });
        } catch (e) {
          /* ignore */
        }
      }
      this.resolvedCallbacks = [];
      this.rejectedCallbacks = [];
    }
  }

  /**
   * fail task with a TaskError from another task
   * This is a convenience method for error propagation between tasks
   * @param error - TaskError from another task
   */
  fail(error: TaskError<D>) {
    if (error.type === 'abort') {
      this.abort(error.reason);
    } else {
      this.reject(error.reason);
    }
  }
}

/**
 * Type that represent the result of executing task
 */
export type TaskReturn<T extends Task<any, any>> =
  T extends Task<infer R, infer E>
    ? { type: 'result'; value: R } | { type: 'error'; value: TaskError<E> }
    : never;
