/* global describe, it */
const assert = require("assert");
const postache = require("../index.js");


describe("postache", () => {
  it("should crash if no database was given", () => {
    assert.throws(
      () => postache([], [], "postgres://some.url"),
      Error,
      "Invalid database URL!"
    );
  });

  it("should not crash if no auth was given", (done) => {
    postache([], [], "postgres://some.url/omni");
    done();
  });

  it("should not crash if only username was given", (done) => {
    postache([], [], "postgres://username@some.url/omni");
    done();
  });

  it("should not crash if auth was given", (done) => {
    postache([], [], "postgres://username:password@some.url/omni");
    done();
  });
});


describe("loadDir", () => {
  it("should only load sql files by default", (done) => {
    const fileMap = postache.loadDir("./tests/fixtures");
    assert.equal(Object.keys(fileMap).length, 1);
    assert.equal(fileMap["tests/fixtures/example"], "example");
    done();
  });

  it("should load other files you tell it to", (done) => {
    const fileMap = postache.loadDir("./tests/fixtures", "json");
    assert.equal(Object.keys(fileMap).length, 1);
    assert.equal(fileMap["tests/fixtures/not_sql"], "not_sql");
    done();
  });

  it("should only match against the extension", (done) => {
    const fileMap = postache.loadDir("./tests/fixtures", ".");
    assert.equal(Object.keys(fileMap).length, 0);
    done();
  });

  it("should load wildcard files you tell it to", (done) => {
    const fileMap = postache.loadDir("./tests/fixtures", "json|sql");
    assert.equal(Object.keys(fileMap).length, 2);
    assert.equal(fileMap["tests/fixtures/not_sql.json"], "not_sql");
    assert.equal(fileMap["tests/fixtures/example.sql"], "example");
    done();
  });
});
