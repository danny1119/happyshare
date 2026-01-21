import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Users, Receipt, ArrowRightLeft, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { groupsApi, membersApi, expensesApi, settlementsApi } from '@/services/api'
import type { Group, Balance, SuggestedSettlement } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

type Tab = 'expenses' | 'balances' | 'settlements'

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [group, setGroup] = useState<Group | null>(null)
  const [balances, setBalances] = useState<Balance[]>([])
  const [suggestions, setSuggestions] = useState<SuggestedSettlement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('expenses')

  // Add member form
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')

  // Add expense form
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expensePaidBy, setExpensePaidBy] = useState('')
  const [expenseParticipants, setExpenseParticipants] = useState<string[]>([])

  // Add settlement form
  const [showAddSettlement, setShowAddSettlement] = useState(false)
  const [settlementFrom, setSettlementFrom] = useState('')
  const [settlementTo, setSettlementTo] = useState('')
  const [settlementAmount, setSettlementAmount] = useState('')

  useEffect(() => {
    if (groupId) {
      loadGroup()
    }
  }, [groupId])

  useEffect(() => {
    if (groupId && activeTab === 'balances') {
      loadBalances()
    }
  }, [groupId, activeTab])

  useEffect(() => {
    if (showAddExpense && group) {
      setExpenseParticipants(group.members.map(m => m.id))
    }
  }, [showAddExpense, group])

  async function loadGroup() {
    try {
      const data = await groupsApi.getById(groupId!)
      setGroup(data)
    } catch (error) {
      console.error('Failed to load group:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadBalances() {
    try {
      const [balanceData, suggestionData] = await Promise.all([
        groupsApi.getBalances(groupId!),
        settlementsApi.getSuggested(groupId!)
      ])
      setBalances(balanceData)
      setSuggestions(suggestionData)
    } catch (error) {
      console.error('Failed to load balances:', error)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!newMemberName.trim() || !groupId) return

    try {
      const member = await membersApi.add(groupId, newMemberName.trim())
      setGroup(prev => prev ? {
        ...prev,
        members: [...prev.members, member]
      } : null)
      setNewMemberName('')
      setShowAddMember(false)
    } catch (error) {
      console.error('Failed to add member:', error)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return
    if (!groupId) return

    try {
      await membersApi.remove(groupId, memberId)
      setGroup(prev => prev ? {
        ...prev,
        members: prev.members.filter(m => m.id !== memberId)
      } : null)
    } catch (error) {
      alert('Cannot delete member with existing expenses')
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!expenseDescription.trim() || !expenseAmount || !expensePaidBy || !groupId) return
    if (expenseParticipants.length === 0) {
      alert('Please select at least one participant')
      return
    }

    try {
      const expense = await expensesApi.add(groupId, {
        description: expenseDescription.trim(),
        amount: parseFloat(expenseAmount),
        paidById: expensePaidBy,
        participantIds: expenseParticipants
      })
      setGroup(prev => prev ? {
        ...prev,
        expenses: [expense, ...(prev.expenses || [])]
      } : null)
      setExpenseDescription('')
      setExpenseAmount('')
      setExpensePaidBy('')
      setExpenseParticipants([])
      setShowAddExpense(false)
    } catch (error) {
      console.error('Failed to add expense:', error)
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return
    if (!groupId) return

    try {
      await expensesApi.delete(groupId, expenseId)
      setGroup(prev => prev ? {
        ...prev,
        expenses: prev.expenses?.filter(e => e.id !== expenseId)
      } : null)
    } catch (error) {
      console.error('Failed to delete expense:', error)
    }
  }

  async function handleAddSettlement(e: React.FormEvent) {
    e.preventDefault()
    if (!settlementFrom || !settlementTo || !settlementAmount || !groupId) return

    try {
      const settlement = await settlementsApi.add(groupId, {
        fromId: settlementFrom,
        toId: settlementTo,
        amount: parseFloat(settlementAmount)
      })
      setGroup(prev => prev ? {
        ...prev,
        settlements: [settlement, ...(prev.settlements || [])]
      } : null)
      setSettlementFrom('')
      setSettlementTo('')
      setSettlementAmount('')
      setShowAddSettlement(false)
      loadBalances()
    } catch (error) {
      console.error('Failed to add settlement:', error)
    }
  }

  async function handleDeleteSettlement(settlementId: string) {
    if (!confirm('Are you sure you want to delete this settlement?')) return
    if (!groupId) return

    try {
      await settlementsApi.delete(groupId, settlementId)
      setGroup(prev => prev ? {
        ...prev,
        settlements: prev.settlements?.filter(s => s.id !== settlementId)
      } : null)
      loadBalances()
    } catch (error) {
      console.error('Failed to delete settlement:', error)
    }
  }

  async function handleQuickSettle(from: string, to: string, amount: number) {
    if (!groupId) return

    try {
      const settlement = await settlementsApi.add(groupId, {
        fromId: from,
        toId: to,
        amount
      })
      setGroup(prev => prev ? {
        ...prev,
        settlements: [settlement, ...(prev.settlements || [])]
      } : null)
      loadBalances()
    } catch (error) {
      console.error('Failed to add settlement:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Group not found</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Groups
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            {group.description && (
              <p className="text-muted-foreground mt-1">{group.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Members Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Members ({group.members.length})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddMember(!showAddMember)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddMember && (
            <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
              <Input
                placeholder="Member name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Add</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddMember(false)}>
                Cancel
              </Button>
            </form>
          )}
          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full text-sm"
              >
                {member.name}
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'expenses' ? 'default' : 'outline'}
          onClick={() => setActiveTab('expenses')}
        >
          <Receipt className="w-4 h-4 mr-2" />
          Expenses
        </Button>
        <Button
          variant={activeTab === 'balances' ? 'default' : 'outline'}
          onClick={() => setActiveTab('balances')}
        >
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          Balances
        </Button>
        <Button
          variant={activeTab === 'settlements' ? 'default' : 'outline'}
          onClick={() => setActiveTab('settlements')}
        >
          <Users className="w-4 h-4 mr-2" />
          Settlements
        </Button>
      </div>

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Expenses</h2>
            <Button onClick={() => setShowAddExpense(!showAddExpense)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>

          {showAddExpense && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Add New Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="e.g., Dinner at restaurant"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Paid by</Label>
                    <Select value={expensePaidBy} onValueChange={setExpensePaidBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select who paid" />
                      </SelectTrigger>
                      <SelectContent>
                        {group.members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Split between</Label>
                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                      {group.members.map((member) => (
                        <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={expenseParticipants.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExpenseParticipants([...expenseParticipants, member.id])
                              } else {
                                setExpenseParticipants(expenseParticipants.filter(id => id !== member.id))
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm">{member.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {expenseParticipants.length} of {group.members.length} members selected
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Add Expense</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddExpense(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {!group.expenses?.length ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No expenses yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {group.expenses.map((expense) => (
                <Card key={expense.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{expense.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          Paid by {expense.paidBy.name} • {formatDate(expense.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Split among: {expense.shares.map(s => s.member.name).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold">
                          {formatCurrency(expense.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Balances</h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Current Balances</CardTitle>
              <CardDescription>
                Positive = owed money, Negative = owes money
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {balances.map((balance) => (
                  <div key={balance.member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span>{balance.member.name}</span>
                    <span className={`font-semibold ${balance.balance > 0 ? 'text-green-600' : balance.balance < 0 ? 'text-red-600' : ''}`}>
                      {balance.balance > 0 ? '+' : ''}{formatCurrency(balance.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggested Settlements</CardTitle>
                <CardDescription>
                  Simplest way to settle all debts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <span className="font-medium">{suggestion.from.name}</span>
                        <span className="mx-2">→</span>
                        <span className="font-medium">{suggestion.to.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatCurrency(suggestion.amount)}</span>
                        <Button
                          size="sm"
                          onClick={() => handleQuickSettle(suggestion.from.id, suggestion.to.id, suggestion.amount)}
                        >
                          Settle
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Settlements Tab */}
      {activeTab === 'settlements' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Settlements</h2>
            <Button onClick={() => setShowAddSettlement(!showAddSettlement)}>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>

          {showAddSettlement && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Record a Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSettlement} className="space-y-4">
                  <div className="space-y-2">
                    <Label>From (who paid)</Label>
                    <Select value={settlementFrom} onValueChange={setSettlementFrom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payer" />
                      </SelectTrigger>
                      <SelectContent>
                        {group.members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>To (who received)</Label>
                    <Select value={settlementTo} onValueChange={setSettlementTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select receiver" />
                      </SelectTrigger>
                      <SelectContent>
                        {group.members.filter(m => m.id !== settlementFrom).map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Record Payment</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddSettlement(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {!group.settlements?.length ? (
            <Card>
              <CardContent className="py-8 text-center">
                <ArrowRightLeft className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No settlements yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {group.settlements.map((settlement) => (
                <Card key={settlement.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {settlement.from.name} paid {settlement.to.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(settlement.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency(settlement.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSettlement(settlement.id)}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
