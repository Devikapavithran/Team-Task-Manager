import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Brain, Star, CheckCircle2, Clock, BarChart3, Target, Zap, ArrowRight } from 'lucide-react'
import { tasksAPI } from '../api'
import { format, parseISO } from 'date-fns'
import useAuthStore from '../store/authStore'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

const TYPE_CONFIG = {
  annotation: { color: '#3b82f6', label: 'Annotation', icon: '📝' },
  evaluation: { color: '#5633ec', label: 'Evaluation', icon: '⭐' },
  validation: { color: '#10b981', label: 'Validation', icon: '✅' },
  labeling: { color: '#f59e0b', label: 'Labeling', icon: '🏷️' },
}

export default function WorkflowPage() {
  const { user, isReviewer } = useAuthStore()
  const [activeType, setActiveType] = useState(null)

  const { data: allTasksData, isLoading } = useQuery({
    queryKey: ['ai-tasks'],
    queryFn: () => tasksAPI.getAll({ type: activeType || '' }),
    refetchInterval: 30_000,
  })

  const tasks = (allTasksData?.tasks || []).filter(t => t.task_type !== 'general')
  const byType = Object.fromEntries(Object.keys(TYPE_CONFIG).map(k => [k, tasks.filter(t => t.task_type === k)]))
  const pending = tasks.filter(t => ['todo','in_progress'].includes(t.status))
  const inReview = tasks.filter(t => t.status === 'in_review')
  const approved = tasks.filter(t => ['approved','done'].includes(t.status))

  // Mock radar data for UX demo when no evaluations
  const radarData = [
    { metric: 'Accuracy', value: 8.2 },
    { metric: 'Relevance', value: 7.8 },
    { metric: 'Coherence', value: 8.5 },
    { metric: 'Guidelines', value: 9.0 },
    { metric: 'Throughput', value: 7.5 },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-brand-500" /> AI Workflows
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Annotation, evaluation, labeling & validation pipeline
          </p>
        </div>
        <Link to="/tasks?type=annotation" className="btn-primary">
          <Zap className="w-4 h-4" /> View All AI Tasks
        </Link>
      </div>

      {/* Pipeline overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'In Queue', value: pending.length, icon: Clock, color: '#f59e0b', sub: 'pending' },
          { label: 'In Review', value: inReview.length, icon: Star, color: '#3b82f6', sub: 'awaiting QA' },
          { label: 'Approved', value: approved.length, icon: CheckCircle2, color: '#10b981', sub: 'completed' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.color + '20' }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="font-display font-bold text-2xl text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Task type breakdown */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
          const count = byType[key]?.length || 0
          const done = byType[key]?.filter(t => ['approved','done'].includes(t.status)).length || 0
          const pct = count > 0 ? Math.round((done/count)*100) : 0
          return (
            <button key={key} onClick={() => setActiveType(activeType === key ? null : key)}
              className={`card p-4 text-left transition-all hover:shadow-md ${activeType === key ? 'ring-2 ring-brand-500' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{cfg.icon}</span>
                <span className="font-semibold text-sm text-gray-900">{cfg.label}</span>
              </div>
              <div className="text-2xl font-display font-bold mb-1" style={{ color: cfg.color }}>{count}</div>
              <div className="text-xs text-gray-400 mb-2">{done} completed</div>
              <div className="w-full bg-surface-2 rounded-full h-1.5">
                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent AI tasks */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900">
              {activeType ? `${TYPE_CONFIG[activeType].label} Tasks` : 'All AI Tasks'}
            </h2>
            {activeType && (
              <button onClick={() => setActiveType(null)} className="text-xs text-brand-500 hover:text-brand-700">
                Clear filter
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Brain className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm mb-2">No AI workflow tasks yet</p>
              <p className="text-xs text-gray-300">Create tasks with types like Annotation, Evaluation, Validation, or Labeling</p>
              <Link to="/tasks" className="btn-primary mt-4 mx-auto inline-flex">
                <Zap className="w-3.5 h-3.5" /> Create AI Task
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(activeType ? byType[activeType] : tasks).slice(0, 10).map(t => {
                const cfg = TYPE_CONFIG[t.task_type] || TYPE_CONFIG.annotation
                return (
                  <Link key={t.id} to={`/tasks/${t.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-1 transition-colors group">
                    <span className="text-sm">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-600">{t.title}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>{t.project_name}</span>
                        {t.assignee_name && <span>· {t.assignee_name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`tag-${t.status}`}>{t.status.replace(/_/g,' ')}</span>
                      <span className={`priority-${t.priority}`}>{t.priority}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-500" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quality radar */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-500" /> Quality Metrics
          </h2>
          <p className="text-xs text-gray-400 mb-4">Team performance across dimensions</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e8e6f5" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Radar dataKey="value" stroke="#5633ec" fill="#5633ec" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e8e6f5', fontSize: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {radarData.map(d => (
              <div key={d.metric} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-20">{d.metric}</span>
                <div className="flex-1 bg-surface-2 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(d.value/10)*100}%` }} />
                </div>
                <span className="font-mono text-brand-600 w-6 text-right">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guidance panel */}
      <div className="card p-5 bg-gradient-to-r from-brand-50 to-surface-1 border-brand-200">
        <h2 className="font-display font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5 text-brand-600" /> LLM Post-Training Workflow Guide
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
          {[
            { icon: '📝', title: 'Data Annotation', desc: 'Label and categorize training data with structured schemas and quality benchmarks.' },
            { icon: '⭐', title: 'Prompt Evaluation', desc: 'Score LLM responses on accuracy, relevance, and coherence (0–10 scale).' },
            { icon: '✅', title: 'Data Validation', desc: 'Quality checks — consistency, guideline adherence, SLA compliance.' },
            { icon: '🏷️', title: 'Labeling & QA', desc: 'Structured/unstructured data labeling with reviewer feedback loops.' },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-xl p-3 border border-surface-3">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-semibold text-sm text-gray-900 mb-1">{item.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
