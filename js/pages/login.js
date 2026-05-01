// =============================================
// صفحة تسجيل الدخول (without reload)
// =============================================

function initLogin() {
  document.getElementById('appHeader').style.display = 'none';
  document.getElementById('appSidebar').style.display = 'none';

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
    const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    // نقل المستخدم مباشرة دون إعادة تحميل
    await window.App.finishLogin(data.user, data.session);
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const { data, error } = await window.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) return alert(error.message);
    alert('تم إنشاء الحساب! يمكنك الآن تسجيل الدخول.');
    tabLogin.click();
  });
}
