const R = require("ramda");
const pg = require("pg");
const mustache = require("mustache");
const path = require("path");
const fs = require("fs");
const url = require("url");
const readdir = require("recursive-readdir-sync");
const debug = require("debug");

const info = debug("postache:info");
const sensitive = debug("postache:sensitive");
const error = debug("postache:error");

const dollarFollowedByAscii = /\$([a-zA-Z0-9_\.]+)/g;

const urlToObj = (conStr) => {
  if (typeof conStr !== "string") {
    return conStr;
  }

  const conParams = url.parse(conStr, true);
  const auth = conParams.auth.split(':');

  return {
    user: auth[0],
    password: auth[1],
    host: conParams.hostname,
    port: conParams.port,
    database: conParams.pathname.split('/')[1],
    ssl: !!conParams.query.ssl,
    min: conParams.query.min && +conParams.query.min,
    max: conParams.query.max && +conParams.query.max,
    idleTimeoutMillis: conParams.query.idleTimeoutMillis && +conParams.query.idleTimeoutMillis,
  };
};

module.exports = exports = (queries, context, databaseUrl) => {
  const db = new pg.Pool(urlToObj(databaseUrl));

  db.on("error", function (err, client) {
    error("idle client error: %s %j", err.message, err.stack);
  });

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
