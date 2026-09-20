import { GitFork, Github, Star } from 'lucide-react';
import { api } from '../api';
import { useLoad } from '../hooks/useLoad';

export function RepositoryInfo({ url }: { url: string }) {
  const { data, error, loading } = useLoad((signal) => api.github(url, signal), [url]);
  if (loading) return <section className='repository'><span className='section-kicker'>Repository</span><small>Loading repository details…</small></section>;
  if (error || !data) return null;
  return <section className='repository'><span className='section-kicker'><Github size={15} /> Repository</span><a className='repo-name' href={data.url} target='_blank' rel='noreferrer'>{data.name}</a>{data.description && <p>{data.description}</p>}<div className='repo-stats'><span><Star size={13} /> {data.stars}</span><span><GitFork size={13} /> {data.forks}</span>{data.language && <span><i className='language-dot' /> {data.language}</span>}</div><small>Updated {new Date(data.updatedAt).toLocaleDateString()}</small></section>;
}
