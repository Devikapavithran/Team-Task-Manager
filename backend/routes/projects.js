const router = require('express').Router()
const { pool } = require('../db')
const { auth, requireAdmin } = require('../middleware/auth')

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.name as owner_name,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('done','approved')) as completed_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.due_date < NOW() AND t.status NOT IN ('done','approved')) as overdue_count,
        COUNT(DISTINCT pm2.user_id) as member_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      LEFT JOIN project_members pm2 ON pm2.project_id = p.id
      WHERE pm.user_id = $1 OR p.owner_id = $1
      GROUP BY p.id, u.name
      ORDER BY p.created_at DESC
    `, [req.user.id])
    res.json({ projects: rows })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.name as owner_name,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('done','approved')) as completed_count,
        COUNT(DISTINCT pm2.user_id) as member_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      LEFT JOIN project_members pm2 ON pm2.project_id = p.id
      WHERE p.id=$1 AND (pm.user_id=$2 OR p.owner_id=$2)
      GROUP BY p.id, u.name
    `, [req.params.id, req.user.id])
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' })

    const { rows: members } = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.avatar_color, pm.role as project_role
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id=$1
    `, [req.params.id])

    const { rows: tasks } = await pool.query(`
      SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color
      FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id=$1 ORDER BY t.created_at DESC
    `, [req.params.id])

    res.json({ project: rows[0], members, tasks })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

// Create project
router.post('/', auth, async (req, res) => {
  const { name, description, color, due_date, member_ids } = req.body
  if (!name) return res.status(400).json({ error: 'Name required' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO projects (name,description,color,due_date,owner_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description, color || '#6366f1', due_date || null, req.user.id]
    )
    const p = rows[0]
    await pool.query('INSERT INTO project_members (project_id,user_id,role) VALUES ($1,$2,$3)', [p.id, req.user.id, 'admin'])
    if (member_ids?.length) {
      for (const uid of member_ids) {
        if (uid !== req.user.id) {
          await pool.query('INSERT INTO project_members (project_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [p.id, uid])
        }
      }
    }
    res.status(201).json({ project: p })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

// Update project
router.put('/:id', auth, async (req, res) => {
  const { name, description, color, status, due_date } = req.body
  try {
    const { rows } = await pool.query(`
      UPDATE projects SET
        name=COALESCE($1,name), description=COALESCE($2,description),
        color=COALESCE($3,color), status=COALESCE($4,status),
        due_date=COALESCE($5,due_date), updated_at=NOW()
      WHERE id=$6 AND owner_id=$7 RETURNING *
    `, [name, description, color, status, due_date, req.params.id, req.user.id])
    if (!rows[0]) return res.status(404).json({ error: 'Project not found or no permission' })
    res.json({ project: rows[0] })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// Add member
router.post('/:id/members', auth, async (req, res) => {
  const { user_id, role } = req.body
  try {
    await pool.query('INSERT INTO project_members (project_id,user_id,role) VALUES ($1,$2,$3) ON CONFLICT (project_id,user_id) DO UPDATE SET role=$3',
      [req.params.id, user_id, role || 'member'])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// Remove member
router.delete('/:id/members/:uid', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM project_members WHERE project_id=$1 AND user_id=$2', [req.params.id, req.params.uid])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

module.exports = router
