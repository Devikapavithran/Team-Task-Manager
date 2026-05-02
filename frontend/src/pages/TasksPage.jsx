import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Filter, Search } from 'lucide-react'
import { tasksAPI, projectsAPI, usersAPI } from '../api'
import Modal from '../components/Modal'
import { format, parseISO } from 'date-fns'
import useAuthStore from '../store/authStore'

export default function TasksPage() {
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [filters, setFilters] = useState({
    status: '', priority: '', search: '', type: '',
    overdue: searchParams.get('overdue') || ''
  })
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', project_id: '', priority: 'medium', task_type: 'general', due_date: '', assignee_id: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksAPI.getAll(filters),
  })

  const { data: projectsData } = useQuery({ queryKey: ['projects'], queryFn: projectsAPI.getAll })
  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: () => usersAPI.search('') })

  const create = useMutation({
    mutationFn: tasksAPI.create,
    onSuccess: () => { qc.invalidateQueries(['tasks']); setModal(false); setForm({ title:'', description:'', project_id:'', priority:'medium', task_type:'general', due_date:'', assignee_id:'' }) }
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => tasksAPI.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(['tasks'])
  })

  const tasks = data?.tasks || []

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tasks.length} tasks</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Task</button>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="input pl-8 py-2 text-sm" placeholder="Search tasks…"
            value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        </div>
        {[
          { key: 'status', opts: ['','todo','in_progress','in_review','approved','rejected','done'], label: 'Status' },
          { key: 'priority', opts: ['','low','medium','high','critical'], label: 'Priority' },
          { key: 'type', opts: ['','general','annotation','evaluation','validation','labeling'], label: 'Type' },
        ].map(({ key, opts, label }) => (
          <select key={key} className="input w-auto text-sm py-2"
            value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}>
            <option value="">{label}</option>
            {opts.slice(1).map(o => <option key={o} value={o} className="capitalize">{o.replace(/_/g,' ')}</option>)}
          </select>
        ))}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" className="rounded" checked={filters.overdue === 'true'}
            onChange={e => setFilters(f => ({ ...f, overdue: e.target.checked ? 'true' : '' }))} />
          Overdue only
        </label>
      </div>

      {/* Task list */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm mb-3">No tasks found</p>
            <button onClick={() => setModal(true)} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" /> Create Task
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-1 border-b border-surface-2">
              <tr>
                {['Task', 'Project', 'Assignee', 'Status', 'Priority', 'Due'].map(h => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide ${h === 'Project' || h === 'Assignee' ? 'hidden md:table-cell' : ''} ${h === 'Priority' || h === 'Due' ? 'hidden lg:table-cell' : ''}`}>
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-2">
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-surface-1 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <Link to={`/tasks/${t.id}`} className="font-medium text-gray-900 hover:text-brand-600 line-clamp-1">{t.title}</Link>
                    <div className="text-xs text-gray-400 capitalize mt-0.5">{t.task_type !== 'general' ? t.task_type : ''}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {t.project_name ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.project_color || '#5633ec' }} />
                        <span className="text-xs text-gray-600 truncate max-w-[120px]">{t.project_name}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {t.assignee_name ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ background: t.assignee_color || '#5633ec' }}>{t.assignee_name[0]}</div>
                        <span className="text-xs text-gray-600">{t.assignee_name}</span>
                      </div>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select className="text-xs border-0 bg-transparent focus:outline-none cursor-pointer"
                      value={t.status} onChange={e => updateStatus.mutate({ id: t.id, status: e.target.value })}>
                      {['todo','in_progress','in_review','approved','rejected','done'].map(s => (
                        <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`priority-${t.priority}`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                    {t.due_date ? format(parseISO(t.due_date), 'MMM d') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/tasks/${t.id}`} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Task">
        <form onSubmit={e => { e.preventDefault(); create.mutate(form) }} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Project *</label>
            <select className="input" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} required>
              <option value="">Select project…</option>
              {projectsData?.projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {['low','medium','high','critical'].map(v => <option key={v} value={v} className="capitalize">{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))}>
                {['general','annotation','evaluation','validation','labeling'].map(v => <option key={v} value={v} className="capitalize">{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assignee</label>
              <select className="input" value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {usersData?.users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
