document.addEventListener('DOMContentLoaded', () => {
    let isLoginMode = true;

    const form = document.getElementById('auth-form');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('submit-btn');
    const switchText = document.getElementById('switch-text');
    const switchLink = document.getElementById('switch-link');
    const alertBox = document.getElementById('alert-box');

    // Toggle between Login and Register Mode
    switchLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        if (isLoginMode) {
            title.textContent = 'ورود به حساب';
            subtitle.textContent = 'برای ادامه وارد شوید';
            submitBtn.textContent = 'ورود';
            switchText.textContent = 'حساب کاربری ندارید؟';
            switchLink.textContent = 'ثبت‌نام کنید';
        } else {
            title.textContent = 'ثبت‌نام در مانگاتا';
            subtitle.textContent = 'حساب کاربری جدید ایجاد کنید';
            submitBtn.textContent = 'ثبت‌نام';
            switchText.textContent = 'قبلاً ثبت‌نام کرده‌اید؟';
            switchLink.textContent = 'وارد شوید';
        }

        // Clear forms and alerts on switch
        form.reset();
        showAlert('', '');
    });

    const showAlert = (message, type) => {
        alertBox.textContent = message;
        alertBox.className = 'alert'; // reset classes
        if (message) {
            alertBox.classList.add(type); // 'error' or 'success'
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = form.username.value.trim();
        const password = form.password.value;

        if (!username || !password) {
            return showAlert('لطفا تمامی فیلدها را پر کنید.', 'error');
        }

        if (password.length < 6) {
            return showAlert('رمز عبور باید حداقل ۶ کاراکتر باشد.', 'error');
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'کمی صبر کنید...';
        showAlert('', '');

        const endpoint = isLoginMode ? '/api/auth/login.php' : '/api/auth/register.php';

        try {
            // NOTE: 'credentials: include' is absolutely required to send Session Cookies securely 
            // as per your architectural requirement.
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include', 
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'خطایی در ارتباط با سرور رخ داد.');
            }

            showAlert(data.message, 'success');

            if (isLoginMode) {
                // Redirect user based on their role
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin.html';
                    } else {
                        window.location.href = '/dashboard.html';
                    }
                }, 1000);
            } else {
                // If Registration is successful, force them to login mode manually
                setTimeout(() => {
                    switchLink.click();
                    form.username.value = username;
                    showAlert('ثبت‌نام با موفقیت انجام شد. حالا وارد شوید.', 'success');
                }, 1500);
            }

        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? 'ورود' : 'ثبت‌نام';
        }
    });
});
