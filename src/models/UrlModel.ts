import { Pool } from 'pg';
import { Url, CreateUrlData, UpdateUrlData } from '../types';

export class UrlModel {
  constructor(private db: Pool) {}

  async findAll(): Promise<Url[]> {
    const result = await this.db.query('SELECT * FROM urls ORDER BY id');
    return result.rows;
  }

  async findById(id: number): Promise<Url | null> {
    const result = await this.db.query('SELECT * FROM urls WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(urlData: CreateUrlData): Promise<Url> {
    const result = await this.db.query(
      'INSERT INTO urls (original_url, regex, replacement_url) VALUES ($1, $2, $3) RETURNING *',
      [urlData.original_url, urlData.regex, urlData.replacement_url]
    );
    return result.rows[0];
  }

  async update(id: number, urlData: UpdateUrlData): Promise<Url | null> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (urlData.original_url !== undefined) {
      setParts.push(`original_url = $${paramCount++}`);
      values.push(urlData.original_url);
    }
    if (urlData.regex !== undefined) {
      setParts.push(`regex = $${paramCount++}`);
      values.push(urlData.regex);
    }
    if (urlData.replacement_url !== undefined) {
      setParts.push(`replacement_url = $${paramCount++}`);
      values.push(urlData.replacement_url);
    }

    if (setParts.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `UPDATE urls SET ${setParts.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.query('DELETE FROM urls WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async exists(id: number): Promise<boolean> {
    const result = await this.db.query('SELECT 1 FROM urls WHERE id = $1 LIMIT 1', [id]);
    return result.rows.length > 0;
  }
}
