import { Map } from 'lucide-react'

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L2.25 2.25h6.928l4.303 5.69 5.763-5.69Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-sage/15 bg-offwhite">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <div className="flex items-center gap-1.5 text-sage-dark font-bold">
            <Map size={16} strokeWidth={2.5} />
            Spotly
          </div>
          <p className="text-xs text-stone-400 italic">Şehri senin ritminle keşfet.</p>
        </div>

        <div className="flex items-center gap-3">
          {[
            { icon: <IconInstagram />, label: 'Instagram' },
            { icon: <IconX />, label: 'X' },
            { icon: <IconLinkedIn />, label: 'LinkedIn' },
          ].map(({ icon, label }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="w-8 h-8 rounded-full border border-sage/20 flex items-center justify-center text-stone-400 hover:text-sage-dark hover:border-sage/40 transition-colors duration-200 cursor-pointer"
            >
              {icon}
            </a>
          ))}
        </div>

        <p className="text-xs text-stone-400">© {new Date().getFullYear()} Spotly. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  )
}
