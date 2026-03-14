import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';

const SignUpPage = () => {
  return (
    <div className="min-h-screen bg-app px-4 py-4 text-ink sm:px-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-line/70 bg-surface/85 px-4 py-4 shadow-soft backdrop-blur">
          <BrandMark />
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <Link to="/sign-in" className="rounded-full border border-line/70 bg-surface-muted px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5">
              Login
            </Link>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-7.5rem)] overflow-hidden rounded-[2rem] border border-line/70 bg-surface/85 shadow-soft backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex items-center justify-center bg-[linear-gradient(135deg,rgba(230,57,70,0.95),rgba(244,162,97,0.92),rgba(42,157,143,0.92))] px-6 py-10 text-white sm:px-10 lg:px-12">
            <div className="max-w-xl">
              <p className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em]">Modern SaaS Workspace</p>
              <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Build a leaner, greener kitchen operation.</h1>
              <p className="mt-5 text-sm leading-7 text-white/88 sm:text-base">
                Create your AHAR workspace to unify waste prediction, multilingual workflows, and intelligent donation coordination across your hospitality teams.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold">Unified operations</p>
                  <p className="mt-2 text-sm text-white/82">Track stock, prep demand, and NGO routing from a single fixed command center.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold">Regional accessibility</p>
                  <p className="mt-2 text-sm text-white/82">Switch the UI across nine Indian languages with persistent translation caching.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
            <div className="w-full max-w-md rounded-[2rem] border border-line/70 bg-surface-raised/95 p-4 shadow-soft sm:p-6">
              <SignUp path="/sign-up" routing="path" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;