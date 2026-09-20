import { ArrowUpRight, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { Avatar } from './Avatar';
import { LikeButton } from './LikeButton';

export function ProjectCard({ project }: { project: Project }) {
  const image = project.screenshots[0];
  return (
    <article className='project-card'>
      <Link className={`project-cover tone-${project.semester % 4}`} to={`/projects/${project.id}`}>
        {image ? (
          <img src={image.url} alt={`${project.title} preview`} />
        ) : (
          <div className='project-monogram'>
            <Code2 size={32} />
            <span>{project.title}</span>
          </div>
        )}
        <span className='cover-open' aria-hidden='true'><ArrowUpRight size={19} /></span>
      </Link>
      <div className='project-card-body'>
        <div className='card-eyebrow'>
          <span>{project.category}</span>
          <span>Semester {project.semester}</span>
        </div>
        <Link className='project-title' to={`/projects/${project.id}`}>{project.title}</Link>
        <p>{project.description}</p>
        <div className='tags'>
          {project.technologies.slice(0, 4).map((technology) => <span key={technology.id}>{technology.name}</span>)}
        </div>
        <div className='card-footer'>
          <Link className='author' to={`/profile/${project.owner.username}`}><Avatar user={project.owner} /><span>{project.owner.name}</span></Link>
          <LikeButton id={project.id} liked={project.liked} count={project.likeCount} />
        </div>
      </div>
    </article>
  );
}
