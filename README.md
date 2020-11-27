# mem (Redis version)
A function wrapper for [`mem`](https://github.com/sindresorhus/mem) module which use redis for the cache store. All parameters same as `mem` module but you can't select the cache store.

## Install
```bash
$ npm install --save mem-redis
```

## Usage
```javascript
const mem = require("mem-redis");

mem.connect("redis://localhost:6379"); // if you setted the connection string at `process.env.REDIS_CONNECTION_STRING`, ignore it

let test = (function () {
    let count = 0;
    return async function () {
        return count++;
    };
})();

test = mem(test, { maxAge: 5000 }); // Cache for 5 seconds

void async function(){

    await test("foo"); // return 0
    await test("foo"); // return 0 because the the result has cached

    await test("bar"); // return 1 and the result has been cached

}();
```

## ToDo List
A clear declaration file for this module.

## License
This software is released under the MIT license. See the [license file](LICENSE) for more details.