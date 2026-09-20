import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Github,
  Linkedin,
  Globe,
  Pencil,
  ArrowLeft,
  ArrowUpRight,
  Heart,
  Folder,
} from 'lucide-react';
import { api } from '../api';
import { useLoad } from '../hooks/useLoad';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { ErrorMessage, Empty, Loading } from '../components/Feedback';
import { ProjectCard } from '../components/ProjectCard';
import { Pagination } from '../components/Pagination';
export function Profile() {
  const { username = '' } = useParams();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const profile = useLoad(
    (signal) => api.profile(username, signal),
    [username],
  );
  const projects = useLoad(
    (signal) =>
      api.projects(
        new URLSearchParams({ owner: username, page: String(page) }),
        signal,
      ),
    [username, page, user?.id],
  );
  if (profile.loading) return <Loading label='Loading student profile…' />;
  if (profile.error || !profile.data)
    return (
      <div className='container page'>
        <ErrorMessage message={profile.error || 'Student not found.'} />
      </div>
    );
  const person = profile.data;
  return (
    <div className='container page profile-page'>
      <Link className='back-link' to='/'>
        <ArrowLeft size={16} />
        Back to discover
      </Link>
      <div className='profile-banner' />
      <section className='profile-header'>
        <Avatar user={person} size='large' />
        <div className='profile-actions'>
          {user?.id === person.id && (
            <Link to='/profile/edit' className='button secondary'>
              <Pencil size={15} />
              Edit profile
            </Link>
          )}
        </div>
        <h1>{person.name}</h1>
        {person.bio && <p className='profile-bio'>{person.bio}</p>}
        <div className='profile-links'>
          {person.githubUrl && (
            <a href={person.githubUrl} target='_blank' rel='noreferrer'>
              <Github size={17} />
              GitHub
              <ArrowUpRight size={13} />
            </a>
          )}
          {person.linkedinUrl && (
            <a href={person.linkedinUrl} target='_blank' rel='noreferrer'>
              <Linkedin size={17} />
              LinkedIn
              <ArrowUpRight size={13} />
            </a>
          )}
          {person.portfolioUrl && (
            <a href={person.portfolioUrl} target='_blank' rel='noreferrer'>
              <Globe size={17} />
              Portfolio
              <ArrowUpRight size={13} />
            </a>
          )}
        </div>
        <div className='profile-stats'>
          <span>
            <Folder size={16} />
            <strong>{person.projectCount}</strong> projects
          </span>
          <span>
            <Heart size={16} />
            <strong>{person.likesReceived}</strong> likes received
          </span>
          <span>
            Joined{' '}
            {new Date(person.createdAt).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </section>
      <div className='results-heading'>
        <h2>
          Projects <span>{person.projectCount}</span>
        </h2>
      </div>
      {projects.error ? (
        <ErrorMessage message={projects.error} />
      ) : projects.loading ? (
        <Loading label='Loading projects…' />
      ) : projects.data?.items.length ? (
        <>
          <div className='project-grid'>
            {projects.data.items.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          <Pagination
            page={page}
            pages={projects.data.pages}
            onChange={setPage}
          />
        </>
      ) : (
        <Empty
          title='No projects yet.'
          description='Published projects will appear here.'
          create={user?.id === person.id}
        />
      )}
    </div>
  );
}
export function ProfileEditor() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    try {
      const updated = await api.saveProfile(data);
      updateUser({ ...user!, ...updated });
      navigate(`/profile/${updated.username}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className='container page profile-editor'>
      <Link className='back-link' to={`/profile/${user!.username}`}>
        <ArrowLeft size={16} />
        Back to profile
      </Link>
      <div className='page-heading'>
        <h1>Edit profile</h1>
        <p>Update the information shown on your public profile.</p>
      </div>
      <form
        className='form-stack form-section'
        onSubmit={(e) => void submit(e)}
      >
        <Avatar user={user!} size='large' />
        <label>
          Full name
          <input
            name='name'
            defaultValue={user!.name}
            required
            minLength={2}
            maxLength={80}
            autoComplete='name'
          />
        </label>
        <label>
          Bio
          <textarea
            name='bio'
            defaultValue={user!.bio}
            maxLength={500}
            rows={4}
            placeholder='What do you like to build? What are you learning?'
          />
        </label>
        <label>
          Avatar URL <span className='optional'>optional</span>
          <input
            name='avatarUrl'
            type='url'
            defaultValue={user!.avatarUrl || ''}
            placeholder='https://example.com/your-photo.jpg'
            maxLength={2048}
          />
        </label>
        <label>
          GitHub
          <input
            name='githubUrl'
            type='url'
            defaultValue={user!.githubUrl || ''}
            placeholder='https://github.com/you'
            maxLength={2048}
          />
        </label>
        <label>
          LinkedIn
          <input
            name='linkedinUrl'
            type='url'
            defaultValue={user!.linkedinUrl || ''}
            placeholder='https://linkedin.com/in/you'
            maxLength={2048}
          />
        </label>
        <label>
          Portfolio
          <input
            name='portfolioUrl'
            type='url'
            defaultValue={user!.portfolioUrl || ''}
            placeholder='https://your-site.com'
            maxLength={2048}
          />
        </label>
        <ErrorMessage message={error} />
        <div className='editor-submit'>
          <Link className='button secondary' to={`/profile/${user!.username}`}>
            Cancel
          </Link>
          <button className='button primary' disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
            <ArrowUpRight size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
