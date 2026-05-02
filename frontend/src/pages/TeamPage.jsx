import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckSquare, FolderKanban, Shield } from 'lucide-react'
import { teamAPI } from '../api'
import useAuthStore from '../store/authStore'

const ROLE_COLORS = { admin: 'bg-red-100 text-red-600', reviewer: 'bg-amber-100 text-amber-700', member: 'bg-blue-100 text-blue-600' }

export default function TeamPage() {
  const qc = useQueryClient()
  const { isAdmin, user } = useAuthStore()

  const { data, isLoading } = useQuery({ queryKey: ['team'], queryFn: teamAPI.getAll })
  const updateRole = useMutation({
    mutationFn: ({ id, role }) => teamAPI.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries(['team'])
  })

  const members = data?.members || []

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-0.5">{members.length} members in your workspace</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {members.map(m => (
            <div key={m.id} className="card p-4 flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-display font-bold text-lg flex-shrink-0"
                style={{ background: m.avatar_color || '#5633ec' }}>
                {m.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-gray-900 truncate">{m.name}</span>
                  {m.id === user?.id && <span className="text-xs text-brand-500 font-medium">you</span>}
                </div>
                <div className="text-xs text-gray-400 truncate mb-2">{m.email}</div>

                {isAdmin() && m.id !== user?.id ? (
                  <select
                    className="text-xs border border-surface-3 bg-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
                    value={m.role}
                    onChange={e => updateRole.mutate({ id: m.id, role: e.target.value })}>
                    <option value="member">Member</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`badge ${ROLE_COLORS[m.role] || ROLE_COLORS.member} capitalize`}>{m.role}</span>
                )}

                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" />
                    {parseInt(m.active_tasks) || 0} active
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    {parseInt(m.completed_tasks) || 0} done
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5" />
                    {parseInt(m.project_count) || 0} projects
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
