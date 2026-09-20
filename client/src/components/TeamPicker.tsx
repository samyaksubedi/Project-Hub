import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api';
import type { User } from '../types';
import { Avatar } from './Avatar';

export function TeamPicker({ members, onChange, ownerId }: { members: User[]; onChange: (members: User[]) => void; ownerId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const controller = new AbortController();
    void api.users(query.trim(), controller.signal).then((users) => {
      if (!controller.signal.aborted) setResults(users.filter((user) => user.id !== ownerId && !members.some((member) => member.id === user.id)));
    }).catch(() => { if (!controller.signal.aborted) setResults([]); });
    return () => controller.abort();
  }, [query, ownerId, members]);
  return <div className='team-picker'>
    <label>Team members <span className='optional'>optional</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search students by name or username' maxLength={80} /></label>
    {query.trim().length >= 2 && <div className='team-results'>{results.length ? results.map((user) => <button type='button' key={user.id} onClick={() => { onChange([...members, user]); setQuery(''); }}><Avatar user={user} /><span>{user.name}<small>@{user.username}</small></span><small>Add</small></button>) : <p>No students found.</p>}</div>}
    {members.length > 0 && <div className='selected-members'>{members.map((member) => <span key={member.id}>{member.name}<button type='button' aria-label={`Remove ${member.name}`} onClick={() => onChange(members.filter((user) => user.id !== member.id))}><X size={13} /></button></span>)}</div>}
  </div>;
}
