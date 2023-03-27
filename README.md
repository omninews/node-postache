# Postache

## Configuration

```js
const postache = require("postache")

// this is a pg config object, check the offical documentation: https://node-postgres.com/features/connecting#programmatic
const pgConfig = {
  connectionString: "postgres://localhost:5432/mydb",
  ssl: {
    ca: fs.readFileSync("ca.pem").toString(),
  }
}

const db = postache(
  postache.loadDir(path.join(__dirname, "queries")), 
  {
    articlesTable: "articles",
  }, 
  pgConfig
)
```

> Note: Older version of this library used custom connection strings which is no longer supported.
> You can pass a [pg config object](https://node-postgres.com/features/connecting#programmatic) to the
> `postache` function instead.
> 
> ```js
> const postache = require("postache")
> 
> const connectionString = "postgres://localhost:5432/mydb"
> 
> const pgConfig = {
>   ssl: {
>     ca: fs.readFileSync("ca.pem").toString(),
>   }
> }
> 
> const db = postache(
>   postache.loadDir(path.join(__dirname, "queries")), 
>   {
>     articlesTable: "articles",
>   }, 
>   connectionString, 
>   pgConfig // <--- this is optional parameter that will override pg config created from connection string
> )
> 

## Usage

Instead of 
```js
db.query("select * from articles offset $1 limit $2",
  [params.offset, params.limit])
```

and in the queries fold your have a file `getArticles.sql`:

```sql
select * from {{articlesTable}}
{{> _paging}}
```

and a file `_paging.sql` which contains:

```sql
offset $offset
limit $limit
```

This is compiled to:

```sql
select * from articles
offset $offset
limit $limit
```

Which you call like this:

```js
db.getArticles({
  offset: 0,
  limit: 10,
})
```
