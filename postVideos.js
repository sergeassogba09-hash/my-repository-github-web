import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { titre, source, description, tags } = data;

    if (!titre || !source || !description) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Champs requis manquants" })
      };
    }

    const result = await pool.query(
      `INSERT INTO videos (titre, source, description, tags, statut)
       VALUES ($1, $2, $3, $4, 'en_attente') RETURNING id`,
      [titre, source, description, tags]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: result.rows[0].id })
    };
  } catch (error) {
    console.error("Erreur postVideo:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur" })
    };
  }
}
