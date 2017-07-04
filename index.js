const R = require("ramda");
const pg = require("pg");
const mustache = require("mustache");
const fs = require("fs");
const url = require("url");
const readdir = require("recursive-readdir-sync");
const debug = require("debug");

const info = debug("postache:info");
const sensitive = debug("postache:sensitive");
const error = debug("postache:error");

const dollarFollowedByAscii = /\$([a-zA-Z0-9_.]+)/g;

/* Remove the password from a given url string
*/
const obscurePassword = (conStr, password) => {
  if (password === "") return conStr;
  return conStr.replace(password, "\x1B[31m{password omitted}\x1B[39m");
};

const urlToObj = conStr => {
  if (typeof conStr !== "string") {
    return conStr;
  }

  const conParams = url.parse(conStr, true);

  const hasAuth = conParams.auth !== null;

  const auth = {
    username: "",
    password: ""
  };

  if (hasAuth) {
    if (conParams.auth.indexOf(":") === -1) {
      auth.username = conParams.auth;
      info("No password supplied, using only username");
    } else {
      auth.username = conParams.auth.split(":")[0];
      auth.password = conParams.auth.split(":")[1];
    }
  } else {
    info("No username or password supplied, using blank name and password");
  }

  if (conParams.pathname === null) {
    error(
      `
You must define a valid database url!
A database URL looks like: 
  postgres://localhost/omni/
But you gave me:
  ${obscurePassword(conStr, auth.password)}
    `.trim()
    );
    throw new Error("Invalid database URL!");
  }

  return {
    user: auth[0],
    password: auth[1],
    host: conParams.hostname,
    port: conParams.port,
    database: conParams.pathname.split("/")[1],
    ssl: !!conParams.query.ssl,
    min: conParams.query.min && +conParams.query.min,
    max: conParams.query.max && +conParams.query.max,
    idleTimeoutMillis:
      conParams.query.idleTimeoutMillis && +conParams.query.idleTimeoutMillis
  };
};

module.exports = (queries, context, databaseUrl) => {
  const db = new pg.Pool(urlToObj(databaseUrl));

  db.on("error", err => {
    error("idle client error: %s %j", err.message, err.stack);
  });

  const renderedQueries = R.mapObjIndexed(
    query => mustache.render(query, context, queries),
    queries
  );

  const queryWithObj = objQuery => argsObj => {
    const args = [];
    const pgQuery = objQuery.replace(dollarFollowedByAscii, (_, name) => {
      args.push(R.path(name.split("."), argsObj));
      return `$${args.length}`;
    });
    info("Running query: %s", pgQuery);
    sensitive("Args: %j", args);
    return db.query(pgQuery, args).catch(e => {
      error("Postache error: %j", e);
      return Promise.reject(e);
    });
  };

  return Object.assign(
    { query: db.query.bind(db), db },
    R.mapObjIndexed(queryWithObj, renderedQueries)
  );
};

module.exports.loadDir = (dir, extOption) => {
  let ext = extOption || ".sql";
  if (ext[0] !== ".") {
    ext = `.${ext}`;
  }
  const isSqlFile = new RegExp(`.*\\${ext}$`);

  return readdir(dir)
    .filter(file => file.match(isSqlFile))
    .reduce((files, filePath) => {
      const name = filePath.replace(`${dir}/`, "").replace(ext, "");
      return Object.assign(files, {
        [name]: fs.readFileSync(filePath, { encoding: "utf8" })
      });
    }, {});
};
