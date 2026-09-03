import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Smartphone, Loader2 } from 'lucide-react';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useToastStore } from '../../../shared/stores/useToastStore';
import { useAdminStore } from '../../../shared/stores/useAdminStore';

export function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToastStore();
  const { login, tryRefresh } = useAdminStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Silently try to refresh — if already logged in, skip the login screen
  useEffect(() => {
    tryRefresh().then((ok) => {
      if (ok) navigate('/admin', { replace: true });
      setChecking(false);
    });
  }, [tryRefresh, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error(t('admin.signInRequired'));
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success(t('admin.welcomeBack'));
      navigate('/admin', { replace: true });
    } catch (err) {
      toast.error(err.message || t('admin.loginError'));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background-primary">
        <Loader2 className="w-7 h-7 text-text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-svh flex items-center justify-center py-12 px-4 text-start bg-background-primary">
      <div className="w-full max-w-md space-y-6 p-8 rounded-3xl bg-background-secondary border border-border-default shadow-md">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-interactive-primary/10 text-text-brand flex items-center justify-center mx-auto shadow-sm">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary">{t('admin.portalTitle')}</h1>
          <p className="text-xs text-text-secondary">{t('admin.portalSubtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label={t('admin.emailLabel')}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label={t('admin.passwordLabel')}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 me-2 animate-spin" />
            ) : (
              <Lock className="w-4 h-4 me-2" />
            )}
            <span>{loading ? t('admin.signingIn') : t('admin.signIn')}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;