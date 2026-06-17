import Link from 'next/link';

export default function HomePage() {
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
          <Link href="/employer" className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors px-3 py-2">
            Per le aziende
          </Link>
          <Link href="/candidate/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors px-3 py-2">
            Accedi
          </Link>
          <Link href="/jobs" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Trova lavoro
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 uppercase tracking-wide">
          Selezione basata sulle competenze
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight max-w-3xl mb-6">
          Fatti assumere per<br />quello che sai fare
        </h1>
        <p className="text-xl text-slate-500 max-w-xl mb-12 leading-relaxed">
          Niente lettere di presentazione. Niente test generici. Completa una breve simulazione del lavoro reale e mostra le tue competenze direttamente alle aziende.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/jobs" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-indigo-700 transition-colors shadow-sm">
            Sfoglia le posizioni aperte
          </Link>
          <Link href="/login/applicant" className="text-slate-700 px-8 py-4 rounded-xl font-semibold text-base hover:bg-slate-100 transition-colors border border-slate-200">
            Ho un invito →
          </Link>
        </div>
      </section>

      {/* How it works for candidates */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Come funziona per te</h2>
          <p className="text-slate-500 text-center mb-16 max-w-xl mx-auto">In tre semplici passi, passi dai CV ignorati a un colloquio concreto.</p>
          <div className="space-y-12">
            {[
              { step: '01', title: 'Candidati in un click', desc: "Trova una posizione aperta e candidati. Nessun account richiesto, nessuna lettera di presentazione. Solo il tuo nome e la tua email." },
              { step: '02', title: 'Completa la simulazione', desc: 'Svolgi task reali del ruolo — rispondi a email, gestisci priorità, simula una chiamata. Ogni step è pensato per farti brillare.' },
              { step: '03', title: 'Vieni notato per le tue competenze', desc: "L'azienda riceve il tuo punteggio, la tua valutazione e la trascrizione completa. Se sei bravo, ti contatteranno." },
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

      {/* Why JobSim for candidates */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Perché è diverso</h2>
          <p className="text-slate-500 text-center mb-16 max-w-xl mx-auto">Smettila di competere solo sul formato del CV. Qui vinci se sei bravo.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Task reali, non test astratti',
                desc: 'Rispondi a email vere, prioritizza lead CRM, simula una chiamata commerciale. Le aziende vedono come lavori davvero.',
              },
              {
                icon: '⚡',
                title: 'Feedback immediato',
                desc: "Ogni simulazione viene valutata automaticamente. Completi, invii, e l'azienda riceve i risultati in tempo reale.",
              },
              {
                icon: '🔒',
                title: 'Il tuo profilo, per sempre',
                desc: 'Crea il tuo account candidato, carica CV e foto, e porta il tuo profilo con te in ogni candidatura.',
              },
            ].map(f => (
              <div key={f.title} className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-indigo-600 py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Pronto a dimostrare le tue competenze?</h2>
        <p className="text-indigo-200 mb-8 max-w-md mx-auto">Sfoglia le posizioni aperte e candidati in meno di un minuto.</p>
        <Link href="/jobs" className="inline-block bg-white text-indigo-600 font-semibold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors">
          Vedi le posizioni aperte
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
        <div className="flex items-center gap-6">
          <Link href="/employer" className="hover:text-slate-600 transition-colors">Per le aziende</Link>
          <span>© {new Date().getFullYear()} JobSim. Tutti i diritti riservati.</span>
        </div>
      </footer>
    </div>
  );
}
