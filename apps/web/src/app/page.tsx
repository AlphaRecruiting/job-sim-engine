import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">JS</span>
          </div>
          <span className="font-semibold text-slate-900 text-lg">JobSim</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login/applicant" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors px-4 py-2">
            I&apos;m a candidate
          </Link>
          <Link href="/login/company" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Company login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 uppercase tracking-wide">
          AI-powered hiring
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight max-w-3xl mb-6">
          Hire on skill,<br />not just on paper
        </h1>
        <p className="text-xl text-slate-500 max-w-xl mb-12 leading-relaxed">
          Replace take-home assignments with real work simulations. Candidates do the actual job — AI scores the results instantly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/login/company" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-indigo-700 transition-colors shadow-sm">
            Get started — it&apos;s free
          </Link>
          <Link href="/login/applicant" className="text-slate-700 px-8 py-4 rounded-xl font-semibold text-base hover:bg-slate-100 transition-colors border border-slate-200">
            Access my simulation
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Everything you need to assess talent</h2>
          <p className="text-slate-500 text-center mb-16 max-w-xl mx-auto">Six simulation modules, instant AI scoring, and a full analytics dashboard — all in one platform.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Real work scenarios',
                desc: 'Email responses, CRM prioritisation, mock calls, multi-choice assessments and more — built to mimic actual day-to-day tasks.',
              },
              {
                icon: '⚡',
                title: 'Instant AI scoring',
                desc: 'Every submission is evaluated automatically against a configurable rubric. No waiting, no manual review for standard tasks.',
              },
              {
                icon: '📊',
                title: 'Actionable insights',
                desc: 'See skill scores, red flags, and a hiring recommendation for every candidate the moment they finish.',
              },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-16">How it works</h2>
          <div className="space-y-12">
            {[
              { step: '01', title: 'Create a job posting', desc: 'Add your role details and let AI generate a tailored simulation — or build your own from scratch using our module library.' },
              { step: '02', title: 'Invite candidates', desc: 'Send a unique link to each candidate. They complete the simulation at their own pace, no account required.' },
              { step: '03', title: 'Review and decide', desc: 'Each completed simulation shows a score, recommendation, skill breakdown, and full submission transcript.' },
            ].map(item => (
              <div key={item.step} className="flex gap-8 items-start">
                <div className="text-5xl font-bold text-indigo-100 select-none shrink-0 w-16 text-right leading-none mt-1">{item.step}</div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-xl mb-2">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-indigo-600 py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to hire smarter?</h2>
        <p className="text-indigo-200 mb-8 max-w-md mx-auto">Set up your first simulation in minutes. No credit card required.</p>
        <Link href="/login/company" className="inline-block bg-white text-indigo-600 font-semibold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors">
          Start for free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-8 flex items-center justify-between text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">JS</span>
          </div>
          <span>JobSim</span>
        </div>
        <span>© {new Date().getFullYear()} JobSim. All rights reserved.</span>
      </footer>
    </div>
  );
}
