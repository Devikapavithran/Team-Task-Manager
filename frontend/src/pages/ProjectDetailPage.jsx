import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Users, Calendar, MoreVertical, GripVertical } from 'lucide-react'
import { projectsAPI, tasksAPI, usersAPI } from '../api'
import Modal from '../components/Modal'
import { format, parseISO } from 'date-fns'
import useAuthStore from '../store/authStore'

const STATUSES = [
  { key: 'todo', label: 'To Do', color: '#94a3b8' },
  { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { key: 'in_review', label: 'In Review', color: '#f59e0b' },
  { key: 'approved', label: 'Approved', color: '#10b981' },
  { key: 'done', label: 'Done', color: '#8b5cf6' },
]

export default function ProjectDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [taskModal, setTaskModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', task_type: 'general', assignee_id: '' })
  const [view, setView] = useState('kanban')

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.get(id),
  })

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.search(''),
  })

  const createTask = useMutation({
    mutationFn: d => tasksAPI.create({ ...d, project_id: id }),
    onSuccess: () => { qc.invalidateQueries(['project', id]); setTaskModal(false); setForm({ title:'', description:'', priority:'medium', due_date:'', task_type:'general', assignee_id:'' }) }
  })

  const updateTask = useMutation({
    mutationFn: ({ tid, ...d }) => tasksAPI.update(tid, d),
    onSuccess: () => qc.invalidateQueries(['project', id])
  })

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const { project, tasks = [], members = [] } = data || {}
  if (!project) return <div className="text-center py-16 text-gray-400">Project not found</div>

  const pct = project.task_count > 0 ? Math.round((project.completed_count / project.task_count) * 100) : 0

  return (
    <div className="space-y-5 max-w-full">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/projects" className="p-2 rounded-xl hover:bg-surface-2 text-gray-400 hover:text-gray-600 mt-0.5 flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: project.color }} />
            <h1 className="font-display text-xl font-bold text-gray-900 truncate">{project.name}</h1>
          </div>
          {project.description && <p className="text-sm text-gray-500 ml-7">{project.description}</p>}
          <div className="flex items-center gap-4 ml-7 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{project.member_count} members</span>
            {project.due_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(parseISO(project.due_date), 'MMM d, yyyy')}</span>}
            <span className="font-mono">{pct}% complete</span>
          </div>
        </div>
        <button onClick={() => setTaskModal(true)} className="btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-2 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: project.color }} />
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        {['kanban', 'list'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${view === v ? 'bg-brand-600 text-white' : 'bg-surface-2 text-gray-600 hover:bg-surface-3'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {STATUSES.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key)
            return (
              <div key={col.key} className="flex-shrink-0 w-72">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                  <span className="ml-auto text-xs font-mono text-gray-400 bg-surface-2 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <div className="space-y-2.5 min-h-[120px]">
                  {colTasks.map(t => (
                    <TaskCard key={t.id} task={t} onStatusChange={s => updateTask.mutate({ tid: t.id, status: s })} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List */}
      {view === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-surface-2 bg-surface-1">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Task</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Assignee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-2">
              {tasks.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No tasks yet</td></tr>
              ) : tasks.map(t => (
                <tr key={t.id} className="hover:bg-surface-1 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/tasks/${t.id}`} className="font-medium text-gray-900 hover:text-brand-600 line-clamp-1">{t.title}</Link>
                    {t.task_type !== 'general' && <span className="text-xs text-brand-500 capitalize">{t.task_type}</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {t.assignee_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: t.assignee_color || '#5633ec' }}>
                          {t.assignee_name[0]}
                        </div>
                        <span className="text-gray-600 text-xs">{t.assignee_name}</span>
                      </div>
                    ) : <span className="text-gray-300 text-xs">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3"><span className={`tag-${t.status}`}>{t.status.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className={`priority-${t.priority}`}>{t.priority}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                    {t.due_date ? format(parseISO(t.due_date), 'MMM d') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create task modal */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="Add Task">
        <form onSubmit={e => { e.preventDefault(); createTask.mutate(form) }} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="Task description"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))}>
                <option value="general">General</option>
                <option value="annotation">Annotation</option>
                <option value="evaluation">Evaluation</option>
                <option value="validation">Validation</option>
                <option value="labeling">Labeling</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assignee</label>
              <select className="input" value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {(usersData?.users || members).map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setTaskModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={createTask.isPending}>
              {createTask.isPending ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function TaskCard({ task: t, onStatusChange }) {
  const [menu, setMenu] = useState(false)
  return (
    <div className="card p-3 hover:shadow-md transition-all duration-150 group relative">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/tasks/${t.id}`} className="text-sm font-medium text-gray-900 hover:text-brand-600 leading-snug line-clamp-2 flex-1">
          {t.title}
        </Link>
        <button onClick={() => setMenu(m => !m)}
          className="p-0.5 rounded hover:bg-surface-2 opacity-0 group-hover:opacity-100 transition-all text-gray-300 flex-shrink-0">
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
        {menu && (
          <div className="absolute right-2 top-8 w-40 card shadow-lg z-10 overflow-hidden text-xs">
            {['todo','in_progress','in_review','approved','done'].map(s => (
              <button key={s} onClick={() => { onStatusChange(s); setMenu(false) }}
                className="w-full text-left px-3 py-2 hover:bg-surface-1 capitalize text-gray-700">
                → {s.replace(/_/g,' ')}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <span className={`priority-${t.priority}`}>{t.priority}</span>
        {t.assignee_name && (
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: t.assignee_color || '#5633ec' }} title={t.assignee_name}>
            {t.assignee_name[0]}
          </div>
        )}
      </div>
      {t.due_date && (
        <div className="text-[10px] text-gray-400 mt-1.5">
          Due {format(parseISO(t.due_date), 'MMM d')}
        </div>
      )}
    </div>
  )
}
