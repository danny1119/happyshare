import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all settlements for a group
router.get('/:groupId/settlements', async (req, res) => {
  try {
    const { groupId } = req.params;
    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      include: {
        from: true,
        to: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(settlements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

// Add settlement (record a payment between members)
router.post('/:groupId/settlements', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { fromId, toId, amount } = req.body;
    
    if (!fromId || !toId || !amount) {
      return res.status(400).json({ error: 'fromId, toId, and amount are required' });
    }
    
    if (fromId === toId) {
      return res.status(400).json({ error: 'Cannot settle with yourself' });
    }
    
    const settlement = await prisma.settlement.create({
      data: {
        fromId,
        toId,
        amount,
        groupId
      },
      include: {
        from: true,
        to: true
      }
    });
    
    res.status(201).json(settlement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add settlement' });
  }
});

// Delete settlement
router.delete('/:groupId/settlements/:settlementId', async (req, res) => {
  try {
    const { settlementId } = req.params;
    await prisma.settlement.delete({ where: { id: settlementId } });
    res.json({ message: 'Settlement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete settlement' });
  }
});

// Get suggested settlements (who should pay whom to settle up)
router.get('/:groupId/settlements/suggested', async (req, res) => {
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
    
    // Calculate balances
    const balances: Record<string, number> = {};
    group.members.forEach(member => {
      balances[member.id] = 0;
    });
    
    group.expenses.forEach(expense => {
      balances[expense.paidById] += expense.amount;
      expense.shares.forEach(share => {
        balances[share.memberId] -= share.amount;
      });
    });
    
    group.settlements.forEach(settlement => {
      balances[settlement.fromId] += settlement.amount;
      balances[settlement.toId] -= settlement.amount;
    });
    
    // Separate into creditors and debtors
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];
    
    Object.entries(balances).forEach(([id, balance]) => {
      if (balance > 0.01) {
        creditors.push({ id, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ id, amount: -balance });
      }
    });
    
    // Sort by amount (descending)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    // Generate suggested settlements
    const suggestions: { from: typeof group.members[0]; to: typeof group.members[0]; amount: number }[] = [];
    
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const amount = Math.min(debtor.amount, creditor.amount);
      
      if (amount > 0.01) {
        const fromMember = group.members.find(m => m.id === debtor.id)!;
        const toMember = group.members.find(m => m.id === creditor.id)!;
        
        suggestions.push({
          from: fromMember,
          to: toMember,
          amount: Math.round(amount * 100) / 100
        });
      }
      
      debtor.amount -= amount;
      creditor.amount -= amount;
      
      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }
    
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate suggested settlements' });
  }
});

export default router;
