import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import groupRoutes from './routes/groups';
import memberRoutes from './routes/members';
import expenseRoutes from './routes/expenses';
import settlementRoutes from './routes/settlements';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/groups', groupRoutes);
app.use('/api/groups', memberRoutes);
app.use('/api/groups', expenseRoutes);
app.use('/api/groups', settlementRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HappyShare API is running' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { prisma };
