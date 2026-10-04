import React, { useState, useEffect } from 'react';
import { SpendProject } from '../types';
import { calculateBalances, simplifyDebts, CATEGORY_ICONS } from '../utils';
import { AddExpenseModal } from './AddExpenseModal';
import { 
  ArrowLeft, Plus, Users, Receipt, Scale, UserPlus, 
  CheckCircle2, Trash2, Wallet, Sparkles, UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { subscribeUsersFromFirestore } from '../firebase';

interface ProjectDetailViewProps {
  project: SpendProject;
  onBack: () => void;
  onUpdateProject: (updated: SpendProject) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onUpdateProject,
  onDeleteProject
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'members'>('expenses');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [registeredUsersMap, setRegisteredUsersMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsubscribe = subscribeUsersFromFirestore((fetchedUsers) => {
      setRegisteredUsersMap(fetchedUsers);
    });
    return () => unsubscribe();
  }, []);

  const balances = calculateBalances(project);
  const simplifiedDebts = simplifyDebts(balances);

  const totalSpent = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const existingUsersList = Object.values(registeredUsersMap);

  const handleAddRegisteredMember = (user: any) => {
    const isAlreadyMember = project.members.some(m => m.email?.toLowerCase() === user.email.toLowerCase() || m.name.toLowerCase() === user.name.toLowerCase());
    if (isAlreadyMember) return;

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];
    const newPerson = {
      id: `m-${Date.now()}`,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
      color: colors[project.members.length % colors.length]
    };

    onUpdateProject({
      ...project,
      members: [...project.members, newPerson]
    });
  };

  const handleAddExpense = (newExp: any) => {
    const updated: SpendProject = {
      ...project,
      expenses: [newExp, ...project.expenses]
    };
    onUpdateProject(updated);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  const handleDeleteExpense = (expId: string) => {
    const updated: SpendProject = {
      ...project,
      expenses: project.expenses.filter(e => e.id !== expId)
    };
    onUpdateProject(updated);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];
    const newPerson = {
      id: `m-${Date.now()}`,
      name: newMemberName.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newMemberName.trim())}`,
      color: colors[project.members.length % colors.length]
    };

    onUpdateProject({
      ...project,
      members: [...project.members, newPerson]
    });

    setNewMemberName('');
    setIsAddingMember(false);
  };

  const handleRecordSettlement = (fromId: string, toId: string, amount: number) => {
    const newSettlement = {
      id: `settle-${Date.now()}`,
      fromPersonId: fromId,
      toPersonId: toId,
      amount,
      date: new Date().toISOString(),
      notes: 'Settled via Baaki'
    };

    onUpdateProject({
      ...project,
      settlements: [newSettlement, ...project.settlements]
    });

    confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 } });
  };

  const getMemberName = (id: string) => {
    return project.members.find(m => m.id === id)?.name || 'Unknown';
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Top Banner */}
      <div 
        style={{
          background: project.coverGradient,
          borderRadius: 'var(--radius-lg)',
          padding: '32px 28px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onBack}
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <ArrowLeft size={16} /> Back to Projects
          </button>

          {onDeleteProject && (
            <button 
              className="btn btn-secondary" 
              onClick={() => onDeleteProject(project.id)}
              style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5', backdropFilter: 'blur(8px)', borderColor: 'rgba(239,68,68,0.4)' }}
            >
              <Trash2 size={16} /> Delete Project
            </button>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: 'white' }}>
              {project.title}
            </h1>
            {project.description && (
              <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: '4px', fontSize: '1rem' }}>
                {project.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', color: 'white', backdropFilter: 'blur(4px)' }}>
                👥 {project.members.length} Members
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', color: 'white', backdropFilter: 'blur(4px)' }}>
                🧾 {project.expenses.length} Expenditures
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px 24px', borderRadius: 'var(--radius-md)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Total Spent</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
              {project.currency} {totalSpent.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Add Expense Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(30, 41, 59, 0.6)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          {[
            { id: 'expenses', label: 'Expenditures', icon: Receipt },
            { id: 'balances', label: 'Balances & Settle', icon: Scale },
            { id: 'members', label: 'Members', icon: Users },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button className="btn btn-emerald" onClick={() => setIsAddExpenseOpen(true)}>
          <Plus size={18} /> Add Expenditure
        </button>
      </div>

      {/* TAB 1: EXPENDITURES LIST */}
      {activeTab === 'expenses' && (
        <div>
          {project.expenses.length === 0 ? (
            <div className="card-glass" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
                <Receipt size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Expenditures Yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Start tracking by adding your first group expenditure.</p>
              <button className="btn btn-emerald" onClick={() => setIsAddExpenseOpen(true)}>
                <Plus size={18} /> Add First Expenditure
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {project.expenses.map(exp => {
                const payerName = getMemberName(exp.paidBy);
                const categoryIcon = CATEGORY_ICONS[exp.category] || '✨';

                return (
                  <div key={exp.id} className="card-glass" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid var(--border-light)' }}>
                        {categoryIcon}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{exp.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <span>Paid by <strong style={{ color: 'var(--text-main)' }}>{payerName}</strong></span>
                          <span>•</span>
                          <span>{new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          <span>•</span>
                          <span style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>{exp.splitType} Split</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)' }}>
                          {project.currency} {exp.amount.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                          Split among {exp.splits.length} {exp.splits.length === 1 ? 'person' : 'people'}
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDeleteExpense(exp.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                        title="Delete expense"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BALANCES & SMART SETTLEMENTS */}
      {activeTab === 'balances' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Individual Net Balances */}
          <div className="card-glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wallet size={20} color="var(--primary)" />
              Individual Net Status
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {balances.map(b => {
                const name = getMemberName(b.personId);
                const isOwed = b.balance > 0.01;
                const owes = b.balance < -0.01;

                return (
                  <div key={b.personId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                        {name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{name}</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {isOwed && (
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.95rem' }}>
                          gets back {project.currency}{b.balance.toFixed(2)}
                        </span>
                      )}
                      {owes && (
                        <span style={{ color: 'var(--accent-rose)', fontWeight: 700, fontSize: '0.95rem' }}>
                          owes {project.currency}{Math.abs(b.balance).toFixed(2)}
                        </span>
                      )}
                      {!isOwed && !owes && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                          settled up 👌
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simplified Debt Settlements */}
          <div className="card-glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="var(--accent-amber)" />
              Smart Debt Simplification
            </h3>

            {simplifiedDebts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={40} color="var(--accent-emerald)" style={{ marginBottom: '12px' }} />
                <p style={{ fontWeight: 600, color: 'white' }}>Everyone is fully settled up!</p>
                <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>No outstanding debts to clear.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {simplifiedDebts.map((debt, idx) => (
                  <div key={idx} style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ fontSize: '0.92rem' }}>
                      <strong style={{ color: 'var(--accent-rose)' }}>{getMemberName(debt.from)}</strong>
                      <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>pays</span>
                      <strong style={{ color: 'var(--accent-emerald)' }}>{getMemberName(debt.to)}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                        {project.currency}{debt.amount}
                      </span>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleRecordSettlement(debt.from, debt.to, debt.amount)}
                      >
                        Settle Up
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MEMBERS MANAGEMENT */}
      {activeTab === 'members' && (
        <div className="card-glass" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Project Members</h3>
            <button className="btn btn-sm btn-primary" onClick={() => setIsAddingMember(true)}>
              <UserPlus size={16} /> Add Member
            </button>
          </div>

          {isAddingMember && (
            <div style={{ marginBottom: '20px', background: 'rgba(15,23,42,0.6)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              {existingUsersList.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Quick Add Registered Users from Database:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {existingUsersList.map((user: any) => {
                      const isAlreadyMember = project.members.some(m => m.email?.toLowerCase() === user.email.toLowerCase() || m.name.toLowerCase() === user.name.toLowerCase());
                      return (
                        <button
                          type="button"
                          key={user.email}
                          onClick={() => handleAddRegisteredMember(user)}
                          disabled={isAlreadyMember}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: isAlreadyMember ? 'rgba(255,255,255,0.05)' : 'var(--primary-light)',
                            border: isAlreadyMember ? '1px solid var(--border-light)' : '1px solid var(--primary)',
                            color: isAlreadyMember ? 'var(--text-subtle)' : 'white',
                            cursor: isAlreadyMember ? 'default' : 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`} alt={user.name} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                          <span>{user.name}</span>
                          {isAlreadyMember ? <UserCheck size={14} /> : <Plus size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Or enter custom member name..."
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                />
                <button type="submit" className="btn btn-emerald">Add</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddingMember(false)}>Done</button>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {project.members.map(m => (
              <div key={m.id} style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img 
                  src={m.avatar} 
                  alt={m.name} 
                  style={{ width: '44px', height: '44px', borderRadius: '50%', background: m.color || 'var(--primary)' }} 
                />
                <div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{m.name}</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Member</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Modal Component */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        project={project}
        onClose={() => setIsAddExpenseOpen(false)}
        onAddExpense={handleAddExpense}
      />
    </div>
  );
};
