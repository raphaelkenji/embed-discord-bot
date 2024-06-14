const client = require('./database');
const cache = require('./cache');

// TODO: Look into cache setup.

async function fetchMany() {
    const res = await client.query('SELECT * FROM urls');
    return res.rows;
}

async function fetchOne(id) {
    const res = await client.query('SELECT * FROM urls WHERE id = $1', [id]);
    return res.rows[0];
}

async function create(url) {
    const res = await client.query('INSERT INTO urls (original_url, regex, replacement_url) VALUES ($1, $2, $3) RETURNING *', [url.original_url, url.regex, url.replacement_url]);
    cache.set(`platforms`, await fetchMany());
    return res.rows[0];
}

async function update(id, url) {
    const res = await client.query('UPDATE urls SET original_url = $1, regex = $2, replacement_url = $3 WHERE id = $4 RETURNING *', [url.original_url, url.regex, url.replacement_url, id]);
    cache.set(`platforms`, await fetchMany());
    return res.rows[0];
}

async function remove(id) {
    const res = await client.query('DELETE FROM urls WHERE id = $1', [id]);
    cache.set(`platforms`, await fetchMany());
    return res.rowCount > 0;
}

module.exports = {
    fetchMany,
    fetchOne,
    create,
    update,
    remove,
};
