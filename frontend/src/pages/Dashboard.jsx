import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import * as bootstrap from 'bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Dashboard Main Component
// Note: Component structure set up by Arvind, API hooks done by Deepan
export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('fp_theme') || 'dark');
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Admin Tabs state - Deepak
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'menu', 'analytics'

  const [toastMsg, setToastMsg] = useState(null);
  const orderModalRef = useRef(null);
  const bsModalRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    fetchMenu();
    fetchOrders();
    if (user?.role === 'admin') {
      fetchAnalytics();
    }
  }, [theme, user]);

  // Setup modal
  // Bootstrap modal ref mapping - Deepak
  useEffect(() => {
    if (orderModalRef.current && !bsModalRef.current) {
      bsModalRef.current = new bootstrap.Modal(orderModalRef.current);
    }
  }, []);

  // Fetch logic starts here - Anantha
  const fetchMenu = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/menu', { headers: { Authorization: `Bearer ${token}` } });
      setMenu(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders', { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/analytics', { headers: { Authorization: `Bearer ${token}` } });
      setAnalytics(res.data);
    } catch (e) { console.error(e); }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('fp_theme', next);
  };

  const showToast = (msg, type = 'info') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const addToCart = (item) => {
    setCart([...cart, item]);
    showToast(`${item.name} added`, 'info');
    bsModalRef.current?.show();
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const clearCart = () => setCart([]);

  const placeOrder = async () => {
    if (cart.length === 0) {
      showToast('Please add at least one item.', 'danger');
      return;
    }
    try {
      const items = cart.map(i => ({ name: i.name, quantity: 1 }));
      await axios.post('http://localhost:5000/api/orders', { type: 'dine-in', items }, { headers: { Authorization: `Bearer ${token}` } });
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      showToast(`Order placed! Total: ₹${total} 🍳`, 'success');
      clearCart();
      bsModalRef.current?.hide();
      fetchOrders();
    } catch (e) {
      showToast('Failed to place order.', 'danger');
    }
  };

  // Menu CRUD logic - Arvind
  const deleteMenuItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/menu/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Menu item deleted', 'success');
      fetchMenu();
    } catch (e) {
      showToast('Error deleting item', 'danger');
    }
  };

  const getEmoji = (name) => {
    if (name.includes('Burger')) return '🍔';
    if (name.includes('Pizza')) return '🍕';
    if (name.includes('Pasta')) return '🍝';
    if (name.includes('Wrap')) return '🌯';
    if (name.includes('Biryani')) return '🍚';
    if (name.includes('Dosa')) return '🥞';
    if (name.includes('Lassi')) return '🥭';
    if (name.includes('Brownie')) return '🍫';
    return '🍽️';
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AK';
  
  // Greeting logic machi - Deepan
  const firstName = user?.name ? user.name.split(' ')[0] : 'Guest';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // --- UI Rendering ---
  // The UI is perfectly mapped from the original index.html - Arvind & Anantha
  return (
    <>
      <nav className="navbar navbar-expand sticky-top border-bottom nav-blur">
        <div className="container-fluid px-3 px-md-4">
          <a className="navbar-brand d-flex align-items-center gap-2 fw-bold" href="#">
            🍽️ <span>Anantha's Kitchen</span>
            <small className="text-muted d-none d-sm-inline" style={{ fontSize: '0.7rem', fontWeight: 500 }}>Billing System</small>
          </a>
          <div className="d-flex align-items-center gap-2" id="nav-right">
            <button className="btn btn-sm theme-toggle" title="Toggle theme" onClick={toggleTheme}>
              <i className={theme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill'}></i>
            </button>
            <div className="d-flex align-items-center gap-2">
              <div className="user-avatar">{initials}</div>
              <div className="d-none d-sm-block lh-1">
                <div className="small fw-semibold">{user?.name}</div>
                <div className="text-accent" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>{user?.role}</div>
              </div>
            </div>
            <button className="btn btn-sm btn-outline-secondary" title="Logout" onClick={logout}>
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: '960px' }}>
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between py-4 gap-3">
          <div>
            <h4 className="fw-bold mb-1">{user?.role === 'admin' ? `${greeting}, Admin` : `${greeting}, ${firstName}!`}</h4>
            <p className="text-muted mb-0 small">Fresh meals, served fast. Order straight from your table.</p>
          </div>
          {user?.role === 'customer' && (
            <button className="btn btn-accent d-flex align-items-center gap-2 fw-semibold px-4" onClick={() => bsModalRef.current?.show()}>
              <i className="bi bi-cart3"></i> Order Now
            </button>
          )}
        </div>

        {/* Admin Tabs - Designed by Deepan */}
        {user?.role === 'admin' && (
          <ul className="nav nav-pills mb-4 gap-2">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'orders' ? 'active bg-accent' : 'text-muted'}`} onClick={() => setActiveTab('orders')}>
                <i className="bi bi-receipt me-2"></i>Live Orders
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'menu' ? 'active bg-accent' : 'text-muted'}`} onClick={() => setActiveTab('menu')}>
                <i className="bi bi-journal-text me-2"></i>Manage Menu
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'analytics' ? 'active bg-accent' : 'text-muted'}`} onClick={() => setActiveTab('analytics')}>
                <i className="bi bi-bar-chart-fill me-2"></i>Analytics
              </button>
            </li>
          </ul>
        )}

        {/* CUSTOMER VIEW OR ADMIN 'LIVE ORDERS' VIEW */}
        {(user?.role === 'customer' || activeTab === 'orders') && (
          <>
            <section className="mb-4">
              <div className="d-flex justify-content-between align-items-baseline mb-3">
                <h6 className="text-uppercase text-muted fw-bold small letter-space mb-0">Popular Items</h6>
                <span className="badge bg-secondary-subtle text-secondary-emphasis">{menu.length} items</span>
              </div>
              <div className="row g-3">
                {menu.map(item => (
                  <div className="col-6 col-md-4 col-lg-3" key={item.id}>
                    <div className="card menu-card h-100" onClick={() => user?.role === 'customer' && addToCart(item)}>
                      <div className="card-body d-flex flex-column">
                        <span className="menu-emoji">{getEmoji(item.name)}</span>
                        <h6 className="card-title fw-semibold mb-1">{item.name}</h6>
                        <p className="card-text text-muted small flex-grow-1">{item.description}</p>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <span className="fw-bold text-accent">₹{item.price}</span>
                          {user?.role === 'customer' && (
                            <button className="btn btn-sm btn-outline-secondary rounded-circle add-btn" title="Add to order" onClick={(e) => { e.stopPropagation(); addToCart(item); }}>
                              <i className="bi bi-plus"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-5 border-top pt-4">
              <div className="d-flex justify-content-between align-items-baseline mb-3">
                <h6 className="text-uppercase text-muted fw-bold small letter-space mb-0">{user?.role === 'admin' ? 'All Live Orders' : 'Your Order History'}</h6>
                <span className="badge bg-secondary-subtle text-secondary-emphasis">{orders.length} orders</span>
              </div>
              {orders.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <div style={{ fontSize: '2rem', opacity: 0.4 }}>📋</div>
                  <p className="small mt-2">No orders yet.</p>
                </div>
              ) : (
                <div>
                  {orders.map(order => (
                    <div className="history-card" key={order.id}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-semibold small">{user?.role === 'admin' ? order.customer : new Date(order.placed_at).toLocaleString()}</span>
                        <span className={`badge ${order.status === 'placed' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-success-subtle text-success-emphasis'} small`}>{order.status}</span>
                      </div>
                      <div className="small text-muted mb-1">{order.items.map(i => i.name).join(', ')}</div>
                      <div className="fw-bold text-accent">₹{order.total}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ADMIN: MANAGE MENU */}
        {user?.role === 'admin' && activeTab === 'menu' && (
          <section className="mb-5 animation-fade">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Menu Items Directory</h5>
              <button className="btn btn-sm btn-accent fw-semibold px-3"><i className="bi bi-plus-lg me-1"></i> Add New Item</button>
            </div>
            
            <div className="table-responsive rounded-3 border">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menu.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-semibold">{item.name}</div>
                        <small className="text-muted">{item.description}</small>
                      </td>
                      <td><span className="badge bg-secondary-subtle text-secondary-emphasis">{item.category_name || 'Uncategorized'}</span></td>
                      <td className="fw-medium text-accent">₹{item.price}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-secondary me-2"><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteMenuItem(item.id)}><i className="bi bi-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ADMIN: ANALYTICS (Chart.js implemented by Anantha) */}
        {user?.role === 'admin' && activeTab === 'analytics' && analytics && (
          <section className="mb-5 animation-fade">
            <h5 className="fw-bold mb-4">Store Analytics</h5>
            
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-4 text-center p-4 h-100">
                  <h6 className="text-muted small text-uppercase letter-space mb-2">Total Revenue</h6>
                  <h2 className="fw-bold text-accent mb-0">₹{analytics.total_revenue}</h2>
                </div>
              </div>
              <div className="col-6 col-md-4">
                <div className="card border-0 shadow-sm rounded-4 text-center p-4 h-100">
                  <h6 className="text-muted small text-uppercase letter-space mb-2">Total Orders</h6>
                  <h2 className="fw-bold mb-0">{analytics.total_orders}</h2>
                </div>
              </div>
              <div className="col-6 col-md-4">
                <div className="card border-0 shadow-sm rounded-4 text-center p-4 h-100">
                  <h6 className="text-muted small text-uppercase letter-space mb-2">Takeaway Ratio</h6>
                  <h2 className="fw-bold mb-0 text-success">{Math.round((analytics.takeaway_count / (analytics.total_orders || 1))*100)}%</h2>
                </div>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-md-8">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <h6 className="text-muted small text-uppercase letter-space mb-3">Order Types Distribution</h6>
                  <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                    <Pie 
                      data={{
                        labels: ['Dine-In', 'Takeaway'],
                        datasets: [{
                          data: [analytics.dine_in_count, analytics.takeaway_count],
                          backgroundColor: ['rgba(0, 113, 227, 0.7)', 'rgba(255, 140, 66, 0.7)'],
                          borderWidth: 0
                        }]
                      }}
                      options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* Cart Modal */}
      <div className="modal fade" id="orderModal" tabIndex="-1" ref={orderModalRef}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold"><i className="bi bi-bag me-2"></i>Your Order</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p className="text-muted small">{cart.length === 0 ? 'No items added yet.' : `${cart.length} item(s) in your order:`}</p>
              <div>
                {cart.map((item, i) => (
                  <div className="order-item" key={i}>
                    <span className="fw-medium">{item.name}</span>
                    <span>
                      <span className="text-muted">₹{item.price}</span>
                      <button className="remove-item-btn" onClick={() => removeFromCart(i)} title="Remove">×</button>
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-end fw-bold text-accent mt-3" style={{ fontSize: '1.1rem' }}>
                {cart.length > 0 && `Total: ₹${cartTotal}`}
              </div>
            </div>
            <div className="modal-footer d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={clearCart}>
                <i className="bi bi-trash3 me-1"></i>Clear
              </button>
              <div className="flex-grow-1"></div>
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-accent fw-semibold" onClick={placeOrder}>
                <i className="bi bi-check-lg me-1"></i>Place Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`toast show align-items-center text-bg-${toastMsg.type} border-0`}>
            <div className="d-flex">
              <div className="toast-body"><i className="bi bi-info-circle-fill me-2"></i>{toastMsg.msg}</div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMsg(null)}></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
