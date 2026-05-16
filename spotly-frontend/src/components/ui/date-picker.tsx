import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isSameDay, isSameMonth,
  isAfter, isBefore, startOfDay,
} from 'date-fns'
import { tr } from 'date-fns/locale'

/* ─── Helpers ─── */
const DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']
const today = startOfDay(new Date())
const MIN_YEAR = 1920
const MAX_DATE = today // doğum tarihi bugünden ileri olamaz

/* ─── Props ─── */
interface DatePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  error?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Doğum tarihi seç',
  error = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewDate, setViewDate] = React.useState<Date>(value ?? new Date(2000, 0, 1))

  /* Ay grid hesabı */
  const monthStart = startOfMonth(viewDate)
  const monthEnd   = endOfMonth(viewDate)
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd })
  /* Pazartesi = 0, ... Pazar = 6 */
  const startOffset = (getDay(monthStart) + 6) % 7

  function prevMonth() { setViewDate((d) => subMonths(d, 1)) }
  function nextMonth() { setViewDate((d) => addMonths(d, 1)) }

  function selectDay(day: Date) {
    if (isAfter(day, MAX_DATE)) return
    if (isBefore(day, new Date(MIN_YEAR, 0, 1))) return
    onChange(day)
    setOpen(false)
  }

  /* Yıl hızlı seçimi */
  const currentYear = viewDate.getFullYear()
  const years = Array.from({ length: today.getFullYear() - MIN_YEAR + 1 }, (_, i) => today.getFullYear() - i)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm text-left
            bg-stone-50 transition-all duration-200 cursor-pointer outline-none
            focus:bg-offwhite focus:ring-2
            ${error
              ? 'border-red-300 ring-2 ring-red-100 text-stone-800'
              : open
                ? 'border-sage ring-2 ring-sage/20 bg-offwhite'
                : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-offwhite'
            }`}
        >
          <Calendar size={15} className={value ? 'text-sage' : 'text-stone-400'} />
          <span className={value ? 'text-stone-800' : 'text-stone-400'}>
            {value ? format(value, 'd MMMM yyyy', { locale: tr }) : placeholder}
          </span>
        </button>
      </Popover.Trigger>

      <AnimatePresence>
        {open && (
          <Popover.Portal forceMount>
            <Popover.Content asChild align="start" sideOffset={8} avoidCollisions>
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="z-[3000] w-72 bg-offwhite rounded-2xl shadow-2xl border border-stone-100 p-4 outline-none"
              >
                {/* ── Ay / Yıl navigasyonu ── */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-sage/10 text-stone-500 hover:text-sage-dark transition cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Ay etiketi */}
                    <span className="text-sm font-semibold text-stone-700">
                      {format(viewDate, 'MMMM', { locale: tr })}
                    </span>
                    {/* Yıl dropdown */}
                    <select
                      value={currentYear}
                      onChange={(e) => setViewDate(new Date(Number(e.target.value), viewDate.getMonth(), 1))}
                      className="text-sm font-semibold text-stone-700 bg-transparent border-none outline-none cursor-pointer hover:text-sage-dark transition"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={nextMonth}
                    disabled={isAfter(addMonths(viewDate, 1), MAX_DATE)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-sage/10 text-stone-500 hover:text-sage-dark transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* ── Gün başlıkları ── */}
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-stone-400 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* ── Takvim grid ── */}
                <div className="grid grid-cols-7 gap-y-0.5">
                  {/* Boş offset hücreleri */}
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`e-${i}`} />
                  ))}

                  {days.map((day) => {
                    const isSelected  = value ? isSameDay(day, value) : false
                    const isToday     = isSameDay(day, today)
                    const isDisabled  = isAfter(day, MAX_DATE)
                    const isThisMonth = isSameMonth(day, viewDate)

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => selectDay(day)}
                        className={`
                          h-8 w-full flex items-center justify-center text-xs rounded-lg transition-all duration-150 cursor-pointer
                          ${isSelected
                            ? 'bg-sage text-white font-semibold shadow-sm'
                            : isToday
                              ? 'border border-sage/50 text-sage-dark font-semibold hover:bg-sage/10'
                              : isThisMonth
                                ? 'text-stone-700 hover:bg-sage/10 hover:text-sage-dark'
                                : 'text-stone-300'}
                          ${isDisabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>

                {/* ── Seçili tarih göstergesi ── */}
                {value && (
                  <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500">
                      {format(value, 'd MMMM yyyy', { locale: tr })}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChange(null)}
                      className="text-xs text-stone-400 hover:text-red-500 transition cursor-pointer"
                    >
                      Temizle
                    </button>
                  </div>
                )}
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        )}
      </AnimatePresence>
    </Popover.Root>
  )
}
