# Postache

## Example

Instead of 
```js
db.query("select * from articles offset $1 limit $2",
  [params.offset, params.limit])
```

you simply define your db like this:

```js
const db = postache(postache.loadDir(path.join(__dirname, "queries")), {
  articlesTable: "articles",
}, connectionString)
db.getLatestArticles(params)
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
