import PromiseAPlusTests from "promises-aplus-tests";
import { DogePromise } from "./doge_promise";

const adapter = {
  resolved(value) {
    return new DogePromise((resolve, reject) => {
      resolve(value);
    });
  },
  rejected(reason) {
    return new DogePromise((resolve, reject) => {
      reject(reason);
    });
  },
  deferred() {
    let dfd: any = {};
    dfd.promise = new DogePromise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
    });
    return dfd;
  },
};
PromiseAPlusTests(adapter, function (err) {
  console.log(err);
});
