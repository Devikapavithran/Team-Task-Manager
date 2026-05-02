const router = require('express').Router()
const { pool } = require('../db')
const { auth } = require('../middleware/auth')

// Get tasks (with filters)
router.get('/', auth, async (req, res) => {
  const { project_id, assignee_id, status, priority, overdue, type, search } = req.query
  let where = [`(t.assignee_id=$1 OR t.created_by=$1 OR pm.user_id=$1)`]
  let params = [req.user.id]
  let i = 2

  if (project_id) { where.push(`t.project_id=$${i++}`); params.push(project_id) }
  if (assignee_id) { where.push(`t.assignee_id=$${i++}`); params.push(assignee_id) }
  if (status) { where.push(`t.status=$${i++}`); params.push(status) }
  if (priority) { where.push(`t.priority=$${i++}`); params.push(priority) }
  if (overdue === 'true') where.push(`t.due_date < NOW() AND t.status NOT IN ('done','approved')`)
  if (type) { where.push(`t.task_type=$${i++}`); params.push(type) }
  if (search) { where.push(`(t.title ILIKE $${i} OR t.description ILIKE $${i})`); params.push(`%${search}%`); i++ }

  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT t.*, u.name as assignee_name, u.avatar_color as assignee_color,
        p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON pm.project_id = t.project_id
      WHERE ${where.join(' AND ')}
      ORDER BY t.created_at DESC
      LIMIT 200
    `, params)
    res.json({ tasks: rows })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color,
        p.name as project_name, p.color as project_color,
        cb.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users cb ON t.created_by = cb.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id=$1
    `, [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' })

    const { rows: comments } = await pool.query(`
      SELECT tc.*, u.name as user_name, u.avatar_color
      FROM task_comments tc JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id=$1 ORDER BY tc.created_at ASC
    `, [req.params.id])

    const { rows: evaluations } = await pool.query(`
      SELECT we.*, u.name as evaluator_name
      FROM workflow_evaluations we LEFT JOIN users u ON we.evaluator_id = u.id
      WHERE we.task_id=$1 ORDER BY we.created_at DESC
    `, [req.params.id])

    res.json({ task: rows[0], comments, evaluations })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

// Create task
router.post('/', auth, async (req, res) => {
  const { title, description, project_id, assignee_id, status, priority, due_date, tags, task_type } = req.body
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project required' })
  try {
    const { rows } = await pool.query(`
      INSERT INTO tasks (title,description,project_id,assignee_id,created_by,status,priority,due_date,tags,task_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [title, description, project_id, assignee_id || null, req.user.id,
        status || 'todo', priority || 'medium', due_date || null, tags || [], task_type || 'general'])
    
    if (assignee_id && assignee_id !== req.user.id) {
      await pool.query(`INSERT INTO notifications (user_id,title,message,type,link) VALUES ($1,$2,$3,$4,$5)`,
        [assignee_id, 'New Task Assigned', `You've been assigned: ${title}`, 'task', `/tasks/${rows[0].id}`])
    }
    res.status(201).json({ task: rows[0] })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

// Update task
router.put('/:id', auth, async (req, res) => {
  const { title, description, assignee_id, status, priority, due_date, tags, task_type } = req.body
  try {
    const { rows: old } = await pool.query('SELECT * FROM tasks WHERE id=$1', [req.params.id])
    if (!old[0]) return res.status(404).json({ error: 'Task not found' })

    const { rows } = await pool.query(`
      UPDATE tasks SET
        title=COALESCE($1,title), description=COALESCE($2,description),
        assignee_id=COALESCE($3,assignee_id), status=COALESCE($4,status),
        priority=COALESCE($5,priority), due_date=COALESCE($6,due_date),
        tags=COALESCE($7,tags), task_type=COALESCE($8,task_type), updated_at=NOW()
      WHERE id=$9 RETURNING *
    `, [title, description, assignee_id, status, priority, due_date, tags, task_type, req.params.id])

    // Notify on status change
    if (status && status !== old[0].status && old[0].created_by && old[0].created_by !== req.user.id) {
      await pool.query(`INSERT INTO notifications (user_id,title,message,type,link) VALUES ($1,$2,$3,$4,$5)`,
        [old[0].created_by, 'Task Status Updated', `"${old[0].title}" is now ${status.replace('_',' ')}`, 'status', `/tasks/${req.params.id}`])
    }
    res.json({ task: rows[0] })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
  const { content } = req.body
  if (!content) return res.status(400).json({ error: 'Content required' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO task_comments (task_id,user_id,content) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, req.user.id, content]
    )
    const { rows: full } = await pool.query(`
      SELECT tc.*, u.name as user_name, u.avatar_color FROM task_comments tc
      JOIN users u ON tc.user_id=u.id WHERE tc.id=$1
    `, [rows[0].id])
    res.status(201).json({ comment: full[0] })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// Submit evaluation
router.post('/:id/evaluate', auth, async (req, res) => {
  const { accuracy_score, relevance_score, coherence_score, overall_score, feedback, guidelines_followed } = req.body
  try {
    const { rows } = await pool.query(`
      INSERT INTO workflow_evaluations (task_id,evaluator_id,accuracy_score,relevance_score,coherence_score,overall_score,feedback,guidelines_followed)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT DO NOTHING RETURNING *
    `, [req.params.id, req.user.id, accuracy_score, relevance_score, coherence_score, overall_score, feedback, guidelines_followed !== false])
    
    // Auto-update task status to in_review
    await pool.query(`UPDATE tasks SET status='in_review', updated_at=NOW() WHERE id=$1 AND status='in_progress'`, [req.params.id])
    res.json({ evaluation: rows[0] })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

module.exports = router
