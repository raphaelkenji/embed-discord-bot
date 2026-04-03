import { UrlModel } from '../models/UrlModel';
import { CreateUrlData, UpdateUrlData } from '../types';

// Create a mock Pool
const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as any;

describe('UrlModel', () => {
  let model: UrlModel;

  beforeEach(() => {
    model = new UrlModel(mockPool);
    mockQuery.mockReset();
  });

  describe('findAll', () => {
    it('returns all URLs ordered by id', async () => {
      const rows = [
        { id: 1, original_url: 'https://twitter.com', regex: '.*', replacement_url: 'https://fx.com' },
      ];
      mockQuery.mockResolvedValue({ rows });

      const result = await model.findAll();

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM urls ORDER BY id');
      expect(result).toEqual(rows);
    });
  });

  describe('findById', () => {
    it('returns URL when found', async () => {
      const row = { id: 1, original_url: 'https://twitter.com' };
      mockQuery.mockResolvedValue({ rows: [row] });

      const result = await model.findById(1);

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM urls WHERE id = $1', [1]);
      expect(result).toEqual(row);
    });

    it('returns null when not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await model.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('inserts and returns the new URL', async () => {
      const data: CreateUrlData = {
        original_url: 'https://twitter.com',
        regex: '(https?://)(twitter\\.com)',
        replacement_url: 'https://fxtwitter.com',
      };
      const created = { id: 1, ...data };
      mockQuery.mockResolvedValue({ rows: [created] });

      const result = await model.create(data);

      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO urls (original_url, regex, replacement_url) VALUES ($1, $2, $3) RETURNING *',
        [data.original_url, data.regex, data.replacement_url]
      );
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('updates only provided fields', async () => {
      const data: UpdateUrlData = { original_url: 'https://x.com' };
      const updated = { id: 1, original_url: 'https://x.com' };
      mockQuery.mockResolvedValue({ rows: [updated] });

      const result = await model.update(1, data);

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE urls SET original_url = $1 WHERE id = $2 RETURNING *',
        ['https://x.com', 1]
      );
      expect(result).toEqual(updated);
    });

    it('returns null when URL not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await model.update(999, { regex: 'new' });
      expect(result).toBeNull();
    });

    it('returns existing URL when no fields provided', async () => {
      const existing = { id: 1, original_url: 'https://twitter.com' };
      mockQuery.mockResolvedValue({ rows: [existing] });

      const result = await model.update(1, {});

      // Should call findById instead of update
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM urls WHERE id = $1', [1]);
      expect(result).toEqual(existing);
    });
  });

  describe('delete', () => {
    it('returns true when URL deleted', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const result = await model.delete(1);
      expect(result).toBe(true);
    });

    it('returns false when URL not found', async () => {
      mockQuery.mockResolvedValue({ rowCount: 0 });

      const result = await model.delete(999);
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('returns true when URL exists', async () => {
      mockQuery.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      const result = await model.exists(1);
      expect(result).toBe(true);
    });

    it('returns false when URL does not exist', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await model.exists(999);
      expect(result).toBe(false);
    });
  });
});
