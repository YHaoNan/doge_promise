import {
  PromiseResolveValueHandler,
  ThenableResolveValueHandler,
  DefaultResolveValueHandler,
} from "./resolve_value_handler";

import * as EH from "./enhance_method";

enum State {
  PENDING = "pending",
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
}

const resolveValueHandlerChain = [
  new PromiseResolveValueHandler(),
  new ThenableResolveValueHandler(),
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
      // 先看后边。。。
      // 这里是决议处理函数，如果调用then时，promise已经被决议，则立即执行，否则等到决议时被执行
      let handleWhenPromiseIsResolved = () => {
        // 这里是回调调用函数，函数会对比当前决议状态是不是目标状态，如果是就回调对应的回调函数，并根据返回值正确的决议then的返回Promise
        let callbackIfCurrentStateIs = (
          targetState: State,
          targetCallback: any,
          currentResolveValue: any,
          penetrate: (x: any) => void
        ) => {
          // 如果当前状态不是目标状态，直接退出
          if (this.state != targetState) return;
          setTimeout(() => {
            // 如果目标回调函数不是一个函数，那么向下渗透当前的决议值或失败原因
            if (typeof targetCallback != "function") {
              penetrate(currentResolveValue);
              return;
            }
            // 如果目标回调是一个函数，调用回调，将返回值作为返回Promise的决议值，如果调用出现异常，将异常作为返回Promise的拒绝原因
            // 特别的，如果发现链式决议，那么reject TypeError
            let result;
            try {
              result = targetCallback(currentResolveValue);
              if (result === p)
                throw new TypeError(
                  "Chaining cycle detected for promise #<Promise>"
                );
              resolve(result);
            } catch (e) {
              reject(e);
            }
          });
        };

        // 如果当前状态是FULFILLED，回调onFulfilled方法
        callbackIfCurrentStateIs(
          State.FULFILLED,
          onFulfilled,
          this.value,
          resolve
        );
        // 如果当前状态是REJECTED，回调onRejected方法
        callbackIfCurrentStateIs(
          State.REJECTED,
          onRejected,
          this.reason,
          reject
        );
        // 注意，状态只有一个，也就是说上面两个方法实际上只有一个会调用回调函数，另一个会直接放弃
      };

      // 先看这里，如果当前是pending状态，那么添加决议监听器，当决议时调用决议处理函数
      if (this.state === State.PENDING) {
        this.onPromiseResolvedListeners.push(handleWhenPromiseIsResolved);
      } else {
        // 如果已经决议，直接调用决议处理函数
        handleWhenPromiseIsResolved();
      }
    });
    return p;
  }

  public static resolve(value: any): DogePromise {
    return EH.resolve(value);
  }
  public static reject(reason: any): DogePromise {
    return EH.reject(reason);
  }
  public static all(promises: DogePromise[]): DogePromise {
    return EH.all(promises);
  }
  public static race(promises: DogePromise[]): DogePromise {
    return EH.race(promises);
  }
}

export { State, DogePromise };
