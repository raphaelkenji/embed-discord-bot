const client = require('./database');
const cache = require('./cache');

// TODO: Look into cache setup.

async function fetchMany() {
    const res = await client.query('SELECT * FROM users');
    return res.rows;
}

async function fetchOne(id) {
    let user = cache.get(`user_${id}`);
    if (!user) {
        const res = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        if (!res.rows[0]) {
            user = await create({ id: id, activated: true });
        } else {
            user = res.rows[0];
        }
    }
    cache.set(`user_${id}`, user);
    return user;
}

async function create(user) {
    const res = await client.query('INSERT INTO users (id, activated) VALUES ($1, $2) RETURNING *', [user.id, user.activated]);
    return res.rows[0];
}

async function update(id, user) {
    const res = await client.query('UPDATE users SET activated = $1 WHERE id = $2 RETURNING *', [user.activated, id]);
    cache.set(`user_${id}`, res.rows[0]);
    return res.rows[0];
}

module.exports = {
    fetchMany,
    fetchOne,
    create,
    update,
};