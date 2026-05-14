import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NavLink {
  label: string
  href: string
}

interface AnimatedHeroProps {
  backgroundImageUrl: string
  logo: React.ReactNode
  navLinks: NavLink[]
  topRightAction?: React.ReactNode
  title: string
  description: string
  ctaButton: {
    text: string
    onClick: () => void
  }
  secondaryCta?: {
    text: string
    onClick: () => void
  }
  className?: string
}

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
}

const itemVariants = {
  hidden:  { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

export const AnimatedHero = ({
  backgroundImageUrl,
  logo,
  navLinks,
  topRightAction,
  title,
  description,
  ctaButton,
  secondaryCta,
  className,
}: AnimatedHeroProps) => {
  /* Reusable glass button — white/10 blur cam efekti */
  const glassCls =
    'bg-white/10 backdrop-blur-sm border border-white/25 text-white hover:bg-white/20 transition-colors duration-200'

  /* Sage-tinted primary button */
  const primaryCls =
    'bg-sage hover:bg-sage-dark border border-sage-light/30 text-white backdrop-blur-sm transition-all duration-200 shadow-lg shadow-sage/25 hover:shadow-sage/40 hover:-translate-y-0.5'

  return (
    <div
      className={cn(
        'relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden',
        className,
      )}
    >
      {/* ── Arka Plan ── */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      >
        {/* Degrade overlay — alt kısımda daha yoğun, sage tonu karışımı */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        {/* Çok hafif sage renk tonu */}
        <div className="absolute inset-0 bg-sage-dark/10" />
      </div>

      {/* ── Floating Navbar ── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="absolute top-0 z-20 flex h-20 w-full items-center justify-between px-6 md:px-12"
      >
        {/* Logo */}
        <div className="flex items-center gap-2">{logo}</div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3.5 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Sağ aksiyon */}
        <div className="hidden md:block">{topRightAction}</div>
      </motion.header>

      {/* ── Hero İçerik ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-start justify-center text-left px-6 md:px-16 max-w-5xl w-full"
      >
        {/* Lokasyon rozeti */}
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-light animate-pulse" />
            İstanbul · Fatih &amp; Beyoğlu
          </span>
        </motion.div>

        {/* Başlık */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl leading-[1.06] max-w-3xl"
        >
          {title}
        </motion.h1>

        {/* Açıklama */}
        <motion.p
          variants={itemVariants}
          className="mt-7 max-w-xl text-lg leading-relaxed text-white/70"
        >
          {description}
        </motion.p>

        {/* Butonlar */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <motion.div
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <Button onClick={ctaButton.onClick} size="lg" className={primaryCls}>
              {ctaButton.text}
            </Button>
          </motion.div>

          {secondaryCta && (
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Button onClick={secondaryCta.onClick} size="lg" className={glassCls}>
                {secondaryCta.text}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Alt kısım gölge */}
      <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
    </div>
  )
}
