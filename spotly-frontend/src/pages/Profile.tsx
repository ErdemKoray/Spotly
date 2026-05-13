import { Clock, MapPin, User } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  const avatarUrl = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.first_name}+${user.last_name}`)}&background=879F84&color=fff&size=128`
    : `https://ui-avatars.com/api/?name=User&background=879F84&color=fff&size=128`

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* ── Profil Kartı ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-sage to-sage-dark" />
          <div className="px-8 pb-8">
            <div className="flex items-end gap-5 -mt-10 mb-6">
              <img
                src={avatarUrl}
                alt="Profil fotoğrafı"
                className="w-20 h-20 rounded-2xl border-4 border-white shadow-md object-cover"
              />
              <div className="pb-1">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  {user ? `${user.first_name} ${user.last_name}` : 'Kullanıcı'}
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-2 text-xs text-stone-500 bg-sage/5 rounded-lg px-3 py-2">
                <User size={13} className="text-sage" />
                Üye
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2 text-xs text-stone-500 bg-sage/5 rounded-lg px-3 py-2">
                  <MapPin size={13} className="text-sage" />
                  {user.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Geçmiş Rotalar ── */}
        <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-sage/10 flex items-center justify-center">
              <Clock size={15} className="text-sage-dark" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Geçmiş Rotalarım</h2>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <MapPin size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">Henüz kayıtlı rotanız yok.</p>
            <p className="text-xs text-gray-300 mt-1">Keşfet sayfasından ilk rotanı oluştur!</p>
          </div>
        </div>

      </div>
    </MainLayout>
  )
}
