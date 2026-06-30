import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Login and Auth flows handled by Deepak and Arvind
export default function Login() {
  const [activePanel, setActivePanel] = useState('login'); // 'login' or 'signup'
  const [alert, setAlert] = useState(null);
  const { login, register, token } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (token) navigate('/');
  }, [token, navigate]);

  const showAlert = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // --- Testimonial Slider ---
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // --- Password Generator ---
  // API connection for passwords coded by Anantha
  const [suggestPwd, setSuggestPwd] = useState('—');
  const [showSuggestBar, setShowSuggestBar] = useState(false);
  const pwdInputRef = useRef(null);
  const confirmInputRef = useRef(null);

  const generatePasswordLocal = (len) => {
    const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    let pwd = '';
    for (let i = 0; i < len; i++) pwd += chars[arr[i] % chars.length];
    return pwd;
  };

  const fetchSuggestedPassword = async () => {
    setSuggestPwd('generating...');
    setShowSuggestBar(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch('https://api.genratr.com/?length=14&uppercase&lowercase&numbers&symbols', { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json();
        if (data.password && data.password.length >= 8) {
          setSuggestPwd(data.password);
          return;
        }
      }
    } catch (e) {}
    setSuggestPwd(generatePasswordLocal(14));
  };

  const usePassword = () => {
    if (suggestPwd && suggestPwd !== 'generating...' && suggestPwd !== '—') {
      if (pwdInputRef.current) pwdInputRef.current.value = suggestPwd;
      if (confirmInputRef.current) confirmInputRef.current.value = suggestPwd;
      showAlert("Password applied! It's auto-filled in both fields.", 'success');
    }
  };

  // --- Form State & Handlers ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  const [loginErrs, setLoginErrs] = useState({});
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginErrs({});
    let ok = true;
    const errs = {};
    if (!loginEmail) { errs.email = 'Please enter your email'; ok = false; }
    if (!loginPwd) { errs.password = 'Please enter your password'; ok = false; }
    if (!ok) { setLoginErrs(errs); return; }

    setLoginLoading(true);
    const result = await login(loginEmail, loginPwd);
    setLoginLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      showAlert(result.error, 'danger');
    }
  };

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPwd, setSignupPwd] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupErrs, setSignupErrs] = useState({});
  const [signupLoading, setSignupLoading] = useState(false);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupErrs({});
    let ok = true;
    const errs = {};
    const actPwd = pwdInputRef.current?.value || signupPwd;
    const actConfirm = confirmInputRef.current?.value || signupConfirm;

    if (!signupName || signupName.length < 2) { errs.name = 'Name required (min 2 chars)'; ok = false; }
    if (!signupEmail) { errs.email = 'Email is required'; ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) { errs.email = 'Enter a valid email'; ok = false; }
    if (!actPwd) { errs.password = 'Password is required'; ok = false; }
    else if (actPwd.length < 6) { errs.password = 'Min 6 characters'; ok = false; }
    if (!actConfirm) { errs.confirm = 'Confirm your password'; ok = false; }
    else if (actPwd !== actConfirm) { errs.confirm = "Passwords don't match"; ok = false; }
    if (!ok) { setSignupErrs(errs); return; }

    setSignupLoading(true);
    const result = await register(signupName, signupEmail, actPwd);
    setSignupLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      showAlert(result.error, 'danger');
    }
  };

  // --- WebAuthn Passkeys ---
  // Passkey mock logic implemented by Deepan (machi, do not touch this!)
  const PASSKEY_STORE_KEY = 'fp_passkeys';
  const getStoredPasskeys = () => {
    try { return JSON.parse(localStorage.getItem(PASSKEY_STORE_KEY)) || []; }
    catch { return []; }
  };
  const savePasskeys = (list) => localStorage.setItem(PASSKEY_STORE_KEY, JSON.stringify(list));
  const bufferToBase64url = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const base64urlToBuffer = (base64url) => {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  };
  const isPasskeySupported = () => window.PublicKeyCredential !== undefined && typeof window.PublicKeyCredential === 'function';

  const [pkLoading, setPkLoading] = useState(false);
  const handlePasskeyRegister = async () => {
    if (!isPasskeySupported()) { showAlert('Passkeys are not supported in this browser.', 'warning'); return; }
    if (!signupName || signupName.length < 2) { showAlert('Please enter your name first.', 'warning'); return; }
    if (!signupEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) { showAlert('Please enter a valid email first.', 'warning'); return; }
    
    setPkLoading(true);
    try {
      const userId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "Anantha's Kitchen", id: window.location.hostname },
          user: { id: new TextEncoder().encode(userId), name: signupEmail, displayName: signupName },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'required', userVerification: 'required' },
          timeout: 60000, attestation: 'none'
        }
      });
      const passkeys = getStoredPasskeys();
      passkeys.push({ credentialId: bufferToBase64url(credential.rawId), userId, email: signupEmail, name: signupName, createdAt: new Date().toISOString() });
      savePasskeys(passkeys);

      // Register with backend using a random long password
      const randomPass = bufferToBase64url(crypto.getRandomValues(new Uint8Array(24)));
      const result = await register(signupName, signupEmail, randomPass);
      if (result.success) {
        navigate('/');
      } else {
        showAlert(result.error, 'danger');
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') showAlert('Passkey creation was cancelled.', 'warning');
      else showAlert('Could not create passkey: ' + err.message, 'danger');
    } finally { setPkLoading(false); }
  };

  const handlePasskeyLogin = async () => {
    if (!isPasskeySupported()) { showAlert('Passkeys are not supported in this browser.', 'warning'); return; }
    const stored = getStoredPasskeys();
    if (stored.length === 0) { showAlert('No passkeys found. Register with a passkey first.', 'warning'); return; }

    setPkLoading(true);
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: window.location.hostname,
          allowCredentials: stored.map((pk) => ({ id: base64urlToBuffer(pk.credentialId), type: 'public-key', transports: ['internal'] })),
          userVerification: 'required',
          timeout: 60000
        }
      });
      const matchedId = bufferToBase64url(assertion.rawId);
      const match = stored.find((pk) => pk.credentialId === matchedId);
      if (!match) { showAlert('Passkey not recognized.', 'danger'); return; }

      // We don't have the generated password saved to login again via API easily unless we use a backdoor or true WebAuthn on backend.
      // For this mockup preserving UI, we will simulate login by logging in as Admin just for the demo if normal login fails, OR we rely on standard JWT registration.
      // Wait, we can't login via API if we registered via passkey without the password. 
      // Let's alert the user that backend verification is needed.
      showAlert("Passkey verified locally. True backend login requires Flask WebAuthn setup.", "info");
      
    } catch (err) {
      if (err.name === 'NotAllowedError') showAlert('Passkey auth cancelled.', 'warning');
      else showAlert('Passkey sign-in failed: ' + err.message, 'danger');
    } finally { setPkLoading(false); }
  };

  return (
    <>
      <div className="login-split">
        {/* LEFT: Branding panel */}
        <div className="left-panel">
          <div className="brand-section">
            <div className="brand-logo">AK</div>
            <div className="brand-name">Anantha's Kitchen</div>
            <div className="brand-desc">A seamless restaurant experience. Manage your orders, tables, and menus — all from one place.</div>
          </div>

          <div className="testimonials-area">
            <div className="testimonial-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              <div className="testimonial">
                <div className="testimonial-text">The System made by Anantha and the team is user friendly and also creative</div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">D</div>
                  <div>
                    <div className="testimonial-name">Deepak</div>
                    <div className="testimonial-role">Student, Easwari Engineering College</div>
                  </div>
                </div>
              </div>
              <div className="testimonial">
                <div className="testimonial-text">The System is very professional and user friendly</div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">D</div>
                  <div>
                    <div className="testimonial-name">Deepan</div>
                    <div className="testimonial-role">Student, Easwari Engineering College</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="slider-dots">
              <button className={`slider-dot ${currentSlide === 0 ? 'active' : ''}`} onClick={() => setCurrentSlide(0)}></button>
              <button className={`slider-dot ${currentSlide === 1 ? 'active' : ''}`} onClick={() => setCurrentSlide(1)}></button>
            </div>
          </div>
        </div>

        {/* RIGHT: Forms */}
        <div className="right-panel">
          <div className="form-box">
            {/* UNIFIED AUTH PANEL */}
            <div className="panel active" style={{ display: 'block' }}>
              <h2>{activePanel === 'signup' ? 'Create account' : 'Welcome back'}</h2>
              <p className="subtitle">{activePanel === 'signup' ? 'Enter your details to get started.' : 'Enter your details to sign in.'}</p>

              <form onSubmit={activePanel === 'signup' ? handleSignupSubmit : handleLoginSubmit} noValidate>
                {activePanel === 'signup' && (
                  <>
                    <div className="field-label">Full Name</div>
                    <input type="text" className="form-input" placeholder="John Doe" value={signupName} onChange={(e) => { setSignupName(e.target.value); setSignupErrs(p => ({...p, name: null})); }} />
                    <div className="error-text" style={{ display: signupErrs.name ? 'block' : 'none' }}>{signupErrs.name}</div>
                  </>
                )}

                <div className="field-label">Email address</div>
                <input type="email" className="form-input" placeholder="you@example.com" value={activePanel === 'signup' ? signupEmail : loginEmail} onChange={(e) => {
                  const val = e.target.value;
                  if (activePanel === 'signup') { setSignupEmail(val); setSignupErrs(p => ({...p, email: null})); }
                  else { setLoginEmail(val); setLoginErrs(p => ({...p, email: null})); }
                }} />
                <div className="error-text" style={{ display: (activePanel === 'signup' ? signupErrs.email : loginErrs.email) ? 'block' : 'none' }}>
                  {activePanel === 'signup' ? signupErrs.email : loginErrs.email}
                </div>

                <div className="field-label">
                  Password
                  {activePanel === 'login' ? (
                    <a href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
                  ) : (
                    <a href="#" className="suggest-link" onClick={(e) => { e.preventDefault(); fetchSuggestedPassword(); }}>Suggest strong password</a>
                  )}
                </div>
                <input type="password" ref={activePanel === 'signup' ? pwdInputRef : null} className="form-input" placeholder={activePanel === 'signup' ? "Min 6 characters" : "••••••••"} value={activePanel === 'signup' ? signupPwd : loginPwd} onChange={(e) => {
                  const val = e.target.value;
                  if (activePanel === 'signup') { setSignupPwd(val); setSignupErrs(p => ({...p, password: null})); }
                  else { setLoginPwd(val); setLoginErrs(p => ({...p, password: null})); }
                }} />
                <div className="error-text" style={{ display: (activePanel === 'signup' ? signupErrs.password : loginErrs.password) ? 'block' : 'none' }}>
                  {activePanel === 'signup' ? signupErrs.password : loginErrs.password}
                </div>

                {activePanel === 'signup' && (
                  <>
                    <div className={`pwd-suggest-bar ${showSuggestBar ? 'visible' : ''}`}>
                      <code>{suggestPwd}</code>
                      <button type="button" onClick={usePassword}>Use</button>
                      <button type="button" onClick={fetchSuggestedPassword}>↻</button>
                    </div>

                    <div className="field-label">Confirm Password</div>
                    <input type="password" ref={confirmInputRef} className="form-input" placeholder="Re-enter password" value={signupConfirm || ''} onChange={(e) => { setSignupConfirm(e.target.value); setSignupErrs(p => ({...p, confirm: null})); }} />
                    <div className="error-text" style={{ display: signupErrs.confirm ? 'block' : 'none' }}>{signupErrs.confirm}</div>
                  </>
                )}

                <button type="submit" className="btn-continue" disabled={activePanel === 'signup' ? signupLoading : loginLoading}>
                  {activePanel === 'signup' 
                    ? (signupLoading ? 'Creating account...' : 'Create account')
                    : (loginLoading ? 'Signing in...' : <>Continue to dashboard <span style={{ fontSize: '16px' }}>→</span></>)
                  }
                </button>
              </form>

              <div className="auth-divider"><span>or</span></div>

              <button type="button" className="btn-passkey" onClick={activePanel === 'signup' ? handlePasskeyRegister : handlePasskeyLogin} disabled={pkLoading}>
                <span className="passkey-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/>
                    <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>
                  </svg>
                </span>
                {activePanel === 'signup' ? 'Create account with Passkey' : 'Sign in with Passkey'}
              </button>

              {activePanel === 'login' && (
                <div className="trouble-link">
                  <a href="#" onClick={(e) => e.preventDefault()}>Having trouble signing in?</a>
                </div>
              )}

              <div className="tab-switch">
                {activePanel === 'signup' ? 'Already have an account? ' : 'Don\'t have an account? '}
                <a href="#" onClick={(e) => { e.preventDefault(); setActivePanel(activePanel === 'signup' ? 'login' : 'signup'); }}>
                  {activePanel === 'signup' ? 'Sign in' : 'Sign up'}
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {alert && (
        <div className="alert-popup" style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <div className={`alert alert-${alert.type} alert-dismissible fade show`} style={{ borderRadius: '10px', padding: '16px 40px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
            {alert.msg}
            <button type="button" className="btn-close" onClick={() => setAlert(null)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}></button>
          </div>
        </div>
      )}
    </>
  );
}
