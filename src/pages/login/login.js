import { supabase } from '../../core/supabase/client.js';
import { AppState } from '../../state/store.js';
import { router } from '../../router/router.js';

export function init() {
  document.getElementById('appHeader').style.display = 'none';

  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (!tabLogin || !tabSignup || !loginForm || !signupForm) return;

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('bg-white','shadow');
    tabSignup.classList.remove('bg-white','shadow');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  });

  tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('bg-white','shadow');
    tabLogin.classList.remove('bg-white','shadow');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);

    AppState.user = data.user;
    AppState.session = data.session;

    try {
      const { data: tenant } = await supabase
        .from('user_restaurant_roles')
        .select('restaurant_id, restaurants(*), branches(*), roles(name)')
        .eq('user_id', data.user.id).limit(1).single();
      if (tenant) {
        AppState.restaurant = tenant.restaurants;
        AppState.branch = tenant.branches;
        AppState.user.role = tenant.roles?.name || 'admin';
      }
    } catch {}

    document.getElementById('appHeader').style.display = 'flex';
    router.navigate('home');
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    if (password.length < 6) return alert('كلمة المرور قصيرة');

    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) return alert(error.message);
    alert('تم إنشاء الحساب! سجل الدخول الآن.');
    tabLogin.click();
  });
}
