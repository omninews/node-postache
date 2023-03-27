/* global describe, it */
const assert = require("assert");
const postache = require("../index");

describe("postache", () => {
  it("should crash if no database was given", () => {
    assert.throws(
      () => postache([], [], "postgres://some.url"),
      Error,
      "Invalid database URL!"
    );
  });

  it("should not crash if no auth was given", done => {
    postache([], [], "postgres://some.url/omni");
    done();
  });

  it("should not crash if only username was given", done => {
    postache([], [], "postgres://username@some.url/omni");
    done();
  });

  it("should not crash if auth was given", done => {
    postache([], [], "postgres://username:password@some.url/omni");
    done();
  });

  it("should override configs passed", done => {
    const config = {
      user: "user",
      password: "password",
      port: 1234
    };

    const result = postache(
      [],
      [],
      "postgres://username:test@test:5432/test",
      config
    );

    assert.equal(result.db.options.user, config.user);
    assert.equal(result.db.options.password, config.password);
    assert.equal(result.db.options.host, "test");
    assert.equal(result.db.options.port, config.port);
    assert.equal(result.db.options.database, "test");

    done();
  });

  it("should accept an object as pg connection configuration", done => {
    const config = {
      user: "user",
      password: "password",
      port: 1234
    };

    const result = postache([], [], config);

    assert.equal(result.db.options.user, config.user);
    assert.equal(result.db.options.password, config.password);
    assert.equal(result.db.options.port, config.port);

    done();
  });

  it("should accept connection string url", done => {
    const result = postache(
      [],
      [],
      "postgres://username:password@some.url/omni"
    );

    assert.equal(result.db.options.user, "username");
    assert.equal(result.db.options.password, "password");
    assert.equal(result.db.options.host, "some.url");
    assert.equal(result.db.options.database, "omni");

    done();
  });
});

describe("loadDir", () => {
  it("should only load sql files by default", done => {
    const fileMap = postache.loadDir("./tests/fixtures");
    assert.equal(Object.keys(fileMap).length, 1);
    assert.equal(fileMap["tests/fixtures/example"], "example");
    done();
  });

  it("should load other files you tell it to", done => {
    const fileMap = postache.loadDir("./tests/fixtures", "json");
    assert.equal(Object.keys(fileMap).length, 1);
    assert.equal(fileMap["tests/fixtures/not_sql"], "not_sql");
    done();
  });

  it("should only match against the extension", done => {
    const fileMap = postache.loadDir("./tests/fixtures", ".");
    assert.equal(Object.keys(fileMap).length, 0);
    done();
  });

  it("should load wildcard files you tell it to", done => {
    const fileMap = postache.loadDir("./tests/fixtures", "json|sql");
    assert.equal(Object.keys(fileMap).length, 2);
    assert.equal(fileMap["tests/fixtures/not_sql.json"], "not_sql");
    assert.equal(fileMap["tests/fixtures/example.sql"], "example");
    done();
  });
});
