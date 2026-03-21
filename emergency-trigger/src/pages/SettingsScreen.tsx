import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Globe, 
  Bell, 
  Shield,
  Smartphone,
  Camera,
  Mic,
  Navigation,
  ChevronRight,
  LogOut,
  Link2,
  Home,
  Briefcase
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}

const SettingItem = ({ icon: Icon, label, description, onClick, trailing }: SettingItemProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
  >
    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-foreground">{label}</h3>
      {description && (
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      )}
    </div>
    {trailing || <ChevronRight className="w-5 h-5 text-muted-foreground" />}
  </button>
);

interface PermissionItemProps {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const PermissionItem = ({ icon: Icon, label, description, enabled, onToggle }: PermissionItemProps) => (
  <div className="flex items-center gap-4 p-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
      enabled ? 'bg-medical-light' : 'bg-muted'
    }`}>
      <Icon className={`w-5 h-5 ${enabled ? 'text-medical' : 'text-muted-foreground'}`} />
    </div>
    <div className="flex-1">
      <h3 className="font-medium text-foreground">{label}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch checked={enabled} onCheckedChange={onToggle} />
  </div>
);

const SettingsScreen = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, verificationStatus } = useApp();

  const [permissions, setPermissions] = useState({
    gps: verificationStatus.gps === 'enabled',
    camera: true,
    microphone: true,
    notifications: true,
  });

  const [language, setLanguage] = useState('English');

  const handleLanguageChange = () => {
    const languages = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu'];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
    toast({
      title: "Language Changed",
      description: `App language set to ${languages[nextIndex]}`,
    });
  };

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    navigate('/');
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => {
      const newValue = !prev[key];
      toast({
        title: `${key.charAt(0).toUpperCase() + key.slice(1)} ${newValue ? 'Enabled' : 'Disabled'}`,
        description: newValue ? 'Permission granted' : 'Permission revoked',
      });
      return { ...prev, [key]: newValue };
    });
  };

  return (
    <MobileLayout
      showHeader
      headerContent={
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your preferences</p>
          </div>
        </div>
      }
      footer={<BottomNav />}
    >
      <div className="py-4">
        {/* Profile Section */}
        <div className="px-4 mb-4">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emergency flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">{user?.name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">+91 {user?.phone || '98765 43210'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-medical-light text-medical text-xs font-medium rounded-full">
                    Verified
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* ABHA Section */}
        <div className="px-4 mb-4">
          <div className="bg-safe-light border border-safe/20 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Link2 className="w-5 h-5 text-safe" />
              <h3 className="font-semibold text-foreground">ABHA Linked</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Health ID: {user?.abhaId || 'user@abdm'}
            </p>
            <p className="text-xs text-muted-foreground">
              Your health records are accessible during emergencies
            </p>
          </div>
        </div>

        {/* Saved Locations */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
            Saved Locations
          </h3>
          <div className="bg-card border-y border-border divide-y divide-border">
            <SettingItem
              icon={Home}
              label="Home"
              description={user?.savedLocations?.find(l => l.type === 'home')?.address || 'Not set'}
              onClick={() => navigate('/onboarding/locations')}
            />
            <SettingItem
              icon={Briefcase}
              label="Work"
              description={user?.savedLocations?.find(l => l.type === 'work')?.address || 'Not set'}
              onClick={() => navigate('/onboarding/locations')}
            />
            <SettingItem
              icon={MapPin}
              label="Frequent Places"
              description="Manage your saved locations"
              onClick={() => navigate('/onboarding/locations')}
            />
          </div>
        </div>

        {/* Language */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
            Language
          </h3>
          <div className="bg-card border-y border-border">
            <SettingItem
              icon={Globe}
              label="App Language"
              description={language}
              onClick={handleLanguageChange}
            />
          </div>
        </div>

        {/* Permissions */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
            Device Permissions
          </h3>
          <div className="bg-card border-y border-border divide-y divide-border">
            <PermissionItem
              icon={Navigation}
              label="GPS Location"
              description="Required for emergency response"
              enabled={permissions.gps}
              onToggle={() => togglePermission('gps')}
            />
            <PermissionItem
              icon={Camera}
              label="Camera"
              description="For uploading injury photos"
              enabled={permissions.camera}
              onToggle={() => togglePermission('camera')}
            />
            <PermissionItem
              icon={Mic}
              label="Microphone"
              description="For voice-guided assistance"
              enabled={permissions.microphone}
              onToggle={() => togglePermission('microphone')}
            />
            <PermissionItem
              icon={Bell}
              label="Notifications"
              description="Emergency alerts and updates"
              enabled={permissions.notifications}
              onToggle={() => togglePermission('notifications')}
            />
          </div>
        </div>

        {/* Security */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
            Security
          </h3>
          <div className="bg-card border-y border-border">
            <SettingItem
              icon={Shield}
              label="Verification Status"
              description="View your security settings"
              onClick={() => navigate('/verification')}
            />
          </div>
        </div>

        {/* Logout */}
        <div className="px-4 mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-emergency-light text-emergency rounded-2xl font-semibold hover:bg-emergency hover:text-primary-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>

        {/* Version Info */}
        <div className="text-center text-xs text-muted-foreground mt-6 pb-4">
          <p>RoadResQ v1.0.0</p>
          <p>© 2024 RoadResQ. All rights reserved.</p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default SettingsScreen;
