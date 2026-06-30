class AuthManager {
  constructor() {
    this.USERS_KEY = 'fp_users';
    this.SESSION_KEY = 'fp_session';
    this.ORDERS_PREFIX = 'fp_orders_';
    this.seedAdmin();
  }

  
  seedAdmin() {
    const users = this.getUsers();
    if (!users.some(u => u.role === 'admin')) {
      const adminUser = { id: this.generateId(), name: 'Admin', email: 'admin@ananthaskitchen.com', passwordHash: '', role: 'admin', isActive: true, createdAt: new Date().toISOString() };
      this.hashPassword('admin123').then(hash => {
        adminUser.passwordHash = hash;
        if (!this.getUsers().some(u => u.role === 'admin')) localStorage.setItem(this.USERS_KEY, JSON.stringify([...this.getUsers(), adminUser]));
      });
    }
  }
  

  async hashPassword(pw) {
    const data = new TextEncoder().encode(pw + '_fp_salt_2026');
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data))).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  getUsers() { try { return JSON.parse(localStorage.getItem(this.USERS_KEY)) || []; } catch { return []; } }
  findUserByEmail(e) { return this.getUsers().find(u => u.email.toLowerCase() === e.toLowerCase()); }
  generateId() { return 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6); }

  async register(name, email, password) {
    if (!name || !email || !password) return { success: false, error: 'All fields are required.' };
    if (name.trim().length < 2) return { success: false, error: 'Name must be at least 2 characters.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: 'Please enter a valid email address.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };
    if (this.findUserByEmail(email)) return { success: false, error: 'An account with this email already exists.' };

    const newUser = { id: this.generateId(), name: name.trim(), email: email.trim().toLowerCase(), passwordHash: await this.hashPassword(password), role: 'customer', isActive: true, createdAt: new Date().toISOString() };
    localStorage.setItem(this.USERS_KEY, JSON.stringify([...this.getUsers(), newUser]));
    this.createSession(newUser);
    return { success: true, user: newUser };
  }

  async login(email, password) {
    if (!email || !password) return { success: false, error: 'Email and password are required.' };
    const user = this.findUserByEmail(email);
    if (!user) return { success: false, error: 'No account found with this email.' };
    if (!user.isActive) return { success: false, error: 'This account has been deactivated.' };
    if (user.passwordHash !== await this.hashPassword(password)) return { success: false, error: 'Incorrect password. Please try again.' };
    this.createSession(user);
    return { success: true, user };
  }

  createSession(user) { sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({ userId: user.id, name: user.name, email: user.email, role: user.role, loginAt: new Date().toISOString() })); }
  getCurrentUser() { try { return JSON.parse(sessionStorage.getItem(this.SESSION_KEY)); } catch { return null; } }
  isLoggedIn() { return !!this.getCurrentUser(); }
  isAdmin() { return this.getCurrentUser()?.role === 'admin'; }

  async updatePassword(email, newPassword) {
    if (!email || !newPassword) return { success: false, error: 'Email and new password are required.' };
    if (newPassword.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };
    const users = this.getUsers(), idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return { success: false, error: 'No account found with this email.' };
    users[idx].passwordHash = await this.hashPassword(newPassword);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return { success: true };
  }

  logout() { sessionStorage.removeItem(this.SESSION_KEY); window.location.href = './login/'; }

  saveOrder(orderData) {
    const user = this.getCurrentUser();
    if (!user) return false;
    const order = { id: 'ord_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4), items: orderData.items, total: orderData.total, type: orderData.type || 'dine-in', status: 'placed', placedAt: new Date().toISOString() };
    const key = this.ORDERS_PREFIX + user.userId, orders = this.getOrders();
    localStorage.setItem(key, JSON.stringify([...orders, order]));
    return order;
  }

  getOrders() {
    const user = this.getCurrentUser();
    if (!user) return [];
    try { return JSON.parse(localStorage.getItem(this.ORDERS_PREFIX + user.userId)) || []; } catch { return []; }
  }

  getAllOrders() {
    if (!this.isAdmin()) return [];
    return this.getUsers().flatMap(u => {
      try { return (JSON.parse(localStorage.getItem(this.ORDERS_PREFIX + u.id)) || []).map(o => ({ ...o, customerName: u.name, customerEmail: u.email })); } catch { return []; }
    }).sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
  }
}
const auth = new AuthManager();
