import { useAuth } from '../../contexts/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-10 py-8 text-center max-w-sm w-full">
        <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-semibold mx-auto mb-4">
          {user?.first_name[0]}{user?.last_name[0]}
        </div>
        <h2 className="text-lg font-semibold text-gray-800">
          Merhaba, {user?.first_name}!
        </h2>
        <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
        <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500 space-y-1">
          {user?.age && <p>Yaş: {user.age}</p>}
          {user?.phone && <p>Telefon: {user.phone}</p>}
        </div>
      </div>
      <button
        onClick={logout}
        className="text-sm text-gray-400 hover:text-gray-600 transition"
      >
        Çıkış yap
      </button>
    </div>
  )
}
