import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Star, Calendar, User, Tag, Trash2 } from 'lucide-react'
import { tasksAPI } from '../api'
import { format, parseISO } from 'date-fns'
import useAuthStore from '../store/authStore'

export default function TaskDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { user, isReviewer } = useAuthStore()
  const [comment, setComment] = useState('')
  const [evalForm, setEvalForm] = useState({ accuracy_score: 8, relevance_score: 8, coherence_score: 8, overall_score: 8, feedback: '', guidelines_followed: true })
  const [showEval, setShowEval] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksAPI.get(id),
  })

  const updateTask = useMutation({
    mutationFn: d => tasksAPI.update(id, d),
    onSuccess: () => qc.invalidateQueries(['task', id])
  })

  const deleteTask = useMutation({
    mutationFn: () => tasksAPI.delete(id),
    onSuccess: () => navigate('/tasks')
  })

  const addComment = useMutation({
    mutationFn: d => tasksAPI.addComment(id, d),
    onSuccess: () => { qc.invalidateQueries(['task', id]); setComment('') }
  })

  const submitEval = useMutation({
    mutationFn: d => tasksAPI.evaluate(id, d),
    onSuccess: () => { qc.invalidateQueries(['task', id]); setShowEval(false) }
  })

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const { task, comments = [], evaluations = [] } = data || {}
  if (!task) return <div className="text-center py-16 text-gray-400">Task not found</div>

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-2 text-gray-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link to="/projects" className="hover:text-brand-600">Projects</Link>
            {task.project_name && <>
              <span>/</span>
              <Link to={`/projects/${task.project_id}`} className="hover:text-brand-600">{task.project_name}</Link>
            </>}
          </div>
          <h1 className="font-display font-bold text-xl text-gray-900">{task.title}</h1>
        </div>
        <button onClick={() => { if (confirm('Delete this task?')) deleteTask.mutate() }}
          className="btn-danger text-xs">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {task.description && (
            <div className="card p-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Evaluation form */}
          {isReviewer() && task.task_type !== 'general' && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" /> Quality Evaluation
                </h2>
                <button onClick={() => setShowEval(s => !s)} className="btn-secondary text-xs">
                  {showEval ? 'Cancel' : evaluations.length > 0 ? 'Re-evaluate' : 'Evaluate'}
                </button>
              </div>

              {evaluations.length > 0 && !showEval && (
                <div className="space-y-2">
                  {evaluations.slice(0, 1).map(e => (
                    <div key={e.id} className="bg-surface-1 rounded-xl p-3">
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {[
                          { l: 'Accuracy', v: e.accuracy_score, c: '#10b981' },
                          { l: 'Relevance', v: e.relevance_score, c: '#3b82f6' },
                          { l: 'Coherence', v: e.coherence_score, c: '#f59e0b' },
                          { l: 'Overall', v: e.overall_score, c: '#5633ec' },
                        ].map(m => (
                          <div key={m.l} className="text-center">
                            <div className="font-display font-bold text-lg" style={{ color: m.c }}>{m.v}</div>
                            <div className="text-[10px] text-gray-400">{m.l}</div>
                          </div>
                        ))}
                      </div>
                      {e.feedback && <p className="text-xs text-gray-600 mt-2">{e.feedback}</p>}
                      <div className="text-[10px] text-gray-400 mt-1">By {e.evaluator_name} · {format(parseISO(e.created_at), 'MMM d, yyyy')}</div>
                    </div>
                  ))}
                </div>
              )}

              {showEval && (
                <form onSubmit={e => { e.preventDefault(); submitEval.mutate(evalForm) }} className="space-y-3">
                  {[
                    { key: 'accuracy_score', label: 'Accuracy (0-10)' },
                    { key: 'relevance_score', label: 'Relevance (0-10)' },
                    { key: 'coherence_score', label: 'Coherence (0-10)' },
                    { key: 'overall_score', label: 'Overall (0-10)' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 w-32 flex-shrink-0">{label}</label>
                      <input type="range" min={0} max={10} step={0.5} className="flex-1"
                        value={evalForm[key]} onChange={e => setEvalForm(f => ({ ...f, [key]: parseFloat(e.target.value) }))} />
                      <span className="text-sm font-mono font-bold text-brand-600 w-8 text-right">{evalForm[key]}</span>
                    </div>
                  ))}
                  <div>
                    <label className="label">Feedback</label>
                    <textarea className="input resize-none" rows={2} placeholder="Optional qualitative feedback…"
                      value={evalForm.feedback} onChange={e => setEvalForm(f => ({ ...f, feedback: e.target.value }))} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={evalForm.guidelines_followed}
                      onChange={e => setEvalForm(f => ({ ...f, guidelines_followed: e.target.checked }))} />
                    Guidelines followed
                  </label>
                  <button type="submit" className="btn-primary w-full justify-center" disabled={submitEval.isPending}>
                    {submitEval.isPending ? 'Submitting…' : 'Submit Evaluation'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="card p-4">
            <h2 className="font-display font-semibold text-gray-900 mb-3">Comments ({comments.length})</h2>
            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No comments yet</p>
              ) : comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ background: c.avatar_color || '#5633ec' }}>
                    {c.user_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-900">{c.user_name}</span>
                      <span className="text-xs text-gray-400">{format(parseISO(c.created_at), 'MMM d, HH:mm')}</span>
                    </div>
                    <p className="text-sm text-gray-700">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: user?.avatar_color || '#5633ec' }}>
                {user?.name?.[0]}
              </div>
              <div className="flex-1 flex gap-2">
                <input className="input text-sm flex-1" placeholder="Add a comment…"
                  value={comment} onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && comment.trim()) { e.preventDefault(); addComment.mutate({ content: comment }) }}} />
                <button onClick={() => comment.trim() && addComment.mutate({ content: comment })}
                  disabled={!comment.trim() || addComment.isPending}
                  className="btn-primary px-3">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={task.status}
                onChange={e => updateTask.mutate({ status: e.target.value })}>
                {['todo','in_progress','in_review','approved','rejected','done'].map(s => (
                  <option key={s} value={s} className="capitalize">{s.replace(/_/g,' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={task.priority}
                onChange={e => updateTask.mutate({ priority: e.target.value })}>
                {['low','medium','high','critical'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <div className="text-sm text-gray-700 capitalize">{task.task_type?.replace(/_/g,' ')}</div>
            </div>
            {task.assignee_name && (
              <div>
                <label className="label">Assignee</label>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: task.assignee_color || '#5633ec' }}>{task.assignee_name[0]}</div>
                  <span className="text-sm text-gray-700">{task.assignee_name}</span>
                </div>
              </div>
            )}
            {task.due_date && (
              <div>
                <label className="label">Due Date</label>
                <div className="text-sm text-gray-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {format(parseISO(task.due_date), 'MMMM d, yyyy')}
                </div>
              </div>
            )}
            {task.project_name && (
              <div>
                <label className="label">Project</label>
                <Link to={`/projects/${task.project_id}`} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: task.project_color }} />
                  {task.project_name}
                </Link>
              </div>
            )}
            <div>
              <label className="label">Created</label>
              <div className="text-sm text-gray-500">{format(parseISO(task.created_at), 'MMM d, yyyy')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
