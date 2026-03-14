import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';

const SignInPage = () => {
  return (
    <div className="min-h-screen bg-app px-4 py-4 text-ink sm:px-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-line/70 bg-surface/85 px-4 py-4 shadow-soft backdrop-blur">
          <BrandMark />
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <Link to="/sign-up" className="rounded-full bg-gradient-to-r from-brand-red to-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5">
              Register
            </Link>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-7.5rem)] overflow-hidden rounded-[2rem] border border-line/70 bg-surface/85 shadow-soft backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-red via-brand-orange to-brand-teal p-8 text-white sm:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.22),transparent_40%)]" />
            <div className="relative z-10 max-w-xl">
              <p className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em]">Food Waste Prediction System</p>
              <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Plan every meal with live kitchen intelligence.</h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/88 sm:text-base">
                AHAR helps hospitality teams monitor stock, predict demand, and route surplus food to nearby NGOs with one modern operating dashboard.
              </p>
            </div>
            <div className="relative z-10 mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.28em] text-white/70">Prediction</p>
                <p className="mt-3 text-2xl font-semibold">92%</p>
                <p className="mt-1 text-sm text-white/80">forecast confidence</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.28em] text-white/70">Inventory</p>
                <p className="mt-3 text-2xl font-semibold">24h</p>
                <p className="mt-1 text-sm text-white/80">expiry watch window</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.28em] text-white/70">Redistribution</p>
                <p className="mt-3 text-2xl font-semibold">3.2 km</p>
                <p className="mt-1 text-sm text-white/80">nearest partner average</p>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
            <div className="w-full max-w-md rounded-[2rem] border border-line/70 bg-surface-raised/95 p-4 shadow-soft sm:p-6">
              <SignIn path="/sign-in" routing="path" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;