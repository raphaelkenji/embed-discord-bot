import { UserModel } from '../models/UserModel';
import { CreateUserData, UpdateUserData } from '../types';

const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as any;

describe('UserModel', () => {
  let model: UserModel;

  beforeEach(() => {
    model = new UserModel(mockPool);
    mockQuery.mockReset();
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      const rows = [{ id: '123', activated: true }];
      mockQuery.mockResolvedValue({ rows });

      const result = await model.findAll();

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users');
      expect(result).toEqual(rows);
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const user = { id: '123', activated: true };
      mockQuery.mockResolvedValue({ rows: [user] });

      const result = await model.findById('123');
      expect(result).toEqual(user);
    });

    it('returns null when not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await model.findById('999');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and returns a new user', async () => {
      const data: CreateUserData = { id: '123', activated: true };
      const created = { ...data };
      mockQuery.mockResolvedValue({ rows: [created] });

      const result = await model.create(data);

      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO users (id, activated) VALUES ($1, $2) RETURNING *',
        ['123', true]
      );
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('updates and returns user', async () => {
      const data: UpdateUserData = { activated: false };
      const updated = { id: '123', activated: false };
      mockQuery.mockResolvedValue({ rows: [updated] });

      const result = await model.update('123', data);

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE users SET activated = $1 WHERE id = $2 RETURNING *',
        [false, '123']
      );
      expect(result).toEqual(updated);
    });

    it('returns null when user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await model.update('999', { activated: true });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('returns true when user deleted', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const result = await model.delete('123');
      expect(result).toBe(true);
    });

    it('returns false when user not found', async () => {
      mockQuery.mockResolvedValue({ rowCount: 0 });

      const result = await model.delete('999');
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('returns true when user exists', async () => {
      mockQuery.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      const result = await model.exists('123');
      expect(result).toBe(true);
    });

    it('returns false when user does not exist', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await model.exists('999');
      expect(result).toBe(false);
    });
  });
});
