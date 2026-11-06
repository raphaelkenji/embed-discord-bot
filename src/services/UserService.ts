import { UserModel } from '../models';
import { User, CreateUserData, UpdateUserData } from '../types';
import { cacheService } from '../config/cache';
import { dbPool } from '../config/database';
import { CACHE_KEYS } from '../utils/constants';

export class UserService {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel(dbPool);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async findById(id: string): Promise<User> {
    const cacheKey = `${CACHE_KEYS.USER_PREFIX}${id}`;
    let user = cacheService.get<User>(cacheKey);
    
    if (!user) {
      const foundUser = await this.userModel.findById(id);
      
      if (!foundUser) {
        user = await this.userModel.findOrCreate(id);
        cacheService.set(cacheKey, user);
      } else {
        user = foundUser;
        cacheService.set(cacheKey, user);
      }
    }
    
    return user;
  }

  async create(userData: CreateUserData): Promise<User> {
    const user = await this.userModel.create(userData);
    
    cacheService.set(`${CACHE_KEYS.USER_PREFIX}${user.id}`, user);
    
    return user;
  }

  async update(id: string, userData: UpdateUserData): Promise<User | null> {
    const user = await this.userModel.update(id, userData);
    
    if (user) {
      cacheService.set(`${CACHE_KEYS.USER_PREFIX}${id}`, user);
    }
    
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.userModel.delete(id);
    
    if (deleted) {
      cacheService.del(`${CACHE_KEYS.USER_PREFIX}${id}`);
    }
    
    return deleted;
  }

  async exists(id: string): Promise<boolean> {
    if (cacheService.has(`${CACHE_KEYS.USER_PREFIX}${id}`)) {
      return true;
    }
    
    return this.userModel.exists(id);
  }

  async toggleActivation(id: string): Promise<User | null> {
    const user = await this.findById(id);
    return this.update(id, { activated: !user.activated });
  }
}
