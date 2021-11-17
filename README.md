# DogePromise

一个简单的 Promise 实现

- [笔记：使用 TypeScript 手写 Promise（通过官方 872 个测试）](https://www.cnblogs.com/lilpig/p/15567559.html)

运行测试

```bash
npm install
npm i ts-node -g
# 运行官方872个测试
ts-node test.ts
```

使用

```ts
import { DogePromise } from "./doge_promise";

let p = new DogePromise((resolve, reject) => {
  resolve(123);
}).then((value) => {
  console.log(value);
}, null);
```
