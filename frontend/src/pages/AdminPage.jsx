import { useState, useEffect } from 'react';
import { adminListUsers, adminChangeRole, adminToggleUser, adminUpdateUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

function AdminPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionMsg, setActionMsg] = useState(null);
    const [editModal, setEditModal] = useState(null); // user object being edited
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editing, setEditing] = useState(false);

    const fetchUsers = async () => {
        try {
            setError(null);
            const data = await adminListUsers();
            setUsers(data.users);
        } catch (err) {
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleRole = async (targetUsername, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            setActionMsg(null);
            await adminChangeRole(targetUsername, newRole);
            setActionMsg(`✅ Changed ${targetUsername}'s role to ${newRole}`);
            fetchUsers();
        } catch (err) {
            setActionMsg(`❌ ${err.message}`);
        }
    };

    const handleToggleDisable = async (targetUsername, currentlyDisabled) => {
        try {
            setActionMsg(null);
            await adminToggleUser(targetUsername, currentlyDisabled);
            setActionMsg(`✅ ${currentlyDisabled ? 'Enabled' : 'Disabled'} ${targetUsername}`);
            fetchUsers();
        } catch (err) {
            setActionMsg(`❌ ${err.message}`);
        }
    };

    const openEditModal = (targetUser) => {
        setEditModal(targetUser);
        setEditEmail(targetUser.email || '');
        setEditPassword('');
        setEditRole(targetUser.role || 'user');
        setEditing(false);
    };

    const closeEditModal = () => {
        setEditModal(null);
        setEditEmail('');
        setEditPassword('');
        setEditRole('');
        setEditing(false);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editModal) return;

        setEditing(true);
        setActionMsg(null);

        try {
            const updateData = {};
            if (editEmail !== editModal.email) updateData.email = editEmail;
            if (editPassword) updateData.password = editPassword;
            if (editRole !== editModal.role) updateData.role = editRole;

            if (Object.keys(updateData).length === 0) {
                setActionMsg('ℹ️ No changes to save');
                closeEditModal();
                return;
            }

            await adminUpdateUser(editModal.username, updateData);
            setActionMsg(`✅ Updated ${editModal.username} successfully`);
            closeEditModal();
            fetchUsers();
        } catch (err) {
            setActionMsg(`❌ ${err.message}`);
        } finally {
            setEditing(false);
        }
    };

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="loading-spinner">
                    <div className="spinner" />
                    <p style={{ color: 'var(--color-text-secondary)' }}>Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <h2 className="section-title">🛡️ Admin Panel</h2>
            <p className="section-subtitle">Manage users and roles</p>

            {error && (
                <div className="auth-error" style={{ marginBottom: '1rem' }}>
                    ⚠️ {error}
                </div>
            )}

            {actionMsg && (
                <div className={`${actionMsg.startsWith('✅') || actionMsg.startsWith('ℹ️') ? 'auth-success' : 'auth-error'}`} style={{ marginBottom: '1rem' }}>
                    {actionMsg}
                </div>
            )}

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.username} className={u.disabled ? 'disabled-row' : ''}>
                                        <td className="admin-username">
                                            {u.username}
                                            {u.username === user?.username && (
                                                <span className="admin-you-badge">You</span>
                                            )}
                                        </td>
                                        <td className="admin-email">{u.email}</td>
                                        <td>
                                            <span className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${u.disabled ? 'status-disabled' : 'status-active'}`}>
                                                {u.disabled ? 'Disabled' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="admin-date">{formatDate(u.created_at)}</td>
                                        <td className="admin-actions">
                                            <button
                                                className="btn-secondary admin-action-btn"
                                                onClick={() => handleToggleRole(u.username, u.role)}
                                                disabled={u.username === user?.username}
                                                title={u.username === user?.username ? 'Cannot change your own role' : `Toggle role`}
                                            >
                                                {u.role === 'admin' ? '→ User' : '→ Admin'}
                                            </button>
                                            <button
                                                className={`btn-secondary admin-action-btn ${u.disabled ? 'enable-btn' : 'disable-btn'}`}
                                                onClick={() => handleToggleDisable(u.username, u.disabled)}
                                                disabled={u.username === user?.username}
                                                title={u.username === user?.username ? 'Cannot disable yourself' : u.disabled ? 'Enable user' : 'Disable user'}
                                            >
                                                {u.disabled ? '✅ Enable' : '🚫 Disable'}
                                            </button>
                                            <button
                                                className="btn-secondary admin-action-btn"
                                                onClick={() => openEditModal(u)}
                                                title="Edit user details"
                                                style={{ background: 'var(--color-primary)', color: 'white' }}
                                            >
                                                ✏️ Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {editModal && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>✏️ Edit User: {editModal.username}</h3>
                            <button className="modal-close-btn" onClick={closeEditModal}>✕</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="edit-email">Email</label>
                                <input
                                    id="edit-email"
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    placeholder="user@example.com"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="edit-password">New Password (leave blank to keep current)</label>
                                <input
                                    id="edit-password"
                                    type="password"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    placeholder="Enter new password..."
                                    minLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="edit-role">Role</label>
                                <select
                                    id="edit-role"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeEditModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={editing}>
                                    {editing ? '⏳ Saving...' : '💾 Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }
                .modal-content {
                    background: var(--color-card-bg, #1a1a2e);
                    border-radius: 16px;
                    padding: 2rem;
                    width: 100%;
                    max-width: 480px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.08);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .modal-header h3 {
                    margin: 0;
                    font-size: 1.2rem;
                }
                .modal-close-btn {
                    background: none;
                    border: none;
                    color: var(--color-text-secondary);
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                .modal-close-btn:hover {
                    background: rgba(255,255,255,0.1);
                }
                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    margin-top: 1.5rem;
                }
                .modal-actions button {
                    min-width: 120px;
                }
                .admin-action-btn + .admin-action-btn {
                    margin-left: 4px;
                }
            `}</style>
        </div>
    );
}

export default AdminPage;

