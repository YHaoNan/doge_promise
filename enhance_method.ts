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
    let fulfilledCnt = 0;
    let fulfilledValues = [];
    promises.forEach((p, i) => {
      setTimeout(() => {
        p.then(
          (value) => {
            fulfilledValues[i] = value;
            fulfilledCnt++;
            if (fulfilledCnt === promises.length) {
              resolve(fulfilledValues);
            }
          },
          (reason) => {
            reject(reason);
          }
        );
      });
    });
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
