import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, ImageIcon, Check, CloudUpload } from 'lucide-react'

/* ─── Tipler ─── */
export type PickerTarget = 'banner' | 'avatar'

export interface ImagePickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: PickerTarget
  currentUrl?: string
  onSave: (url: string) => void
}

/* ─── Spotly Gallery — İstanbul & Fotoğrafçı temalı ─── */
const GALLERY_IMAGES: { url: string; label: string }[] = [
  {
    url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
    label: 'Galata Panorama',
  },
  {
    url: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=800&q=80',
    label: 'Boğaz Gece',
  },
  {
    url: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=800&q=80',
    label: 'Kapalıçarşı',
  },
  {
    url: 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&w=800&q=80',
    label: 'Galata Kulesi',
  },
  {
    url: 'https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&fit=crop&w=800&q=80',
    label: 'Neon Sokak',
  },
  {
    url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=800&q=80',
    label: 'Fotoğraf Makinesi',
  },
  {
    url: 'https://images.unsplash.com/photo-1606918801925-e2c914c4b503?auto=format&fit=crop&w=800&q=80',
    label: 'Sisli Sabah',
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    label: 'Film Makinesi',
  },
  {
    url: 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&w=800&q=80',
    label: 'Vintage Kamera',
  },
]

const easing = [0.25, 0.46, 0.45, 0.94] as const

