import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Brain, ArrowRight, Activity } from 'lucide-react'
import { dashboardAPI } from '../api'
import { format, parseISO } from 'date-fns'
import useAuthStore from '../store/authStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const STATUS_COLORS = {
  todo: '#94a3b8', in_progress: '#3b82f6', in_review: '#f59e0b',
  approved: '#10b981', rejected: '#ef4444', done: '#8b5cf6'
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent + '20' }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-display font-bold text-gray-900">{value}</div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardAPI.get, refetchInterval: 60_000 })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const d = data || {}
  const taskStats = d.taskStats || []
  const total = taskStats.reduce((s, t) => s + parseInt(t.count), 0)
  const done = taskStats.filter(t => ['done','approved'].includes(t.status)).reduce((s, t) => s + parseInt(t.count), 0)
  const overdue = d.overdueTasks || []
  const ws = d.workflowStats || {}
  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'

  const pieData = taskStats.map(s => ({
    name: s.status.replace(/_/g,' '), value: parseInt(s.count),
    color: STATUS_COLORS[s.status] || '#94a3b8'
  }))

  const trendData = (d.completionTrend || []).map(t => ({
    date: format(parseISO(t.date), 'MMM d'), completed: parseInt(t.count)
  }))

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here's everything happening in your workspace</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="Total Tasks" value={total} sub={`${done} completed`} accent="#5633ec" />
        <StatCard icon={TrendingUp} label="Completion Rate"
          value={total > 0 ? `${Math.round((done/total)*100)}%` : '—'} sub="overall" accent="#10b981" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue.length} sub="need attention" accent="#ef4444" />
        <StatCard icon={Brain} label="AI Tasks" value={ws.ai_tasks_total || 0}
          sub={`${ws.pending_review || 0} in review`} accent="#f59e0b" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-500" /> 7-Day Completion Trend
          </h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trendData} barSize={20}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e8e6f5', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontFamily: 'DM Sans' }} />
                <Bar dataKey="completed" fill="#5633ec" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400 text-sm">Complete tasks to see your trend</div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold text-gray-900 mb-4">Task Breakdown</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: '12px', border: '1px solid #e8e6f5' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" /> Overdue Tasks
            </h2>
            <Link to="/tasks?overdue=true" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {overdue.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">🎉 No overdue tasks!</div>
          ) : (
            <div className="space-y-2">
              {overdue.slice(0, 5).map(t => (
                <Link key={t.id} to={`/tasks/${t.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-1 transition-colors group">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-600">{t.title}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{t.project_name}</span>
                      <span className="text-red-500">· Due {format(parseISO(t.due_date), 'MMM d')}</span>
                    </div>
                  </div>
                  <span className={`priority-${t.priority}`}>{t.priority}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900">Active Projects</h2>
            <Link to="/projects" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!(d.projectStats?.length) ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">No projects yet</p>
              <Link to="/projects" className="btn-primary text-xs">Create Project</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {d.projectStats.map(p => {
                const pct = p.task_count > 0 ? Math.round((p.completed_count / p.task_count) * 100) : 0
                return (
                  <Link key={p.id} to={`/projects/${p.id}`} className="block p-2.5 rounded-xl hover:bg-surface-1 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="text-sm font-medium text-gray-900 truncate">{p.name}</span>
                        {parseInt(p.overdue_count) > 0 && (
                          <span className="badge bg-red-50 text-red-500">{p.overdue_count} overdue</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-mono flex-shrink-0">{pct}%</span>
                    </div>
                    <div className="w-full bg-surface-2 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: p.color }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{p.task_count} tasks</div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {parseFloat(ws.ai_tasks_total) > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-brand-500" /> AI Workflow Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Accuracy', value: ws.avg_accuracy, color: '#10b981' },
              { label: 'Relevance', value: ws.avg_relevance, color: '#3b82f6' },
              { label: 'Coherence', value: ws.avg_coherence, color: '#f59e0b' },
              { label: 'Overall', value: ws.avg_overall, color: '#5633ec' },
            ].map(m => (
              <div key={m.label} className="text-center p-3 rounded-xl bg-surface-1">
                <div className="text-2xl font-display font-bold" style={{ color: m.color }}>
                  {m.value ? parseFloat(m.value).toFixed(1) : '—'}
                </div>
                <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                {m.value && (
                  <div className="mt-2 w-full bg-surface-3 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${(m.value / 10) * 100}%`, background: m.color }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
