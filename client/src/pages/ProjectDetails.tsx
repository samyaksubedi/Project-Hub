import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Github,
  Pencil,
  Trash2,
  Code2,
} from 'lucide-react';
import { useState } from 'react';
import { api } from '../api';
import { useLoad } from '../hooks/useLoad';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { LikeButton } from '../components/LikeButton';
import { ErrorMessage, Loading } from '../components/Feedback';
import { RepositoryInfo } from '../components/RepositoryInfo';
export function ProjectDetails() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    data: project,
    loading,
    error,
  } = useLoad((signal) => api.project(id, signal), [id, user?.id]);
  const [selected, setSelected] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState('');
  async function remove() {
    setBusy(true);
    try {
      await api.deleteProject(id);
      navigate('/');
    } catch (e) {
      setMutationError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading label='Loading project…' />;
  if (error || !project)
    return (
      <div className='container page'>
        <ErrorMessage message={error || 'Project not found.'} />
        <Link to='/'>Back to discover</Link>
      </div>
    );
  return (
    <div className='container page detail-page'>
      <Link className='back-link' to='/'>
        <ArrowLeft size={16} />
        Back to discover
      </Link>
      <header className='project-heading'>
        <div>
          <span className='eyebrow'>
            {project.category} <span className='muted'>/</span> Semester{' '}
            {project.semester}
          </span>
          <h1>{project.title}</h1>
          <Link className='author' to={`/profile/${project.owner.username}`}>
            <Avatar user={project.owner} />
            <span>
              Built by <strong>{project.owner.name}</strong>
            </span>
          </Link>
        </div>
        <div className='project-heading-actions'>
          <LikeButton
            key={`${project.liked}-${project.likeCount}`}
            id={id}
            liked={project.liked}
            count={project.likeCount}
          />
          {user?.id === project.ownerId && (
            <>
              <Link className='button secondary' to={`/projects/${id}/edit`}>
                <Pencil size={15} />
                Edit project
              </Link>
              <button
                className='icon-button danger'
                aria-label='Delete project'
                onClick={() => setConfirm(true)}
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </header>
      <ErrorMessage message={mutationError} />
      {confirm && (
        <section className='confirm-box' role='alert'>
          <div>
            <strong>Delete “{project.title}”?</strong>
            <p>This removes the project and its likes permanently.</p>
          </div>
          <button
            className='button secondary'
            disabled={busy}
            onClick={() => setConfirm(false)}
          >
            Keep project
          </button>
          <button
            className='button danger-solid'
            disabled={busy}
            onClick={() => void remove()}
          >
            {busy ? 'Deleting…' : 'Delete project'}
          </button>
        </section>
      )}
      <div className='detail-grid'>
        <div className='detail-main'>
          {project.screenshots.length > 0 ? (
            <div className='gallery'>
              <img
                className='main-screenshot'
                src={
                  (project.screenshots[selected] || project.screenshots[0]).url
                }
                alt={`${project.title} screenshot ${selected + 1}`}
              />
              {project.screenshots.length > 1 && (
                <div className='thumbnails'>
                  {project.screenshots.map((s, i) => (
                    <button
                      key={s.id}
                      className={i === selected ? 'selected' : ''}
                      onClick={() => setSelected(i)}
                      aria-label={`Show screenshot ${i + 1}`}
                      aria-pressed={i === selected}
                    >
                      <img src={s.url} alt='' />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`detail-cover tone-${project.semester % 4}`}>
              <Code2 size={45} />
              <span>{project.title}</span>
              <small>
                Built with{' '}
                {project.technologies.map((t) => t.name).join(' + ') ||
                  'curiosity'}
              </small>
            </div>
          )}
          <section className='description-section'>
            <h2>About this project</h2>
            <p className='project-description'>{project.description}</p>
          </section>
          <section className='team-section'>
            <h2>The people behind it</h2>
            <div className='team-list'>
              {[project.owner, ...project.members.map((m) => m.user)].map(
                (member) => (
                  <Link
                    key={member.id}
                    to={`/profile/${member.username}`}
                    className='team-member'
                  >
                    <Avatar user={member} />
                    <span>
                      <strong>{member.name}</strong>
                      <small>
                        {member.id === project.ownerId
                          ? 'Project owner'
                          : 'Team member'}
                      </small>
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                ),
              )}
            </div>
          </section>
        </div>
        <aside className='detail-sidebar'>
          <div className='project-links'>
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target='_blank'
                rel='noreferrer'
                className='button primary full-width'
              >
                Visit live project
                <ArrowUpRight size={18} />
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target='_blank'
                rel='noreferrer'
                className='button secondary full-width'
              >
                <Github size={18} />
                View source code
                <ArrowUpRight size={16} />
              </a>
            )}
          </div>
          <section>
            <span className='section-kicker'>Built with</span>
            <div className='tags large-tags'>
              {project.technologies.length ? (
                project.technologies.map((t) => (
                  <Link
                    key={t.id}
                    to={`/?technology=${encodeURIComponent(t.name)}`}
                  >
                    {t.name}
                  </Link>
                ))
              ) : (
                <span>No technologies listed</span>
              )}
            </div>
          </section>
          <section className='project-meta'>
            <span className='section-kicker'>Project details</span>
            <dl>
              <dt>Category</dt>
              <dd>{project.category}</dd>
              <dt>Semester</dt>
              <dd>{project.semester}</dd>
              <dt>Published</dt>
              <dd>
                {new Date(project.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </dd>
            </dl>
          </section>
          {project.githubUrl && <RepositoryInfo url={project.githubUrl} />}
        </aside>
      </div>
    </div>
  );
}
