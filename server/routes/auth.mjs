import { AuthService } from '../services/auth.mjs';
import { createAuthMiddleware } from '../middleware/auth.mjs';

export function registerAuthRoutes(app, store) {
  const authService = new AuthService(store);
  const requireAuth = createAuthMiddleware(authService);

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'username, email, and password required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      const result = await authService.register(username, email, password);
      res.status(201).json(result);
    } catch (err) {
      const message = err.message || 'Registration failed';
      const status = message.includes('already') ? 409 : 500;
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { login, password } = req.body;
      if (!login || !password) {
        return res.status(400).json({ error: 'login and password required' });
      }
      const result = await authService.login(login, password);
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: err.message || 'Login failed' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = store.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const player = store.getPlayerByUserId(req.userId);
    res.json({ user, player });
  });

  return { authService, requireAuth };
}
