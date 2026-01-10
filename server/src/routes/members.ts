import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all members of a group
router.get('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const members = await prisma.member.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Add member to group
router.post('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Member name is required' });
    }
    
    // Check if group exists
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const member = await prisma.member.create({
      data: { name, groupId }
    });
    
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Update member
router.put('/:groupId/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { name } = req.body;
    
    const member = await prisma.member.update({
      where: { id: memberId },
      data: { name }
    });
    
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Remove member from group
router.delete('/:groupId/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    
    // Check if member has any expenses or shares
    const hasExpenses = await prisma.expense.findFirst({
      where: { paidById: memberId }
    });
    
    const hasShares = await prisma.expenseShare.findFirst({
      where: { memberId }
    });
    
    if (hasExpenses || hasShares) {
      return res.status(400).json({ 
        error: 'Cannot delete member with existing expenses. Delete their expenses first.' 
      });
    }
    
    await prisma.member.delete({ where: { id: memberId } });
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;