/* ───────────────────────────────────────────
   Ana Modal
─────────────────────────────────────────── */
export function ImagePickerModal({
  open,
  onOpenChange,
  target,
  currentUrl,
  onSave,
}: ImagePickerModalProps) {
  const [tab, setTab]               = React.useState<'gallery' | 'upload'>('gallery')
  const [selectedGallery, setSelGallery] = React.useState<string | null>(currentUrl ?? null)
  const [uploadedUrl, setUploadedUrl]    = React.useState<string | null>(null)
  const [isDragging, setIsDragging]      = React.useState(false)
  const [saving, setSaving]              = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  /* Modal her açıldığında seçimi mevcut URL'ye sıfırla */
  React.useEffect(() => {
    if (open) {
      setSelGallery(currentUrl ?? null)
      setUploadedUrl(null)
      setTab('gallery')
    }
  }, [open, currentUrl])

  /* Seçili URL hangi tab'daysa ondan al */
  const activeUrl = tab === 'gallery' ? selectedGallery : uploadedUrl
  const canSave   = !!activeUrl

  /* Kaydet — simüle (state anlık güncellenir) */
  async function handleSave() {
    if (!activeUrl) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600)) // simüle gecikme
    onSave(activeUrl)
    setSaving(false)
    onOpenChange(false)
  }

  /* Dosya işle */
  function processFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setUploadedUrl(url)
    setTab('upload')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const title = target === 'banner' ? 'Kapak Fotoğrafı' : 'Profil Fotoğrafı'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2000] bg-black/55 backdrop-blur-sm
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="fixed inset-0 z-[2001] flex items-center justify-center p-4"
          onInteractOutside={() => onOpenChange(false)}
          aria-describedby={undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.28, ease: easing }}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-stone-100">
              <div>
                <Dialog.Title className="text-base font-bold text-stone-800">
                  {title} Düzenle
                </Dialog.Title>
                <p className="text-xs text-stone-400 mt-0.5">
                  Galeriden seç ya da kendi görselini yükle
                </p>
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-full
                  bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
                  aria-label="Kapat">
                  <X size={15} />
                </button>
              </Dialog.Close>
            </div>

            {/* ── Tabs ── */}
            <Tabs.Root value={tab} onValueChange={(v) => setTab(v as 'gallery' | 'upload')}>
              <Tabs.List className="flex items-center gap-1 px-7 pt-5 pb-1">
                {(['gallery', 'upload'] as const).map((t) => (
                  <Tabs.Trigger
                    key={t}
                    value={t}
                    className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl
                      transition-colors duration-150 cursor-pointer outline-none
                      ${tab === t
                        ? 'text-sage-dark bg-sage/10'
                        : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                      }`}
                  >
                    {t === 'gallery'
                      ? <><ImageIcon size={14} /> Galeriden Seç</>
                      : <><Upload size={14} /> Bilgisayardan Yükle</>
                    }
                    {tab === t && (
                      <motion.span
                        layoutId="tab-indicator"
                        className="absolute inset-0 rounded-xl bg-sage/10 -z-10"
                        transition={{ duration: 0.2, ease: easing }}
                      />
                    )}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              {/* ══ Sekme 1: Galeri ══ */}
              <Tabs.Content value="gallery" className="px-7 py-5 outline-none">
                <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1 panel-scroll">
                  {GALLERY_IMAGES.map(({ url, label }) => {
                    const isSelected = selectedGallery === url
                    return (
                      <motion.button
                        key={url}
                        type="button"
                        onClick={() => setSelGallery(url)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className={`relative rounded-xl overflow-hidden aspect-video cursor-pointer outline-none
                          ring-offset-2 transition-all duration-200
                          ${isSelected ? 'ring-2 ring-sage shadow-md' : 'ring-0 hover:ring-1 hover:ring-sage/40'}`}
                      >
                        <img
                          src={url}
                          alt={label}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />

                        {/* Karanlık overlay + isim */}
                        <div className={`absolute inset-0 flex items-end p-2 transition-opacity duration-200
                          ${isSelected ? 'bg-black/20' : 'bg-black/0 hover:bg-black/25'}`}>
                          <span className="text-[10px] font-semibold text-white/90 drop-shadow">{label}</span>
                        </div>

                        {/* Seçili rozet */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="absolute top-1.5 right-1.5 w-5 h-5 bg-sage rounded-full
                                flex items-center justify-center shadow-md"
                            >
                              <Check size={11} strokeWidth={3} className="text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    )
                  })}
                </div>
              </Tabs.Content>

              {/* ══ Sekme 2: Yükleme ══ */}
              <Tabs.Content value="upload" className="px-7 py-5 outline-none">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Önizleme varsa göster, yoksa dropzone */}
                {uploadedUrl ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-2xl overflow-hidden h-52 bg-stone-100 group"
                  >
                    <img src={uploadedUrl} alt="Önizleme" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity
                          flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm
                          text-stone-800 text-sm font-medium rounded-xl shadow cursor-pointer"
                      >
                        <Upload size={14} />
                        Değiştir
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative h-52 rounded-2xl border-2 border-dashed transition-all duration-200
                      flex flex-col items-center justify-center gap-3 cursor-pointer
                      ${isDragging
                        ? 'border-sage bg-sage/5 scale-[1.01]'
                        : 'border-stone-200 bg-stone-50/50 hover:border-sage/50 hover:bg-sage/3'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                      ${isDragging ? 'bg-sage/15' : 'bg-stone-100'}`}>
                      <CloudUpload size={22} className={isDragging ? 'text-sage-dark' : 'text-stone-400'} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-stone-700">
                        {isDragging ? 'Bırak!' : 'Görseli buraya sürükle'}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">ya da tıklayarak seç</p>
                    </div>
                    <p className="text-[11px] text-stone-300">PNG, JPG, WEBP · Maks. 10MB</p>
                  </motion.div>
                )}
              </Tabs.Content>
            </Tabs.Root>

            {/* ── Footer — Önizleme + Kaydet ── */}
            <div className="flex items-center justify-between px-7 py-5 border-t border-stone-100">
              {/* Küçük önizleme */}
              <div className="flex items-center gap-3">
                <div className={`overflow-hidden border-2 border-stone-100 bg-stone-100 shrink-0
                  ${target === 'avatar' ? 'w-10 h-10 rounded-xl' : 'w-16 h-10 rounded-lg'}`}>
                  {activeUrl
                    ? <img src={activeUrl} alt="Önizleme" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={14} className="text-stone-300" />
                      </div>
                  }
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-700">Önizleme</p>
                  <p className="text-[11px] text-stone-400">
                    {activeUrl ? 'Seçildi — kaydetmeye hazır' : 'Henüz görsel seçilmedi'}
                  </p>
                </div>
              </div>

              {/* Aksiyon butonları */}
              <div className="flex items-center gap-2">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700
                    hover:bg-stone-100 rounded-xl transition-colors cursor-pointer">
                    Vazgeç
                  </button>
                </Dialog.Close>
                <motion.button
                  type="button"
                  disabled={!canSave || saving}
                  onClick={handleSave}
                  whileHover={canSave && !saving ? { y: -1, boxShadow: '0 8px 20px -4px rgba(135,159,132,0.4)' } : {}}
                  whileTap={canSave && !saving ? { scale: 0.97 } : {}}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2 px-5 py-2 bg-sage hover:bg-sage-dark
                    text-white text-sm font-semibold rounded-xl transition-colors duration-200
                    disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Kaydediliyor…
                    </>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={2.5} />
                      Kaydet
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
