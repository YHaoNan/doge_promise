import { State, DogePromise } from "./doge_promise";

interface ResolveValueHandler {
  // 该处理器的名称，其实并没什么用
  name: string;

  /**
   * 处理器估计是否可以处理这个决议值
   * @param resolveValue 决议值
   * @returns 如果该处理器认为自己应该可以处理这个决议值，那么返回true，如果该处理器认为自己无法处理这个决议值，返回false
   */
  canResolve(resolveValue: any): boolean;

  /**
   * 尝试处理决议值
   * @param resolveValue 决议值
   * @param changeState 修改状态的函数
   * @param resolve 决议函数，主要用于递归决议
   * @param reject 拒绝函数
   * @returns 如果处理成功，返回true，处理失败，返回false
   *      一旦该方法返回true，那么必须保证已经调用了`changeState`或`reject`对Promise进行立即决议，或调用了`resolve`对Promise进行了递归决议
   */
  tryToResolve(
    resolveValue: any,
    changeState: (state: State, valueOrReason: any) => boolean,
    resolve: (resolveValue: any) => void,
    reject: (reason: any) => void
  );
  /**
   * 对于一个决议值，需要先调用处理器的`canResolve`方法，仅当`canResolve`返回true时，可以调用`tryToResolve`方法
   * 只有当`tryToResolve`返回true时，决议成功
   *
   * 调用者应保证调用`tryToResolve`之时，`canResolve`已经得到调用并返回true。
   * 所以`tryToResolve`方法可以默认`resolveValue`已经经过了`canResolve`中的全部校验，可以不再做这些校验了
   */
}

class PromiseResolveValueHandler implements ResolveValueHandler {
  name = "PromiseResolveValueHandler";
  canResolve(resolveValue: any): boolean {
    return resolveValue instanceof DogePromise;
  }
  tryToResolve(resolveValue, _, resolve, reject): boolean {
    // 跟踪状态
    resolveValue.then(
      (value) => {
        resolve(value);
      },
      (reason) => {
        reject(reason);
      }
    );
    return true;
  }
}

class ThenableResolveValueHandler implements ResolveValueHandler {
  name = "ThenableResolveValueHandler";
  canResolve(resolveValue: any): boolean {
    return resolveValue != null && resolveValue != undefined;
  }
  tryToResolve(resolveValue, _, resolve, reject): boolean {
    let isAlreadyResolved = false;
    function safeCallResolveMethod(method, arg) {
      if (isAlreadyResolved) return;
      isAlreadyResolved = true;
      method(arg);
    }

    // 如果不是对象或函数
    if (typeof resolveValue != "object" && typeof resolveValue != "function")
      return false;

    // 尝试访问then属性
    let then;
    try {
      then = resolveValue.then;
      // 如果then属性不是一个方法，那么认为`resolveValue`不是一个thenable，放弃尝试
      if (typeof then != "function") return false;

      // 尝试调用then.call
      then.call(
        resolveValue,
        (y) => {
          safeCallResolveMethod(resolve, y);
        },
        (y) => {
          safeCallResolveMethod(reject, y);
        }
      );
      // 尝试成功
      return true;
    } catch (e) {
      // 如果访问then属性或调用then方法抛出异常
      safeCallResolveMethod(reject, e);
      return true;
    }
  }
}

class DefaultResolveValueHandler implements ResolveValueHandler {
  name = "DefaultResolveValueHandler";
  canResolve(_: any): boolean {
    return true;
  }
  tryToResolve(resolveValue, changeState, resolve, reject): boolean {
    changeState(State.FULFILLED, resolveValue);
    return true;
  }
}

export {
  ResolveValueHandler,
  PromiseResolveValueHandler,
  ThenableResolveValueHandler,
  DefaultResolveValueHandler,
};
