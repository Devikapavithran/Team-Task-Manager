const router = require('express').Router()
const { pool } = require('../db')
const { auth, requireAdmin } = require('../middleware/auth')

// --- TEAM ---
router.get('/team', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.avatar_color, u.created_at,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status NOT IN ('done','approved')) as active_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('done','approved')) as completed_tasks,
        COUNT(DISTINCT pm.project_id) as project_count
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      LEFT JOIN project_members pm ON pm.user_id = u.id
      GROUP BY u.id ORDER BY u.name
    `)
    res.json({ members: rows })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

router.put('/team/:id/role', auth, requireAdmin, async (req, res) => {
  const { role } = req.body
  if (!['admin','member','reviewer'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
  try {
    const { rows } = await pool.query('UPDATE users SET role=$1 WHERE id=$2 RETURNING id,name,email,role', [role, req.params.id])
    res.json({ user: rows[0] })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// --- NOTIFICATIONS ---
router.get('/notifications', auth, async (req, res) => {
  const { unread_only, limit } = req.query
  let query = `SELECT * FROM notifications WHERE user_id=$1`
  if (unread_only === 'true') query += ` AND is_read=false`
  query += ` ORDER BY created_at DESC LIMIT $2`
  try {
    const { rows } = await pool.query(query, [req.user.id, parseInt(limit) || 20])
    const { rows: cnt } = await pool.query(`SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false`, [req.user.id])
    res.json({ notifications: rows, unread_count: parseInt(cnt[0].count) })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read=true WHERE user_id=$1`, [req.user.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// --- DASHBOARD ---
router.get('/dashboard', auth, async (req, res) => {
  try {
    const uid = req.user.id

    const { rows: taskStats } = await pool.query(`
      SELECT t.status, COUNT(*) as count FROM tasks t
      LEFT JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.assignee_id=$1 OR t.created_by=$1 OR pm.user_id=$1
      GROUP BY t.status
    `, [uid])

    const { rows: overdueTasks } = await pool.query(`
      SELECT DISTINCT t.id, t.title, t.priority, t.due_date, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON pm.project_id = t.project_id
      WHERE (t.assignee_id=$1 OR t.created_by=$1 OR pm.user_id=$1)
        AND t.due_date < NOW() AND t.status NOT IN ('done','approved')
      ORDER BY t.due_date ASC LIMIT 10
    `, [uid])

    const { rows: projectStats } = await pool.query(`
      SELECT DISTINCT p.id, p.name, p.color, p.status,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('done','approved')) as completed_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.due_date < NOW() AND t.status NOT IN ('done','approved')) as overdue_count
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE (pm.user_id=$1 OR p.owner_id=$1) AND p.status='active'
      GROUP BY p.id ORDER BY p.created_at DESC LIMIT 5
    `, [uid])

    const { rows: completionTrend } = await pool.query(`
      SELECT DATE(updated_at) as date, COUNT(*) as count
      FROM tasks
      WHERE status IN ('done','approved') AND updated_at >= NOW() - INTERVAL '7 days'
        AND (assignee_id=$1 OR created_by=$1)
      GROUP BY DATE(updated_at) ORDER BY date ASC
    `, [uid])

    const { rows: workflowStats } = await pool.query(`
      SELECT
        COUNT(we.id) as ai_tasks_total,
        COUNT(we.id) FILTER (WHERE t.status='in_review') as pending_review,
        AVG(we.accuracy_score) as avg_accuracy,
        AVG(we.relevance_score) as avg_relevance,
        AVG(we.coherence_score) as avg_coherence,
        AVG(we.overall_score) as avg_overall
      FROM workflow_evaluations we
      JOIN tasks t ON we.task_id = t.id
      WHERE t.assignee_id=$1 OR we.evaluator_id=$1
    `, [uid])

    res.json({ taskStats, overdueTasks, projectStats, completionTrend, workflowStats: workflowStats[0] })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

// --- USERS (for search/assign) ---
router.get('/users', auth, async (req, res) => {
  const { search } = req.query
  try {
    let q = 'SELECT id,name,email,role,avatar_color FROM users'
    let params = []
    if (search) { q += ' WHERE name ILIKE $1 OR email ILIKE $1'; params.push(`%${search}%`) }
    q += ' ORDER BY name LIMIT 50'
    const { rows } = await pool.query(q, params)
    res.json({ users: rows })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

module.exports = router
