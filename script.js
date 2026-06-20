
/* ---------- Password visibility toggle ---------- */
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');

togglePasswordBtn.addEventListener('click', () => {
    const isCurrentlyHidden = passwordInput.type === 'password';

    passwordInput.type = isCurrentlyHidden ? 'text' : 'password';
    togglePasswordBtn.textContent = isCurrentlyHidden ? '🙈' : '👁️';
    togglePasswordBtn.setAttribute(
        'aria-label',
        isCurrentlyHidden ? 'Hide password' : 'Show password'
    );
});

