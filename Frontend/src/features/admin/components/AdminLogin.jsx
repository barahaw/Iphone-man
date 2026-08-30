import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Smartphone } from 'lucide-react';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useToastStore } from '../../../shared/stores/useToastStore';

export function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToastStore();
  const [email, setEmail] = useState('admin@iphoneman.com');
  const [password, setPassword] = useState('password123');

  useEffect(() => {
    if (localStorage.getItem('adminToken')) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error(t('admin.signInRequired'));
      return;
    }
    // Simulate Admin JWT Auth
    localStorage.setItem('adminToken', 'jwt_mock_token_super_admin');
    toast.success(t('admin.welcomeBack'));
    navigate('/admin');
  };

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
          />
          <Input
            label={t('admin.passwordLabel')}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            <Lock className="w-4 h-4 me-2" />
            <span>{t('admin.signIn')}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;