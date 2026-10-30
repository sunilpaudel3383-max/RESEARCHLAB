import React, { useState } from 'react';
import {
  LogIn,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  Users,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { Collaborator } from '../lib/types';
import { ADMIN_USER } from '../lib/mock-data';
import {
  verifyAdminCredentials,
  verifyMemberCredentials,
  setMemberFirstLoginPassword,
  lockDefaultMemberPassword,
  recordMemberSuccessiveLogin,
  sanitizeCollaborator,
} from '../lib/auth-crypto';

interface LoginPageProps {
  onLoginSuccess: (user: Collaborator, platformType: 'admin' | 'member') => void;
  onNavigateHome: () => void;
  registeredMembers?: Collaborator[];
  onUpdateMember?: (updatedMember: Collaborator) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateHome,
  registeredMembers = [],
  onUpdateMember,
}) => {
  const [loginMode, setLoginMode] = useState<'admin' | 'member'>('admin');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // First Login Password Setup State
  const [firstLoginMember, setFirstLoginMember] = useState<Collaborator | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [firstLoginError, setFirstLoginError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleModeChange = (mode: 'admin' | 'member') => {
    setLoginMode(mode);
    setAuthError(null);
    setFirstLoginMember(null);
    setUsernameOrEmail('');
    setPassword('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const inputClean = usernameOrEmail.trim().toLowerCase();
    const passwordClean = password;

    if (!inputClean || !passwordClean) {
      setAuthError('Please enter both your credentials to continue.');
      return;
    }

    setIsVerifying(true);

    try {
      // 1. CRYPTOGRAPHIC ADMIN AUTHENTICATION
      if (loginMode === 'admin') {
        const isValid = await verifyAdminCredentials(inputClean, passwordClean);
        if (isValid) {
          const adminUser: Collaborator = sanitizeCollaborator({
            ...ADMIN_USER,
            role: 'owner',
          });
          onLoginSuccess(adminUser, 'admin');
          return;
        }

        setAuthError('Access Denied: Invalid administrator credentials.');
        return;
      }

      // 2. CRYPTOGRAPHIC MEMBER AUTHENTICATION
      if (loginMode === 'member') {
        const matchedMember = registeredMembers.find(
          (m) => m.email.toLowerCase() === inputClean && m.id !== ADMIN_USER.id
        );

        if (!matchedMember) {
          setAuthError(
            'No member account found with this email. Only the laboratory administrator (sunil@researchlab.np) can authorize new members.'
          );
          return;
        }

        const verification = await verifyMemberCredentials(inputClean, passwordClean);
        if (!verification.success) {
          setAuthError(verification.reason || 'Invalid password for this member account.');
          return;
        }

        // Check if this is the member's 1st login
        if (verification.isFirstLogin) {
          setFirstLoginMember(matchedMember);
          setNewPassword('');
          setConfirmPassword('');
          setFirstLoginError(null);
          return;
        }

        // Successive login: update login count & enter
        recordMemberSuccessiveLogin(matchedMember.email);
        const safeMember = sanitizeCollaborator(matchedMember);
        if (onUpdateMember) onUpdateMember(safeMember);
        onLoginSuccess(safeMember, 'member');
        return;
      }
    } catch (err: any) {
      console.error('Login verification error:', err);
      setAuthError('An authentication error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle setting permanent password on first login
  const handleSaveFirstLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstLoginMember) return;
    setFirstLoginError(null);

    if (!newPassword.trim()) {
      setFirstLoginError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setFirstLoginError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFirstLoginError('New password and confirmation do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const result = await setMemberFirstLoginPassword(firstLoginMember.email, newPassword);
      if (!result.success) {
        setFirstLoginError(result.error || 'Could not update password.');
        return;
      }

      const updatedMember: Collaborator = sanitizeCollaborator(firstLoginMember);

      if (onUpdateMember) {
        onUpdateMember(updatedMember);
      }
      onLoginSuccess(updatedMember, 'member');
    } catch (err: any) {
      console.error('Error saving password:', err);
      setFirstLoginError('Failed to save password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Handle keeping default password on first login
  const handleKeepDefaultPassword = () => {
    if (!firstLoginMember) return;
    lockDefaultMemberPassword(firstLoginMember.email);

    const updatedMember: Collaborator = sanitizeCollaborator(firstLoginMember);

    if (onUpdateMember) {
      onUpdateMember(updatedMember);
    }
    onLoginSuccess(updatedMember, 'member');
  };

  return (
    <div className="min-h-full bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center space-x-2 text-stone-900 group mb-3 cursor-pointer"
        >
          <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-serif font-bold text-lg flex items-center justify-center shadow-xs group-hover:bg-indigo-700 transition-colors">
            RL
          </span>
          <span className="font-serif font-bold text-2xl text-stone-900 tracking-tight">
            ResearchLab
          </span>
        </button>
        <h2 className="text-xl font-serif font-semibold text-stone-800">
          Institutional Access Gateway
        </h2>
        <p className="text-xs text-stone-500 font-serif mt-1">
          Cryptographically encrypted and confidential research platform
        </p>
      </div>

      {/* Auth Card or First-Time Password Setup Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-stone-200">
          {firstLoginMember ? (
            /* First-Time Login Password Change Screen */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  First Login: Set Your Password
                </h3>
                <p className="text-xs text-stone-600">
                  Welcome, <strong>{firstLoginMember.name}</strong> ({firstLoginMember.email})
                </p>
              </div>

              {/* Security Policy Explanation Banner */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold text-amber-950">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Encrypted Credentials Policy</span>
                </div>
                <p className="leading-relaxed text-[11px] text-amber-800">
                  You are logging in with your temporary default password (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">member123</code>). You can customize your secret password now. After this 1st login, your password will be encrypted and <strong>permanently locked against future changes</strong>.
                </p>
              </div>

              <form onSubmit={handleSaveFirstLoginPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    New Secret Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-stone-50/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Confirm Secret Password *
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                  />
                </div>

                {firstLoginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{firstLoginError}</span>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingPassword ? 'Encrypting & Saving...' : 'Set Permanent Password & Enter Lab'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleKeepDefaultPassword}
                    className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    Keep Default ('member123') & Enter
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Standard Login Mode Switcher & Form */
            <>
              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => handleModeChange('admin')}
                  className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    loginMode === 'admin'
                      ? 'bg-white text-purple-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-purple-700" />
                  <span>Administrator Portal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('member')}
                  className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    loginMode === 'member'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Research Member</span>
                </button>
              </div>

              {/* Role Status Explanation */}
              <div
                className={`p-3 rounded-xl border text-xs mb-6 ${
                  loginMode === 'admin'
                    ? 'bg-purple-50/50 border-purple-200 text-purple-950'
                    : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                }`}
              >
                {loginMode === 'admin' ? (
                  <p className="leading-relaxed">
                    <strong>Principal Investigator & Lab Director:</strong> Cryptographically verified directorate access.
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="leading-relaxed">
                      <strong>Researcher Member Workspace:</strong> Initial access password is <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded font-bold">member123</code>.
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Password can be customized on first login and is locked on successive logins.
                    </p>
                  </div>
                )}
              </div>

              {/* Login Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {loginMode === 'admin' ? 'Administrator Email' : 'Member Email Address'}
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder={
                      loginMode === 'admin'
                        ? 'Enter administrator email'
                        : 'name@institution.edu'
                    }
                    className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-stone-50/50 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-stone-50/50 text-stone-900 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className={`w-full py-2.5 text-xs font-semibold rounded-xl text-white shadow-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer ${
                    loginMode === 'admin'
                      ? 'bg-purple-700 hover:bg-purple-800'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>
                    {isVerifying
                      ? 'Authenticating...'
                      : loginMode === 'admin'
                      ? 'Sign In to Directorate Console'
                      : 'Sign In to Member Platform'}
                  </span>
                </button>
              </form>

              {/* Security Policy Footnote */}
              <div className="mt-6 pt-5 border-t border-stone-200 text-center space-y-1.5">
                <p className="text-[11px] text-stone-500 flex items-center justify-center space-x-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Zero-Knowledge Salted SHA-256 Encryption</span>
                </p>
                <p className="text-[10px] text-stone-400">
                  Passwords are encrypted with cryptographic salts and are never visible to peers.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
