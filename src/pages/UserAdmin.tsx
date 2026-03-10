import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserAdmin.css';

interface UserRecord {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: number;
}

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://api.stinessolutions.com';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const UserAdmin: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [pageError, setPageError] = useState('');

  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Reset password modal state
  const [resettingUser, setResettingUser] = useState<UserRecord | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Create user modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createRole, setCreateRole] = useState<'user' | 'admin'>('user');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setPageError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load users');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // --- Edit ---
  const openEdit = (u: UserRecord) => {
    setEditingUser(u);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditError('');
    setEditSuccess('');
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditError('');
    setEditSuccess('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');
    setEditSuccess('');
    setEditLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${editingUser.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: editEmail.toLowerCase().trim(), role: editRole }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }
      setEditSuccess('User updated successfully');
      setUsers(prev =>
        prev.map(u => u.userId === editingUser.userId ? { ...u, email: editEmail.toLowerCase().trim(), role: editRole } : u)
      );
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  // --- Reset Password ---
  const openReset = (u: UserRecord) => {
    setResettingUser(u);
    setResetPassword('');
    setShowResetPassword(false);
    setResetError('');
    setResetSuccess('');
  };

  const closeReset = () => {
    setResettingUser(null);
    setResetError('');
    setResetSuccess('');
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (resetPassword.length < 8) {
      setResetError('Password must be at least 8 characters');
      return;
    }
    setResetError('');
    setResetSuccess('');
    setResetLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${resettingUser.userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: resetPassword }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset password');
      }
      setResetSuccess('Password reset successfully');
      setResetPassword('');
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  // --- Delete ---
  const openDelete = (u: UserRecord) => {
    setDeletingUser(u);
    setDeleteError('');
  };

  const closeDelete = () => {
    setDeletingUser(null);
    setDeleteError('');
  };

  // --- Create User ---
  const openCreate = () => {
    setCreateEmail('');
    setCreatePassword('');
    setShowCreatePassword(false);
    setCreateRole('user');
    setCreateError('');
    setCreateSuccess('');
    setShowCreateModal(true);
  };

  const closeCreate = () => {
    setShowCreateModal(false);
    setCreateError('');
    setCreateSuccess('');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createPassword.length < 8) {
      setCreateError('Password must be at least 8 characters');
      return;
    }
    setCreateError('');
    setCreateSuccess('');
    setCreateLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: createEmail.toLowerCase().trim(), password: createPassword, role: createRole }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create account');
      }
      setCreateSuccess(`Account for ${createEmail.toLowerCase().trim()} created successfully`);
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('user');
      loadUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${deletingUser.userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      setUsers(prev => prev.filter(u => u.userId !== deletingUser.userId));
      setDeletingUser(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="user-admin-container">
      <div className="user-admin-card">
        <div className="user-admin-header">
          <h1>User Administration</h1>
          <div className="user-admin-header-actions">
            <button className="btn-primary btn-create-user" onClick={openCreate}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create User
            </button>
            <button className="btn-icon-refresh" onClick={loadUsers} title="Refresh" disabled={loadingUsers}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {pageError && (
          <div className="alert alert-error">
            <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {pageError}
          </div>
        )}

        {loadingUsers ? (
          <div className="user-admin-loading">Loading users...</div>
        ) : (
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="user-table-empty">No users found.</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.userId} className={u.userId === currentUser?.userId ? 'user-table-row-self' : ''}>
                      <td>{u.email}{u.userId === currentUser?.userId && <span className="user-self-badge">you</span>}</td>
                      <td><span className={`role-badge role-badge--${u.role}`}>{u.role}</span></td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td className="user-table-actions">
                        <button
                          className="btn-action btn-action--edit"
                          onClick={() => openEdit(u)}
                          title="Edit user"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className="btn-action btn-action--reset"
                          onClick={() => openReset(u)}
                          title="Reset password"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Reset PW
                        </button>
                        <button
                          className="btn-action btn-action--delete"
                          onClick={() => openDelete(u)}
                          title="Delete user"
                          disabled={u.userId === currentUser?.userId}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="ua-modal-backdrop" onClick={closeCreate}>
          <div className="ua-modal" onClick={e => e.stopPropagation()}>
            <div className="ua-modal-header">
              <h2>Create User</h2>
              <button className="ua-modal-close" onClick={closeCreate} aria-label="Close">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {createError && (
              <div className="alert alert-error">
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="alert alert-success">
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label htmlFor="create-email">Email</label>
                <input
                  type="email"
                  id="create-email"
                  value={createEmail}
                  onChange={e => setCreateEmail(e.target.value)}
                  required
                  disabled={createLoading}
                  placeholder="user@example.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="create-password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    id="create-password"
                    value={createPassword}
                    onChange={e => setCreatePassword(e.target.value)}
                    required
                    disabled={createLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                  >
                    {showCreatePassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                <small className="form-hint">Must be at least 8 characters</small>
              </div>
              <div className="form-group">
                <label htmlFor="create-role">Role</label>
                <select
                  id="create-role"
                  value={createRole}
                  onChange={e => setCreateRole(e.target.value as 'user' | 'admin')}
                  disabled={createLoading}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="ua-modal-footer">
                <button type="button" className="btn-secondary" onClick={closeCreate} disabled={createLoading}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="ua-modal-backdrop" onClick={closeEdit}>
          <div className="ua-modal" onClick={e => e.stopPropagation()}>
            <div className="ua-modal-header">
              <h2>Edit User</h2>
              <button className="ua-modal-close" onClick={closeEdit} aria-label="Close">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editError && (
              <div className="alert alert-error">
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {editError}
              </div>
            )}
            {editSuccess && (
              <div className="alert alert-success">
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="edit-email">Email</label>
                <input
                  type="email"
                  id="edit-email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  required
                  disabled={editLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as 'user' | 'admin')}
                  disabled={editLoading}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="ua-modal-footer">
                <button type="button" className="btn-secondary" onClick={closeEdit} disabled={editLoading}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="ua-modal-backdrop" onClick={closeReset}>
          <div className="ua-modal" onClick={e => e.stopPropagation()}>
            <div className="ua-modal-header">
              <h2>Reset Password</h2>
              <button className="ua-modal-close" onClick={closeReset} aria-label="Close">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="ua-modal-subtitle">Setting new password for <strong>{resettingUser.email}</strong></p>

            {resetError && (
              <div className="alert alert-error">
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="alert alert-success">
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleResetSubmit}>
              <div className="form-group">
                <label htmlFor="reset-password">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    id="reset-password"
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    required
                    disabled={resetLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                  >
                    {showResetPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                <small className="form-hint">Must be at least 8 characters</small>
              </div>
              <div className="ua-modal-footer">
                <button type="button" className="btn-secondary" onClick={closeReset} disabled={resetLoading}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={resetLoading}>
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="ua-modal-backdrop" onClick={closeDelete}>
          <div className="ua-modal ua-modal--narrow" onClick={e => e.stopPropagation()}>
            <div className="ua-modal-header">
              <h2>Delete User</h2>
              <button className="ua-modal-close" onClick={closeDelete} aria-label="Close">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="ua-delete-message">
              Are you sure you want to delete <strong>{deletingUser.email}</strong>? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="alert alert-error">
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {deleteError}
              </div>
            )}

            <div className="ua-modal-footer">
              <button type="button" className="btn-secondary" onClick={closeDelete} disabled={deleteLoading}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAdmin;
