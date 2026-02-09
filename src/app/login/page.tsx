'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function LoginPage() {
  const { t } = useTranslation();
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#06060e]">
      {/* Animated gradient mesh */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] animate-morph" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[130px] animate-morph" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/8 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Orbiting particles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px]" style={{ animation: 'spin-slow 25s linear infinite' }}>
        <div className="absolute top-0 left-1/2 w-2 h-2 bg-indigo-400/60 rounded-full blur-[1px]" />
        <div className="absolute bottom-0 right-1/2 w-1.5 h-1.5 bg-violet-400/40 rounded-full blur-[1px]" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]" style={{ animation: 'counter-spin 35s linear infinite' }}>
        <div className="absolute top-1/4 right-0 w-1.5 h-1.5 bg-purple-400/50 rounded-full blur-[1px]" />
        <div className="absolute bottom-1/4 left-0 w-1 h-1 bg-indigo-300/30 rounded-full blur-[1px]" />
      </div>

      {/* Floating particles */}
      <div className="absolute top-20 left-20 w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-float" />
      <div className="absolute top-40 right-32 w-2 h-2 bg-violet-400/30 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute top-60 right-20 w-1 h-1 bg-indigo-300/30 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 right-40 w-2 h-2 bg-violet-300/20 rounded-full animate-float" style={{ animationDelay: '4s' }} />

      {/* Login Card */}
      <div className="relative z-10 animate-reveal" style={{ perspective: '1200px' }}>
        <Card className="w-full max-w-[420px] mx-4 border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden rounded-2xl">
          {/* Animated top border */}
          <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 animate-gradient" />

          <CardHeader className="text-center space-y-6 pt-12 pb-4">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-2xl animate-pulse-ring" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-2xl shadow-indigo-500/30 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-indigo-500/50">
                  <FolderKanban className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-white tracking-tight">
                {t('auth.welcome')}
              </CardTitle>
              <CardDescription className="text-base text-slate-400/80 max-w-[280px] mx-auto">
                {t('auth.loginSubtitle')}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-12">
            <Button
              className="w-full h-13 text-base gap-3 rounded-xl bg-white text-slate-900 hover:bg-white/95 shadow-xl shadow-white/5 transition-all duration-400 hover:shadow-2xl hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98] font-semibold border border-white/20"
              onClick={handleGoogleLogin}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('auth.loginGoogle')}
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">Secure</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <p className="text-[11px] text-center text-slate-500/80 leading-relaxed">
              {t('auth.terms')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
