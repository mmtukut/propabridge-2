const { query } = require('../config/db');

class Conversation {
  // Create a new conversation
  static async create({ phone, message, intent, response }) {
    const result = await query(
      `INSERT INTO conversations (phone, message, intent, response, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [phone, message, intent, response]
    );
    return result.rows[0];
  }

  // Get conversation history for a phone number
  static async findByPhone(phone, limit = 10) {
    const result = await query(
      `SELECT * FROM conversations 
       WHERE phone = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [phone, limit]
    );
    return result.rows;
  }

  // Get conversation by ID
  static async findById(id) {
    const result = await query('SELECT * FROM conversations WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Update conversation with AI response
  static async updateWithResponse(id, { intent, response }) {
    const result = await query(
      `UPDATE conversations 
       SET intent = $1, response = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [intent, response, id]
    );
    return result.rows[0];
  }

  // Get conversation statistics
  static async getStats(timePeriod = '24 hours') {
    const result = await query(
      `SELECT 
         COUNT(*) as total_conversations,
         COUNT(DISTINCT phone) as unique_users,
         intent,
         DATE(created_at) as date
       FROM conversations
       WHERE created_at >= NOW() - $1::interval
       GROUP BY intent, DATE(created_at)
       ORDER BY date DESC`,
      [timePeriod]
    );
    return result.rows;
  }
}

module.exports = Conversation;
