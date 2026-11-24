/* node:assert/strict, except that long strings (canvas data URLs) are compared
   by hash. A failed picture comparison then prints two short hashes instead of
   megabytes of image data, which keeps logs and agent sessions small. */
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const short = (value) =>
  typeof value === "string" && value.length > 200
    ? `<${value.length} characters, sha1 ${crypto.createHash("sha1").update(value).digest("hex").slice(0, 12)}>`
    : value;
const quiet = (compare) => (actual, expected, message) =>
  compare(short(actual), short(expected), message);
module.exports = Object.assign((...args) => assert(...args), assert, {
  equal: quiet(assert.equal),
  notEqual: quiet(assert.notEqual),
  strictEqual: quiet(assert.strictEqual),
  notStrictEqual: quiet(assert.notStrictEqual),
});
