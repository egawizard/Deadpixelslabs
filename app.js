(() => {
  const cfg = window.DEAD_PIXELS_CONFIG || {};
  const els = {
    configWarning: document.querySelector('#config-warning'),
    loginBtn: document.querySelector('#google-login'),
    logoutBtn: document.querySelector('#logout'),
    authDisconnected: document.querySelector('#auth-disconnected'),
    authConnected: document.querySelector('#auth-connected'),
    email: document.querySelector('#user-email'),
    authStatus: document.querySelector('#auth-status'),
    walletForm: document.querySelector('#wallet-form'),
    wallet: document.querySelector('#wallet'),
    submitBtn: document.querySelector('#submit-application'),
    message: document.querySelector('#message'),
    result: document.querySelector('#result'),
    appNo: document.querySelector('#application-no'),
    resultWallet: document.querySelector('#result-wallet'),
    resultStatus: document.querySelector('#result-status'),
    resultEmail: document.querySelector('#result-email'),
    count: document.querySelector('#wl-count'),
    countMini: document.querySelector('#wl-count-mini'),
    remaining: document.querySelector('#wl-remaining'),
    bar: document.querySelector('#wl-progress-bar'),
    openState: document.querySelector('#wl-open-state'),
  };

  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes('YOUR_') && !cfg.SUPABASE_ANON_KEY.includes('YOUR_');

  if (!configured || !window.supabase) {
    els.configWarning.classList.remove('hidden');
    els.loginBtn.disabled = true;
    els.authStatus.textContent = 'SETUP REQUIRED';
    return;
  }

  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  function setMessage(text = '', type = '') {
    els.message.textContent = text;
    els.message.className = 'notice' + (type ? ` ${type}` : '') + (text ? '' : ' hidden');
  }

  function friendlyError(error) {
    const msg = String(error?.message || error || 'UNKNOWN_ERROR');
    if (msg.includes('GOOGLE_ACCOUNT_ALREADY_USED')) return 'This Google account already has a whitelist application. One Google account can register only one wallet.';
    if (msg.includes('WALLET_ALREADY_USED')) return 'This wallet has already been registered by another application.';
    if (msg.includes('APPLICATIONS_CLOSED')) return 'Whitelist applications are closed. The 10,000 application cap has been reached.';
    if (msg.includes('INVALID_WALLET')) return 'Invalid EVM wallet address. It must start with 0x and contain 40 hexadecimal characters.';
    if (msg.includes('GOOGLE_AUTH_REQUIRED')) return 'This whitelist accepts Google-authenticated accounts only.';
    if (msg.includes('AUTH_REQUIRED')) return 'Please continue with Google before submitting.';
    return msg;
  }

  async function refreshStats() {
    try {
      const { data, error } = await client.rpc('whitelist_stats');
      if (error) throw error;
      const s = Array.isArray(data) ? data[0] : data;
      if (!s) return;
      const total = Number(s.total || 0);
      const max = Number(s.max_applications || cfg.MAX_APPLICATIONS || 10000);
      const remain = Number(s.remaining ?? Math.max(max - total, 0));
      const pct = Math.min(100, max ? (total / max) * 100 : 0);
      els.count.textContent = total.toLocaleString();
      els.countMini.textContent = `${total.toLocaleString()} / ${max.toLocaleString()}`;
      els.remaining.textContent = `${remain.toLocaleString()} slots remaining`;
      els.bar.style.width = `${pct}%`;
      els.openState.textContent = s.is_open ? 'OPEN' : 'CLOSED';
      els.openState.classList.toggle('online', !!s.is_open);
      if (!s.is_open) els.submitBtn.disabled = true;
    } catch (e) {
      console.warn('stats', e);
    }
  }

  async function loadOwnApplication() {
    const { data, error } = await client
      .from('whitelist_applications')
      .select('application_no,email,wallet_address,status,created_at')
      .maybeSingle();
    if (error) {
      console.warn(error);
      return null;
    }
    if (data) showApplication(data);
    return data;
  }

  function showApplication(app) {
    els.walletForm.classList.add('hidden');
    els.result.classList.remove('hidden');
    els.appNo.textContent = `#DP-${String(app.application_no).padStart(5, '0')}`;
    els.resultWallet.textContent = app.wallet_address;
    els.resultStatus.textContent = String(app.status || 'pending').toUpperCase();
    els.resultEmail.textContent = app.email;
    setMessage('Application locked. This Google account cannot register another wallet.', 'success');
  }

  async function renderSession(session) {
    if (!session?.user) {
      els.authDisconnected.classList.remove('hidden');
      els.authConnected.classList.add('hidden');
      els.walletForm.classList.add('hidden');
      els.result.classList.add('hidden');
      els.authStatus.textContent = 'NOT CONNECTED';
      els.authStatus.classList.remove('ok');
      setMessage('');
      return;
    }
    els.authDisconnected.classList.add('hidden');
    els.authConnected.classList.remove('hidden');
    els.email.textContent = session.user.email || 'Google account';
    els.authStatus.textContent = 'GOOGLE VERIFIED';
    els.authStatus.classList.add('ok');
    els.walletForm.classList.remove('hidden');
    els.result.classList.add('hidden');
    const existing = await loadOwnApplication();
    if (!existing) setMessage('Google verified. Paste the one wallet you want to whitelist. This cannot be changed after submission.');
  }

  els.loginBtn.addEventListener('click', async () => {
    setMessage('Opening Google sign-in…');
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (error) setMessage(friendlyError(error), 'error');
  });

  els.logoutBtn.addEventListener('click', async () => {
    await client.auth.signOut();
    window.location.reload();
  });

  els.walletForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const wallet = els.wallet.value.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      setMessage('Please enter a valid EVM wallet address.', 'error');
      return;
    }
    const confirmed = window.confirm('Lock this wallet to your Google account? You will not be able to submit a second wallet with the same Google account.');
    if (!confirmed) return;
    els.submitBtn.disabled = true;
    els.submitBtn.textContent = 'SUBMITTING...';
    setMessage('Securing your whitelist slot…');
    try {
      const { data, error } = await client.rpc('submit_whitelist', { p_wallet: wallet.toLowerCase() });
      if (error) throw error;
      const app = Array.isArray(data) ? data[0] : data;
      showApplication(app);
      els.wallet.value = '';
      await refreshStats();
    } catch (e) {
      setMessage(friendlyError(e), 'error');
      els.submitBtn.disabled = false;
    } finally {
      els.submitBtn.textContent = 'APPLY FOR WHITELIST';
    }
  });

  client.auth.onAuthStateChange((_event, session) => renderSession(session));
  client.auth.getSession().then(({ data }) => renderSession(data.session));
  refreshStats();
})();
