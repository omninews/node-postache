const R = require("ramda");
const pg = require("pg-then");
const mustache = require("mustache");
const path = require("path");
const fs = require("fs");
const readdir = require("recursive-readdir-sync");
const debug = require("debug");

const info = debug("postache:info");
const sensitive = debug("postache:sensitive");
const error = debug("postache:error");

const dollarFollowedByAscii = /\$([a-zA-Z0-9_\.]+)/g;

module.exports = exports = (queries, context, databaseUrl) => {
  const db = pg.Pool(databaseUrl);

  const renderedQueries = R.mapObjIndexed((query) => {
    return mustache.render(query, context, queries);
  }, queries);

  const queryWithObj = objQuery => (argsObj) => {
    const args = [];
    const pgQuery = objQuery.replace(dollarFollowedByAscii, (_, name) => {
      args.push(R.path(name.split("."), argsObj));
      return `$${args.length}`;
    });
    info("Running query: %s", pgQuery);
    sensitive("Args: %j", args);
    return db.query(pgQuery, args)
    .catch((e) => {
      error("Postache error: %j", e);
      return Promise.reject(e);
    });
  };

  return Object.assign(
    { query: db.query.bind(db), db },
    R.mapObjIndexed(queryWithObj, renderedQueries)
  );
};

exports.loadDir = (dir, ext) => {
  ext = ext || ".sql";
  if(ext[0] !== ".") {
    ext = `.${ext}`;
  }
  const isSqlFile = new RegExp(`.*\\${ext}`);

  return readdir(dir)
    .filter(R.match(isSqlFile))
    .reduce((files, filePath) => {
      const name = filePath.replace(dir + "/", "").replace(ext, "");
      return Object.assign(files, {
        [name]: fs.readFileSync(filePath, { encoding: "utf8" }),
      });
    }, {});
};
