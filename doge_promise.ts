import {
  PromiseValueResolveHandler,
  ThenableValueResolveHandler,
  DefaultResolveValueHandler,
} from "./resolve_value_handler";
enum State {
  PENDING = "pending",
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
}

const resolveValueHandlerChain = [
  new PromiseValueResolveHandler(),
  new ThenableValueResolveHandler(),
  new DefaultResolveValueHandler(),
];
class DogePromise {
  private state: State;
  private value: any;
  private reason: any;
  private onPromiseResolvedListeners: (() => void)[];

  constructor(
    initialTask: (
      resolve: (value: any) => void,
      reject: (reason: any) => void
    ) => void
  ) {
    this.state = State.PENDING;
    this.onPromiseResolvedListeners = [];
    try {
      initialTask(this.resolve.bind(this), this.reject.bind(this));
    } catch (e) {
      this.reject(e);
    }
  }

  /**
   * changeState修改当前Promise的状态
   * @param state 要进入的状态
   * @param valueOrReason 如果要进入fulfilled状态，那么需要一个Promise成功后的结果，如果要进入rejected状态，那么需要一个拒绝的原因
   * @returns 修改是否成功
   */
  private changeState(state: State, valueOrReason: any): boolean {
    if (this.state != State.PENDING || state == State.PENDING) return false;
    this.state = state;
    if (this.state === State.FULFILLED) this.value = valueOrReason;
    else this.reason = valueOrReason;

    this.onPromiseResolvedListeners.forEach((cb) => cb());
    return true;
  }

  private resolve(resolveValue: any) {
    for (let handler of resolveValueHandlerChain) {
      if (handler.canResolve(resolveValue)) {
        let resolved = handler.tryToResolve(
          resolveValue,
          this.changeState.bind(this),
          this.resolve.bind(this),
          this.reject.bind(this)
        );
        if (resolved) {
          break;
        }
      }
    }
  }

  private reject(reason: any) {
    this.changeState(State.REJECTED, reason);
  }

  public then(onFulfilled: any, onRejected: any): DogePromise {
    let p = new DogePromise((resolve, reject) => {
      let handleWhenPromiseIsResolved = () => {
        if (this.state === State.FULFILLED) {
          setTimeout(() => {
            // 向下渗透
            if (typeof onFulfilled != "function") {
              resolve(this.value);
              return;
            }
            let result;
            try {
              result = onFulfilled(this.value);
              if (result === p)
                throw new TypeError(
                  "Chaining cycle detected for promise #<Promise>"
                );
              resolve(result);
            } catch (e) {
              reject(e);
            }
          });
        } else if (this.state === State.REJECTED) {
          setTimeout(() => {
            // 向下渗透
            if (typeof onRejected != "function") {
              reject(this.reason);
              return;
            }
            let result;
            try {
              result = onRejected(this.reason);
              if (result === p)
                throw new TypeError(
                  "Chaining cycle detected for promise #<Promise>"
                );
              resolve(result);
            } catch (e) {
              reject(e);
            }
          });
        }
      };
      if (this.state === State.PENDING) {
        this.onPromiseResolvedListeners.push(handleWhenPromiseIsResolved);
      } else {
        handleWhenPromiseIsResolved();
      }
    });
    return p;
  }
}

export { State, DogePromise };
