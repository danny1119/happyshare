import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all groups
router.get('/', async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        members: true,
        _count: {
          select: { expenses: true, settlements: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get single group with all details
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        expenses: {
          include: {
            paidBy: true,
            shares: {
              include: { member: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        settlements: {
          include: {
            from: true,
            to: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Create new group
router.post('/', async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    const group = await prisma.group.create({
      data: {
        name,
        description,
        members: {
          create: members?.map((m: { name: string }) => ({ name: m.name })) || []
        }
      },
      include: { members: true }
    });
    
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Update group
router.put('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;
    
    const group = await prisma.group.update({
      where: { id: groupId },
      data: { name, description },
      include: { members: true }
    });
    
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete group
router.delete('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    await prisma.group.delete({ where: { id: groupId } });
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Get group balances
router.get('/:groupId/balances', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        expenses: {
          include: { shares: true }
        },
        settlements: true
      }
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Calculate balances for each member
    const balances: Record<string, number> = {};
    
    // Initialize balances
    group.members.forEach(member => {
      balances[member.id] = 0;
    });
    
    // Add what each person paid
    group.expenses.forEach(expense => {
      balances[expense.paidById] += expense.amount;
    });
    
    // Subtract what each person owes
    group.expenses.forEach(expense => {
      expense.shares.forEach(share => {
        balances[share.memberId] -= share.amount;
      });
    });
    
    // Account for settlements
    group.settlements.forEach(settlement => {
      balances[settlement.fromId] += settlement.amount;
      balances[settlement.toId] -= settlement.amount;
    });
    
    // Format response
    const result = group.members.map(member => ({
      member,
      balance: Math.round(balances[member.id] * 100) / 100
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate balances' });
  }
});

export default router;
