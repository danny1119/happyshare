# HappyShare - Bill Splitting App

A web application to help groups of people split bills and track expenses easily.

## Features

- **Groups**: Create groups for different occasions (trips, roommates, events)
- **Members**: Add and manage group members
- **Expenses**: Track expenses with who paid and equal split among members
- **Balances**: See who owes whom at a glance
- **Settlements**: Record payments between members to settle debts
- **Smart Suggestions**: Get optimized settlement suggestions to minimize transactions

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with Prisma ORM

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd happyshare
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```
   The API will be running at http://localhost:3001

5. **Install frontend dependencies** (in a new terminal)
   ```bash
   cd client
   npm install
   ```

6. **Start the frontend**
   ```bash
   npm run dev
   ```
   The app will be running at http://localhost:3000

## API Endpoints

### Groups
- `GET /api/groups` - Get all groups
- `GET /api/groups/:groupId` - Get group details
- `POST /api/groups` - Create a new group
- `PUT /api/groups/:groupId` - Update a group
- `DELETE /api/groups/:groupId` - Delete a group
- `GET /api/groups/:groupId/balances` - Get member balances

### Members
- `GET /api/groups/:groupId/members` - Get group members
- `POST /api/groups/:groupId/members` - Add a member
- `PUT /api/groups/:groupId/members/:memberId` - Update a member
- `DELETE /api/groups/:groupId/members/:memberId` - Remove a member

### Expenses
- `GET /api/groups/:groupId/expenses` - Get group expenses
- `POST /api/groups/:groupId/expenses` - Add an expense
- `PUT /api/groups/:groupId/expenses/:expenseId` - Update an expense
- `DELETE /api/groups/:groupId/expenses/:expenseId` - Delete an expense

### Settlements
- `GET /api/groups/:groupId/settlements` - Get settlements
- `POST /api/groups/:groupId/settlements` - Record a settlement
- `DELETE /api/groups/:groupId/settlements/:settlementId` - Delete a settlement
- `GET /api/groups/:groupId/settlements/suggested` - Get suggested settlements

## Usage

1. **Create a Group**: Click "New Group" and add group name and initial members
2. **Add Expenses**: Select a group, go to Expenses tab, and add expenses with who paid
3. **View Balances**: Check the Balances tab to see who owes whom
4. **Settle Up**: Use suggested settlements or manually record payments

## License

MIT
