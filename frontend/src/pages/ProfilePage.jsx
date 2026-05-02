import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authAPI } from '../api'
import useAuthStore from '../store/authStore'
import { User, Palette, Shield } from 'lucide-react'

const COLORS = ['#5633ec','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#14b8a6','#f97316']

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({ name: user?.name || '', avatar_color: user?.avatar_color || COLORS[0] })
  const [saved, setSaved] = useState(false)

  const update = useMutation({
    mutationFn: authAPI.updateMe,
    onSuccess: ({ user: u }) => { updateUser(u); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  })

  const ROLE_PERMS = {
    admin: ['Create & delete projects', 'Manage team roles', 'View all tasks', 'Full access'],
    reviewer: ['Evaluate AI task quality', 'Submit scoring & feedback', 'View all tasks', 'QA workflows'],
    member: ['Create & manage own tasks', 'Join projects', 'Comment on tasks', 'View team'],
  }

  return (
    <div className="space-y-5 max-w-xl">
      <h1 className="font-display text-2xl font-bold text-gray-900">Profile</h1>

      {/* Avatar preview */}
      <div className="card p-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-display font-bold shadow-lg"
          style={{ background: form.avatar_color }}>
          {form.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <div className="font-display font-bold text-lg text-gray-900">{form.name || 'Your Name'}</div>
          <div className="text-sm text-gray-500">{user?.email}</div>
          <div className="text-xs text-brand-600 font-semibold capitalize mt-0.5">{user?.role}</div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-5 space-y-4">
        <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-500" /> Edit Profile
        </h2>
        <div>
          <label className="label">Display Name</label>
          <input className="input" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="label flex items-center gap-1.5"><Palette className="w-3 h-3" /> Avatar Color</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, avatar_color: c }))}
                className="w-8 h-8 rounded-xl transition-all hover:scale-110"
                style={{ background: c, outline: form.avatar_color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
        </div>
        <button onClick={() => update.mutate(form)}
          disabled={update.isPending}
          className={`btn-primary w-full justify-center transition-all ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
          {update.isPending ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Role & permissions */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-brand-500" /> Role & Permissions
        </h2>
        <div className="text-sm font-semibold text-gray-700 capitalize mb-3">{user?.role}</div>
        <ul className="space-y-2">
          {(ROLE_PERMS[user?.role] || ROLE_PERMS.member).map(p => (
            <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
              </div>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
