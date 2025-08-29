import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL // ← Variable à définir dans Netlify
});

export async function handler(event, context) {
  try {
    const result = await pool.query(`
      SELECT id, titre, source, description, tags, poster
      FROM videos
      WHERE statut = 'valide'
      ORDER BY created_at DESC
      LIMIT 100
    `);

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    console.error("Erreur getVideos:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur" })
    };
  }
}
