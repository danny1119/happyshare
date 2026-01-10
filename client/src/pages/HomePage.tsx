import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Receipt, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { groupsApi } from '@/services/api'
import type { Group } from '@/types'
import { formatDate } from '@/lib/utils'

export default function HomePage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [memberNames, setMemberNames] = useState<string[]>(['', ''])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    try {
      const data = await groupsApi.getAll()
      setGroups(data)
    } catch (error) {
      console.error('Failed to load groups:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!newGroupName.trim()) return

    setCreating(true)
    try {
      const members = memberNames
        .filter(name => name.trim())
        .map(name => ({ name: name.trim() }))

      const group = await groupsApi.create({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        members
      })

      setGroups([group, ...groups])
      setShowCreateForm(false)
      setNewGroupName('')
      setNewGroupDescription('')
      setMemberNames(['', ''])
      navigate(`/group/${group.id}`)
    } catch (error) {
      console.error('Failed to create group:', error)
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm('Are you sure you want to delete this group?')) return

    try {
      await groupsApi.delete(groupId)
      setGroups(groups.filter(g => g.id !== groupId))
    } catch (error) {
      console.error('Failed to delete group:', error)
    }
  }

  function addMemberField() {
    setMemberNames([...memberNames, ''])
  }

  function updateMemberName(index: number, value: string) {
    const updated = [...memberNames]
    updated[index] = value
    setMemberNames(updated)
  }

  function removeMemberField(index: number) {
    if (memberNames.length <= 2) return
    setMemberNames(memberNames.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Groups</h1>
          <p className="text-muted-foreground mt-1">
            Create a group to start splitting bills with friends
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Group
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
            <CardDescription>
              Add group details and initial members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Trip to Paris"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupDescription">Description</Label>
                <Input
                  id="groupDescription"
                  placeholder="Optional description"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Members</Label>
                <div className="space-y-2">
                  {memberNames.map((name, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Member ${index + 1} name`}
                        value={name}
                        onChange={(e) => updateMemberName(index, e.target.value)}
                      />
                      {memberNames.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeMemberField(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMemberField}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Group'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first group to start splitting bills
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/group/${group.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    {group.description && (
                      <CardDescription>{group.description}</CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteGroup(group.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {group.members.length} members
                  </div>
                  <div className="flex items-center gap-1">
                    <Receipt className="w-4 h-4" />
                    {group._count?.expenses || 0} expenses
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Created {formatDate(group.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
