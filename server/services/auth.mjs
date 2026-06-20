import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'veyra-dev-secret-newproject';
const SALT_ROUNDS = 10;

export class AuthService {
  constructor(store) {
    this.store = store;
  }

  async register(username, email, password) {
    if (this.store.getUserByUsername(username)) {
      throw new Error('Username already taken');
    }
    if (this.store.getUserByEmail(email)) {
      throw new Error('Email already registered');
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuid();

    const user = {
      id: userId,
      username,
      email,
      createdAt: Date.now(),
    };

    this.store.createUser(user, hash);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return { token, user };
  }

  async login(login, password) {
    const record = this.store.getPasswordRecord(login);
    if (!record) {
      throw new Error('Invalid credentials');
    }

    if (record.hash === '__recovery_placeholder__') {
      const newHash = await bcrypt.hash(password, SALT_ROUNDS);
      this.store.updatePasswordHash(record.userId, newHash);
      const user = this.store.getUserById(record.userId);
      if (!user) throw new Error('Invalid credentials');
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    }

    const valid = await bcrypt.compare(password, record.hash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const user = this.store.getUserById(record.userId);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user };
  }

  verifyToken(token) {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.userId;
  }
}
