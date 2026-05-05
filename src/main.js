import './core/config.js';
import { supabase } from './core/supabase/client.js';
import { AppState } from './state/store.js';
import { router } from './router/router.js';

async function initApp() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    AppState.user = session.user;
    AppState.session = session;
    await loadTenantData();
    showUI();
    router.navigate('home');
  } else {
    hideUI();
    router.navigate('login');
  }
}

async function loadTenantData() {
  const { data } = await supabase
    .from('user_restaurant_roles')
    .select('restaurant_id, restaurants(*), branches(*), roles(name)')
    .eq('user_id', AppState.user.id)
    .single();
  if (data) {
    AppState.restaurant = data.restaurants;
    AppState.branch = data.branches;
    AppState.user.role = data.roles?.name || 'admin';
  }
}

function showUI() { 
  document.getElementById('appHeader').style.display = 'flex'; 
}
function hideUI() { 
  document.getElementById('appHeader').style.display = 'none'; 
}

document.getElementById('langToggleBtn').addEventListener('click', () => {
  AppState.language = AppState.language === 'ar' ? 'en' : 'ar';
  document.documentElement.lang = AppState.language;
  document.documentElement.dir = AppState.language === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('langLabel').textContent = AppState.language === 'ar' ? 'English' : 'العربية';
  router.reload();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  AppState.user = null;
  hideUI();
  router.navigate('login');
});

initApp();
