import { Pool } from 'pg';
import { User, CreateUserData, UpdateUserData } from '../types';

export class UserModel {
  constructor(private db: Pool) {}

  async findAll(): Promise<User[]> {
    const result = await this.db.query('SELECT * FROM users');
    return result.rows;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(userData: CreateUserData): Promise<User> {
    const result = await this.db.query(
      'INSERT INTO users (id, activated) VALUES ($1, $2) RETURNING *',
      [userData.id, userData.activated]
    );
    return result.rows[0];
  }

  async update(id: string, userData: UpdateUserData): Promise<User | null> {
    const result = await this.db.query(
      'UPDATE users SET activated = $1 WHERE id = $2 RETURNING *',
      [userData.activated, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db.query('SELECT 1 FROM users WHERE id = $1 LIMIT 1', [id]);
    return result.rows.length > 0;
  }
}