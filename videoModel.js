const pool = require('neon');

async function insertVideo({ title, url }) {
  const query = 'INSERT INTO videos (title, url) VALUES ($1, $2)';
  await pool.query(query, [title, url]);
}

async function getVideos() {
  const result = await pool.query('SELECT * FROM videos ORDER BY created_at DESC');
  return result.rows;
}

module.exports = { insertVideo, getVideos };
