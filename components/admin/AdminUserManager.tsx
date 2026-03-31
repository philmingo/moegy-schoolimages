'use client';

import { useState, useEffect } from 'react';
import { school_report_images_createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Region {
  id: string;
  name: string;
}

interface UserRecord {
  id: string;
  user_id: string;
  email: string;
  role: string;
  school_code: string | null;
  region_id: string | null;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  regions: Region[];
}

export default function AdminUserManager({ regions }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('regional_officer');
  const [addRegion, setAddRegion] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const supabase = school_report_images_createClient();
      const { data, error: fetchError } = await supabase
        .from('school_report_images_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded && users.length === 0) {
      fetchUsers();
    }
  }, [isExpanded]);

  const handleRoleChange = async (user: UserRecord, newRole: string, regionId: string | null) => {
    setSaving(user.id);
    setError(null);
    setSuccess(null);

    try {
      const supabase = school_report_images_createClient();

      const updateData: Record<string, any> = {
        role: newRole,
        region_id: newRole === 'regional_officer' ? regionId : null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('school_report_images_users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUsers(users.map((u) =>
        u.id === user.id
          ? { ...u, role: newRole, region_id: newRole === 'regional_officer' ? regionId : null }
          : u
      ));
      setSuccess(`Updated ${user.email} to ${newRole}${newRole === 'regional_officer' && regionId ? ` (${regions.find(r => r.id === regionId)?.name})` : ''}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    } finally {
      setSaving(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const email = addEmail.trim().toLowerCase();

      // Check if email already exists
      const exists = users.some((u) => u.email.toLowerCase() === email);
      if (exists) {
        setError('A user with this email already exists');
        setAdding(false);
        return;
      }

      const supabase = school_report_images_createClient();

      const insertData: Record<string, any> = {
        email,
        role: addRole,
        is_active: true,
      };

      if (addRole === 'regional_officer' && addRegion) {
        insertData.region_id = addRegion;
      }

      const { data, error: insertError } = await supabase
        .from('school_report_images_users')
        .insert(insertData)
        .select('*')
        .single();

      if (insertError) throw insertError;

      setUsers([data, ...users]);
      setSuccess(`Pre-added ${email} as ${getRoleLabel(addRole)}${addRole === 'regional_officer' && addRegion ? ` (${regions.find(r => r.id === addRegion)?.name})` : ''}. They will be auto-assigned this role on first login.`);
      setAddEmail('');
      setAddRole('regional_officer');
      setAddRegion('');
      setShowAddForm(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
    } finally {
      setAdding(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.school_code || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'officer': return 'bg-blue-100 text-blue-700';
      case 'regional_officer': return 'bg-teal-100 text-teal-700';
      case 'school': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'regional_officer': return 'Regional Officer';
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md mt-8">
      <div
        className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {isExpanded && !showAddForm && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddForm(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm"
            >
              + Pre-add User
            </button>
          )}
          {!isExpanded && (
            <span className="text-sm text-gray-500">Manage user roles and regional assignments</span>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Pre-add User Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Pre-add User</h3>
              <p className="text-xs text-gray-600 mb-3">
                Add a user's email before they log in. They'll be auto-assigned the selected role on first login.
              </p>
              <form onSubmit={handleAddUser}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label htmlFor="addEmail" className="block text-xs font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      id="addEmail"
                      type="email"
                      required
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="user@moe.edu.gy"
                      className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="addRole" className="block text-xs font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      id="addRole"
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="regional_officer">Regional Officer</option>
                      <option value="officer">Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {addRole === 'regional_officer' && (
                    <div>
                      <label htmlFor="addRegion" className="block text-xs font-medium text-gray-700 mb-1">
                        Region *
                      </label>
                      <select
                        id="addRegion"
                        value={addRegion}
                        onChange={(e) => setAddRegion(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Region...</option>
                        {regions.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={adding || (addRole === 'regional_officer' && !addRegion)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {adding ? 'Adding...' : 'Add User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setAddEmail('');
                      setAddRole('regional_officer');
                      setAddRegion('');
                    }}
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-1">
                Search Users
              </label>
              <input
                id="userSearch"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Email, name, or school code..."
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Role
              </label>
              <select
                id="roleFilter"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="regional_officer">Regional Officer</option>
                <option value="officer">Officer</option>
                <option value="school">School</option>
              </select>
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users found</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-2">
                Showing {filteredUsers.length} of {users.length} users
              </p>
              {filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  regions={regions}
                  saving={saving === user.id}
                  onRoleChange={handleRoleChange}
                  getRoleBadgeColor={getRoleBadgeColor}
                  getRoleLabel={getRoleLabel}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  regions,
  saving,
  onRoleChange,
  getRoleBadgeColor,
  getRoleLabel,
}: {
  user: UserRecord;
  regions: Region[];
  saving: boolean;
  onRoleChange: (user: UserRecord, role: string, regionId: string | null) => void;
  getRoleBadgeColor: (role: string) => string;
  getRoleLabel: (role: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [selectedRegion, setSelectedRegion] = useState(user.region_id || '');

  const handleSave = () => {
    const regionId = selectedRole === 'regional_officer' ? (selectedRegion || null) : null;
    onRoleChange(user, selectedRole, regionId);
    setEditing(false);
  };

  const handleCancel = () => {
    setSelectedRole(user.role);
    setSelectedRegion(user.region_id || '');
    setEditing(false);
  };

  const regionName = user.region_id
    ? regions.find((r) => r.id === user.region_id)?.name
    : null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900 truncate">{user.email}</p>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
              {getRoleLabel(user.role)}
            </span>
            {user.role === 'regional_officer' && regionName && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                {regionName}
              </span>
            )}
            {!user.user_id && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                Pending Login
              </span>
            )}
          </div>
          {user.full_name && (
            <p className="text-sm text-gray-600 mt-0.5">{user.full_name}</p>
          )}
          {user.school_code && (
            <p className="text-xs text-gray-500 mt-0.5">School: {user.school_code}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Joined {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex-shrink-0">
          {editing ? (
            <div className="flex flex-col gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-1.5 text-sm bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="school">School</option>
                <option value="officer">Officer</option>
                <option value="regional_officer">Regional Officer</option>
                <option value="admin">Admin</option>
              </select>

              {selectedRole === 'regional_officer' && (
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Region...</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex gap-1">
                <button
                  onClick={handleSave}
                  disabled={saving || (selectedRole === 'regional_officer' && !selectedRegion)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              Edit Role
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
