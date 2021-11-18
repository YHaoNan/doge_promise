import { DogePromise, State } from "./doge_promise";

function resolve(value: any): DogePromise {
  return new DogePromise((resolve, _) => {
    resolve(value);
  });
}

function reject(reason: any): DogePromise {
  return new DogePromise((_, reject) => {
    reject(reason);
  });
}

function all(promises: DogePromise[]): DogePromise {
  return new DogePromise((resolve, reject) => {
    // 将reject和resolve分离处理
    (function checkReject(i: number) {
      // 分离处理和这里的setTimeout都是为了保证发现按时间顺序最先rejected的Promise并直接reject
      // 如果同步执行，那么它发现的是按下标顺序的第一个reject的而不是按reject时间的
      setTimeout(() => {
        if (i < promises.length) {
          promises[i].then(null, function onRejected(reason) {
            reject(reason);
          });
          checkReject(i + 1);
        }
      });
    })(0);

    // 这里检测resolve
    let resolveValues = [];
    (function checkResolve(i: number) {
      if (i < promises.length) {
        promises[i].then((value) => {
          resolveValues.push(value);
          checkResolve(i + 1);
        }, null);
      } else {
        // 如果能走到这里，那么肯定所有promise都resolve了，所以无需再判断resolveValues的长度
        resolve(resolveValues);
      }
    })(0);
  });
}

function race(promises: DogePromise[]): DogePromise {
  return new DogePromise((resolve, reject) => {
    for (let p of promises) {
      setTimeout(() => {
        p.then(
          (value) => {
            resolve(value);
          },
          (reason) => {
            reject(reason);
          }
        );
      });
    }
  });
}

function allSettled(promises: DogePromise[]): DogePromise {
  return new DogePromise((resolve, reject) => {
    let result = [];
    promises.forEach((p, i) => {
      p.then(
        (value) => {
          result.push({
            status: "fulfilled",
            value,
          });
          if (i == promises.length - 1) resolve(result);
        },
        (reason) => {
          result.push({
            status: "rejected",
            reason,
          });
          if (i == promises.length - 1) resolve(result);
        }
      );
    });
  });
}

function any(promises: DogePromise[]): DogePromise {
  return new DogePromise((resolve, reject) => {
    let rejectedReasons = [];
    let rejectedCnt = 0;
    promises.forEach((p, i) => {
      setTimeout(() => {
        p.then(
          (value) => {
            resolve(value);
          },
          (reason) => {
            rejectedReasons[i] = reason;
            rejectedCnt++;
            if (rejectedCnt === promises.length) {
              reject(rejectedReasons);
            }
          }
        );
      });
    });
  });
}
export { resolve, reject, all, race, allSettled, any };
