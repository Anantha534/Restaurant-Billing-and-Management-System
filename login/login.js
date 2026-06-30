// ── Redirect if logged in ─────────────────────
    if (auth.isLoggedIn()) {
      window.location.href = '../index.html';
    }

    // ══════════════════════════════════════════════
    // ── Testimonial Slider ────────────────────────
    // mass aana sliding comments thalaivaa #anantha
    // ══════════════════════════════════════════════
    (function() {
      var track = document.getElementById('testimonialTrack');
      var dots = document.querySelectorAll('.slider-dot');
      var current = 0;
      var total = track.children.length;
      var timer;

      function go(i) {
        current = i;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        dots.forEach(function(d, idx) { d.classList.toggle('active', idx === current); });
      }

      function next() { go((current + 1) % total); }

      function start() { timer = setInterval(next, 4500); }
      function reset() { clearInterval(timer); start(); }

      dots.forEach(function(d) {
        d.addEventListener('click', function() { go(parseInt(d.dataset.index)); reset(); });
      });

      start();
    })();

    // ══════════════════════════════════════════════
    // ── Helpers ───────────────────────────────────
    // ══════════════════════════════════════════════
    function showAlert(msg, type) {
      var box = document.getElementById('alertBox');
      box.innerHTML = '<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert">' +
        msg + '<button type="button" class="btn-close btn-sm" data-bs-dismiss="alert"></button></div>';
      setTimeout(function() { box.innerHTML = ''; }, 4000);
    }

    function showErr(id, msg) {
      var el = document.getElementById(id);
      el.textContent = msg;
      el.style.display = 'block';
    }
    function clearErrs() {
      document.querySelectorAll('.error-text').forEach(function(el) { el.style.display = 'none'; });
    }

    // ══════════════════════════════════════════════
    // ── Unified Auth Form Management ──────────────
    // ══════════════════════════════════════════════
    var isSignup = false;
    
    document.getElementById('switchAuthMode').onclick = function(e) {
      e.preventDefault();
      isSignup = !isSignup;
      
      document.getElementById('authTitle').textContent = isSignup ? 'Create account' : 'Welcome back';
      document.getElementById('authSubtitle').textContent = isSignup ? 'Enter your details to get started.' : 'Enter your details to sign in.';
      document.getElementById('authBtnText').textContent = isSignup ? 'Create account' : 'Continue to dashboard';
      document.getElementById('passkeyText').textContent = isSignup ? 'Create account with Passkey' : 'Sign in with Passkey';
      document.getElementById('switchText').textContent = isSignup ? 'Already have an account?' : 'Don\'t have an account?';
      this.textContent = isSignup ? 'Sign in' : 'Sign up';

      document.querySelectorAll('.signup-only').forEach(function(el) { el.style.display = isSignup ? '' : 'none'; });
      document.querySelectorAll('.login-only').forEach(function(el) { el.style.display = isSignup ? 'none' : ''; });
      clearErrs();
    };

    document.getElementById('authForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      clearErrs();
      
      var email = document.getElementById('authEmail').value.trim();
      var password = document.getElementById('authPassword').value;
      var ok = true;
      
      if (!email) { showErr('authEmailErr', 'Email is required'); ok = false; }
      else if (isSignup && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr('authEmailErr', 'Enter a valid email'); ok = false; }
      
      if (!password) { showErr('authPasswordErr', 'Password is required'); ok = false; }
      else if (isSignup && password.length < 6) { showErr('authPasswordErr', 'Min 6 characters'); ok = false; }

      var name, confirm;
      if (isSignup) {
        name = document.getElementById('authName').value.trim();
        confirm = document.getElementById('authConfirm').value;
        if (!name || name.length < 2) { showErr('authNameErr', 'Name required (min 2 chars)'); ok = false; }
        if (!confirm) { showErr('authConfirmErr', 'Confirm your password'); ok = false; }
        else if (password !== confirm) { showErr('authConfirmErr', 'Passwords don\'t match'); ok = false; }
      }

      if (!ok) return;

      var btn = document.getElementById('authBtn');
      btn.disabled = true; 
      document.getElementById('authBtnText').textContent = isSignup ? 'Creating account...' : 'Signing in...';
      
      await new Promise(function(r) { setTimeout(r, 400); });
      var result = isSignup ? await auth.register(name, email, password) : await auth.login(email, password);
      
      btn.disabled = false; 
      document.getElementById('authBtnText').textContent = isSignup ? 'Create account' : 'Continue to dashboard';

      if (result.success) {
        showAlert((isSignup ? 'Account created! Welcome, ' : 'Welcome back, ') + result.user.name + (isSignup ? '' : '!'), 'success');
        setTimeout(function() { window.location.href = '../index.html'; }, 600);
      } else {
        showAlert(result.error, 'danger');
      }
    });

    // ══════════════════════════════════════════════
    // ── Password Generator ────────────────────────
    // ══════════════════════════════════════════════
    var suggestBar = document.getElementById('pwdSuggestBar');
    var suggestText = document.getElementById('pwdSuggestText');

    // Local fallback generator using crypto API
    function generatePasswordLocal(len) {
      var chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
      var arr = new Uint32Array(len);
      crypto.getRandomValues(arr);
      var pwd = '';
      for (var i = 0; i < len; i++) pwd += chars[arr[i] % chars.length];
      return pwd;
    }

    async function fetchSuggestedPassword() {
      suggestText.textContent = 'generating...';
      suggestBar.classList.add('visible');

      // Try open-source API first, fallback to local
      try {
        var controller = new AbortController();
        var timeout = setTimeout(function() { controller.abort(); }, 3000);
        var resp = await fetch('https://api.genratr.com/?length=14&uppercase&lowercase&numbers&symbols', {
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (resp.ok) {
          var data = await resp.json();
          // The API returns a JSON object with a password field, e.g. {"password":"..."}
          var pwd = data.password;
          if (pwd && pwd.length >= 8) {
            suggestText.textContent = pwd;
            return;
          }
        }
      } catch (e) {
        // API failed or CORS blocked — use local generator
      }

      // Local fallback
      suggestText.textContent = generatePasswordLocal(14);
    }

    document.getElementById('suggestPwdLink').addEventListener('click', function(e) {
      e.preventDefault();
      fetchSuggestedPassword();
    });

    document.getElementById('pwdUseBtn').addEventListener('click', function() {
      var pwd = suggestText.textContent;
      if (pwd && pwd !== 'generating...' && pwd !== '—') {
        document.getElementById('authPassword').value = pwd;
        document.getElementById('authPassword').type = 'text'; // show it briefly
        document.getElementById('authConfirm').value = pwd;
        document.getElementById('authConfirm').type = 'text';
        setTimeout(function() {
          document.getElementById('authPassword').type = 'password';
          document.getElementById('authConfirm').type = 'password';
        }, 2000);
        showAlert('Password applied! It\'s auto-filled in both fields.', 'success');
      }
    });

    document.getElementById('pwdRetryBtn').addEventListener('click', function() {
      fetchSuggestedPassword();
    });

    // ══════════════════════════════════════════════
    // ── WebAuthn Passkey System ───────────────────
    // ══════════════════════════════════════════════
    var PASSKEY_STORE_KEY = 'fp_passkeys';

    function getStoredPasskeys() {
      try { return JSON.parse(localStorage.getItem(PASSKEY_STORE_KEY)) || []; }
      catch { return []; }
    }
    function savePasskeys(list) {
      localStorage.setItem(PASSKEY_STORE_KEY, JSON.stringify(list));
    }

    function bufferToBase64url(buffer) {
      var bytes = new Uint8Array(buffer);
      var str = '';
      for (var i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function base64urlToBuffer(base64url) {
      var base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      var binary = atob(base64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    }

    function isPasskeySupported() {
      return window.PublicKeyCredential !== undefined && typeof window.PublicKeyCredential === 'function';
    }

    // Register Passkey
    document.getElementById('authPasskeyBtn').addEventListener('click', async function() {
      if (!isPasskeySupported()) { showAlert('Passkeys are not supported in this browser.', 'warning'); return; }

      if (isSignup) {
        var name = document.getElementById('authName').value.trim();
        var email = document.getElementById('authEmail').value.trim();

        if (!name || name.length < 2) { showAlert('Please enter your name first.', 'warning'); document.getElementById('authName').focus(); return; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showAlert('Please enter a valid email first.', 'warning'); document.getElementById('authEmail').focus(); return; }
        if (auth.findUserByEmail(email)) { showAlert('Account already exists. Use Sign In with Passkey.', 'warning'); return; }

        var btn = this;
        btn.disabled = true;

        try {
          var userId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
          var credential = await navigator.credentials.create({
            publicKey: {
              challenge: crypto.getRandomValues(new Uint8Array(32)),
              rp: { name: "Anantha's Kitchen", id: window.location.hostname },
              user: { id: new TextEncoder().encode(userId), name: email, displayName: name },
              pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
              authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'required', userVerification: 'required' },
              timeout: 60000, attestation: 'none'
            }
          });

          var passkeys = getStoredPasskeys();
          passkeys.push({ credentialId: bufferToBase64url(credential.rawId), userId: userId, email: email, name: name, createdAt: new Date().toISOString() });
          savePasskeys(passkeys);

          var randomPass = bufferToBase64url(crypto.getRandomValues(new Uint8Array(24)));
          await auth.register(name, email, randomPass);

          showAlert('Passkey created! Signing you in...', 'success');
          setTimeout(function() { window.location.href = '../index.html'; }, 800);
        } catch (err) {
          if (err.name === 'NotAllowedError') showAlert('Passkey creation was cancelled.', 'warning');
          else showAlert('Could not create passkey: ' + err.message, 'danger');
        } finally { btn.disabled = false; }
      } else {
        // Sign In with Passkey
        var stored = getStoredPasskeys();
        if (stored.length === 0) { showAlert('No passkeys found. Register with a passkey first.', 'warning'); return; }

        var btn = this;
        btn.disabled = true;

        try {
          var assertion = await navigator.credentials.get({
            publicKey: {
              challenge: crypto.getRandomValues(new Uint8Array(32)),
              rpId: window.location.hostname,
              allowCredentials: stored.map(function(pk) { return { id: base64urlToBuffer(pk.credentialId), type: 'public-key', transports: ['internal'] }; }),
              userVerification: 'required',
              timeout: 60000
            }
          });

          var matchedId = bufferToBase64url(assertion.rawId);
          var match = stored.find(function(pk) { return pk.credentialId === matchedId; });

          if (!match) { showAlert('Passkey not recognized.', 'danger'); return; }

          var user = auth.findUserByEmail(match.email);
          if (!user) { showAlert('Account not found.', 'danger'); return; }
          if (!user.isActive) { showAlert('Account deactivated.', 'danger'); return; }

          auth.createSession(user);
          showAlert('Welcome back, ' + user.name + '!', 'success');
          setTimeout(function() { window.location.href = '../index.html'; }, 800);
        } catch (err) {
          if (err.name === 'NotAllowedError') showAlert('Passkey auth cancelled.', 'warning');
          else showAlert('Passkey sign-in failed: ' + err.message, 'danger');
        } finally { btn.disabled = false; }
      }
    });