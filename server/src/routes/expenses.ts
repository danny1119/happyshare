import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all expenses for a group
router.get('/:groupId/expenses', async (req, res) => {
  try {
    const { groupId } = req.params;
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        paidBy: true,
        shares: {
          include: { member: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Add expense
router.post('/:groupId/expenses', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { description, amount, paidById, splitType, shares, participantIds } = req.body;
    
    if (!description || !amount || !paidById) {
      return res.status(400).json({ error: 'Description, amount, and paidById are required' });
    }
    
    // Get group members for equal split
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true }
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    let expenseShares: { memberId: string; amount: number }[];
    
    if (splitType === 'custom' && shares) {
      // Custom split - use provided shares
      expenseShares = shares;
    } else {
      // Equal split - use participantIds if provided, otherwise all members
      const participants = participantIds && participantIds.length > 0
        ? group.members.filter(m => participantIds.includes(m.id))
        : group.members;
      
      if (participants.length === 0) {
        return res.status(400).json({ error: 'At least one participant is required' });
      }
      
      const shareAmount = amount / participants.length;
      expenseShares = participants.map(member => ({
        memberId: member.id,
        amount: shareAmount
      }));
    }
    
    const expense = await prisma.expense.create({
      data: {
        description,
        amount,
        paidById,
        groupId,
        splitType: splitType || 'equal',
        shares: {
          create: expenseShares
        }
      },
      include: {
        paidBy: true,
        shares: {
          include: { member: true }
        }
      }
    });
    
    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Update expense
router.put('/:groupId/expenses/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { description, amount, paidById, splitType, shares, participantIds } = req.body;
    
    // Delete existing shares
    await prisma.expenseShare.deleteMany({
      where: { expenseId }
    });
    
    // Get group members for equal split if needed
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { group: { include: { members: true } } }
    });
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    let expenseShares: { memberId: string; amount: number }[];
    
    if (splitType === 'custom' && shares) {
      expenseShares = shares;
    } else {
      // Equal split - use participantIds if provided, otherwise all members
      const participants = participantIds && participantIds.length > 0
        ? expense.group.members.filter(m => participantIds.includes(m.id))
        : expense.group.members;
      
      if (participants.length === 0) {
        return res.status(400).json({ error: 'At least one participant is required' });
      }
      
      const shareAmount = amount / participants.length;
      expenseShares = participants.map(member => ({
        memberId: member.id,
        amount: shareAmount
      }));
    }
    
    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        description,
        amount,
        paidById,
        splitType: splitType || 'equal',
        shares: {
          create: expenseShares
        }
      },
      include: {
        paidBy: true,
        shares: {
          include: { member: true }
        }
      }
    });
    
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:groupId/expenses/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;
    await prisma.expense.delete({ where: { id: expenseId } });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
