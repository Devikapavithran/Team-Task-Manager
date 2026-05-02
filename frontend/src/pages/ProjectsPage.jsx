import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, FolderKanban, Users, CheckSquare, Calendar, MoreVertical, Trash2, Edit } from 'lucide-react'
import { projectsAPI, usersAPI } from '../api'
import Modal from '../components/Modal'
import { format, parseISO } from 'date-fns'
import useAuthStore from '../store/authStore'

const COLORS = ['#5633ec','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4']
const STATUS_MAP = {
  active: { label: 'Active', cls: 'tag-in_progress' },
  on_hold: { label: 'On Hold', cls: 'tag-in_review' },
  completed: { label: 'Completed', cls: 'tag-done' },
  archived: { label: 'Archived', cls: 'tag-todo' },
}

export default function ProjectsPage() {
  const qc = useQueryClient()
  const { isAdmin } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0], due_date: '' })
  const [openMenu, setOpenMenu] = useState(null)

  const { data, isLoading } = useQuery({ queryKey: ['projects'], queryFn: projectsAPI.getAll })

  const create = useMutation({
    mutationFn: projectsAPI.create,
    onSuccess: () => { qc.invalidateQueries(['projects']); setModalOpen(false); setForm({ name:'', description:'', color: COLORS[0], due_date:'' }) }
  })

  const del = useMutation({
    mutationFn: projectsAPI.delete,
    onSuccess: () => qc.invalidateQueries(['projects'])
  })

  const projects = data?.projects || []
  const active = projects.filter(p => p.status === 'active')
  const rest = projects.filter(p => p.status !== 'active')

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} total projects</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderKanban className="w-12 h-12 text-brand-200 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-gray-700 mb-2">No projects yet</h3>
          <p className="text-sm text-gray-400 mb-4">Create your first project to get started</p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Active</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map(p => <ProjectCard key={p.id} p={p} onDelete={() => del.mutate(p.id)} />)}
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Other</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map(p => <ProjectCard key={p.id} p={p} onDelete={() => del.mutate(p.id)} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Project">
        <form onSubmit={e => { e.preventDefault(); create.mutate(form) }} className="space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input className="input" placeholder="e.g. Q2 Annotation Batch"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="What is this project about?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="date" value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{ background: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function ProjectCard({ p, onDelete }) {
  const pct = p.task_count > 0 ? Math.round((p.completed_count / p.task_count) * 100) : 0
  const [menu, setMenu] = useState(false)
  const st = STATUS_MAP[p.status] || STATUS_MAP.active

  return (
    <div className="card-hover p-5 flex flex-col gap-4 relative group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: p.color + '20' }}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-4 h-4 rounded-full" style={{ background: p.color }} />
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-gray-900 truncate">{p.name}</div>
            <span className={st.cls}>{st.label}</span>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenu(m => !m)}
            className="p-1.5 rounded-lg hover:bg-surface-2 opacity-0 group-hover:opacity-100 transition-all text-gray-400">
            <MoreVertical className="w-4 h-4" />
          </button>
          {menu && (
            <div className="absolute right-0 top-full mt-1 w-36 card shadow-lg z-10 overflow-hidden">
              <Link to={`/projects/${p.id}`} onClick={() => setMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-1 text-gray-700">
                <Edit className="w-3.5 h-3.5" /> Edit
              </Link>
              <button onClick={() => { onDelete(); setMenu(false) }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-500 w-full">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {p.description && <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>}

      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Progress</span><span className="font-mono">{pct}%</span>
        </div>
        <div className="w-full bg-surface-2 rounded-full h-1.5">
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: p.color }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-surface-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5" />{p.task_count || 0}</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{p.member_count || 0}</span>
        </div>
        {p.due_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(parseISO(p.due_date), 'MMM d, yyyy')}
          </span>
        )}
      </div>

      <Link to={`/projects/${p.id}`} className="btn-secondary text-center text-xs w-full justify-center">
        Open Project
      </Link>
    </div>
  )
}
