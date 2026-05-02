function initLogin() {
  App.hideUI();

  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginError = document.getElementById('loginError');
  const signupError = document.getElementById('signupError');

  if (!tabLogin || !tabSignup || !loginForm || !signupForm) return;

  // تبديل التبويبات
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('bg-white', 'shadow');
    tabSignup.classList.remove('bg-white', 'shadow');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginError.classList.add('hidden');
  });

  tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('bg-white', 'shadow');
    tabLogin.classList.remove('bg-white', 'shadow');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    signupError.classList.add('hidden');
  });

  // تسجيل الدخول
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    loginError.classList.add('hidden');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      loginError.textContent = error.message.includes('Invalid login')
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        : error.message;
      loginError.classList.remove('hidden');
      return;
    }

    await App.finishLogin(data.user, data.session);
  });

  // إنشاء حساب
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    signupError.classList.add('hidden');

    if (password.length < 6) {
      signupError.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      signupError.classList.remove('hidden');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) {
      signupError.textContent = error.message;
      signupError.classList.remove('hidden');
      return;
    }

    alert('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
    tabLogin.click(); // العودة إلى تبويب تسجيل الدخول
  });
}
