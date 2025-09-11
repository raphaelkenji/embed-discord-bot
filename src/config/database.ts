import { Pool, PoolConfig } from 'pg';
import { environment } from './environment';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  private constructor() {
    const config: PoolConfig = {
      user: environment.DB_USER,
      host: environment.DB_HOST,
      database: environment.DB_NAME,
      password: environment.DB_PASS,
      port: environment.DB_PORT,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.pool = new Pool(config);

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client:', err);
      process.exit(-1);
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async connect(): Promise<void> {
    try {
      await this.pool.connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await this.pool.end();
    console.log('Database connection closed');
  }
}

export const database = DatabaseConnection.getInstance();
export const dbPool = database.getPool();