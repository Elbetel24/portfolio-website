const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

// Create
router.post('/', auth, async (req, res) => {
  try {
    const exp = await Expense.create({ ...req.body, userId: req.user.id });
    res.json(exp);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Update
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Expense.update(req.body, { where: { id, userId: req.user.id } });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    const found = await Expense.findOne({ where: { id, userId: req.user.id } });
    res.json(found);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.destroy({ where: { id, userId: req.user.id } });
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// List + search + filter + pagination
router.get('/', auth, async (req, res) => {
  try {
    const { search, category, start, end, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user.id };
    if (search) filter.title = { [Op.like]: `%${search}%` };
    if (category) filter.category = category;
    if (start || end) filter.date = {};
    if (start) filter.date[Op.gte] = new Date(start);
    if (end) filter.date[Op.lte] = new Date(end);
    const skip = (Math.max(1, page) - 1) * limit;
    const items = await Expense.findAll({ where: filter, order: [['date', 'DESC']], offset: skip, limit: Number(limit) });
    const total = await Expense.count({ where: filter });
    res.json({ items, total });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Monthly summary (by category)
router.get('/summary/monthly', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const d = new Date();
    const y = Number(year) || d.getFullYear();
    const m = typeof month !== 'undefined' ? Number(month) : d.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);
    const data = await Expense.findAll({
      attributes: ['category', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      where: { userId: req.user.id, date: { [Op.gte]: start, [Op.lt]: end } },
      group: ['category']
    });
    res.json(data.map(d => ({ category: d.category, total: Number(d.get('total')) })));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
