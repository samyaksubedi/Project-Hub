import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock3, Search, SlidersHorizontal, TrendingUp, X } from 'lucide-react';
import { api } from '../api';
import { categories } from '../types';
import { useLoad } from '../hooks/useLoad';
import { useAuth } from '../hooks/useAuth';
import { ProjectCard } from '../components/ProjectCard';
import { Empty, ErrorMessage } from '../components/Feedback';
import { Pagination } from '../components/Pagination';

export function Discover() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const { user } = useAuth();
  const query = params.toString();
  const { data, error, loading, reload } = useLoad(
    (signal) => api.projects(new URLSearchParams(query), signal),
    [query, user?.id],
  );
  const options = useLoad((signal) => api.options(signal), []);

  useEffect(() => setSearch(params.get('search') || ''), [query]);

  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }

  const category = params.get('category') || '';
  const sort = params.get('sort') || 'recent';
  const filtered = ['search', 'category', 'technology', 'semester'].some(
    (key) => params.has(key),
  );

  return (
    <div className='discover-layout container'>
      <header className='discover-intro'>
        <div className='intro-copy'>
          <h1>Discover what students are building.</h1>
          <p>Projects, demos, and source code from student builders.</p>
        </div>
      </header>

      <form
        className='search-box'
        onSubmit={(event) => {
          event.preventDefault();
          change('search', search.trim());
        }}
      >
        <Search size={21} />
        <input
          aria-label='Search projects'
          placeholder='Search by project, idea, or technology'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {search && (
          <button
            type='button'
            className='icon-button'
            aria-label='Clear search'
            onClick={() => {
              setSearch('');
              change('search', '');
            }}
          >
            <X size={17} />
          </button>
        )}
        <button type='submit' className='search-submit'>
          Search <span aria-hidden='true'>↵</span>
        </button>
      </form>

      <nav className='category-strip' aria-label='Project categories'>
        <button
          className={!category ? 'active' : ''}
          aria-pressed={!category}
          onClick={() => change('category', '')}
        >
          All
        </button>
        {categories.map((name) => (
          <button
            key={name}
            className={category === name ? 'active' : ''}
            aria-pressed={category === name}
            onClick={() => change('category', name)}
          >
            {name.replace(' / Machine Learning', '')}
          </button>
        ))}
      </nav>

      <div className='mobile-categories'>
        <select
          aria-label='Category'
          value={category}
          onChange={(event) => change('category', event.target.value)}
        >
          <option value=''>All categories</option>
          {categories.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className='discovery-toolbar'>
        <div className='sort-tabs' aria-label='Sort projects'>
          <button
            className={sort === 'recent' ? 'selected' : ''}
            aria-pressed={sort === 'recent'}
            onClick={() => change('sort', 'recent')}
          >
            <Clock3 size={15} /> Newest
          </button>
          <button
            className={sort === 'popular' ? 'selected' : ''}
            aria-pressed={sort === 'popular'}
            onClick={() => change('sort', 'popular')}
          >
            <TrendingUp size={15} /> Most liked
          </button>
        </div>
        <div className='filter-controls'>
          <SlidersHorizontal size={16} aria-hidden='true' />
          <select
            aria-label='Technology filter'
            value={params.get('technology') || ''}
            onChange={(event) => change('technology', event.target.value)}
          >
            <option value=''>Any technology</option>
            {options.data?.technologies.map((technology) => (
              <option key={technology.name}>{technology.name}</option>
            ))}
          </select>
          <select
            aria-label='Semester filter'
            value={params.get('semester') || ''}
            onChange={(event) => change('semester', event.target.value)}
          >
            <option value=''>Any semester</option>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index} value={index + 1}>
                Semester {index + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='results-heading'>
        <h2>
          {category || (sort === 'popular' ? 'Most liked' : 'Latest work')}
          {data && <span>{data.total}</span>}
        </h2>
        {filtered && (
          <button
            className='text-button'
            onClick={() => {
              setSearch('');
              setParams({});
            }}
          >
            Clear filters <X size={14} />
          </button>
        )}
      </div>

      {error ? (
        <div className='request-state'>
          <ErrorMessage message={error} />
          <button className='button secondary' onClick={reload}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div
          className='project-grid'
          aria-label='Loading projects'
          aria-busy='true'
        >
          {[1, 2, 3, 4, 5, 6].map((number) => (
            <div className='skeleton-card' key={number}>
              <div />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : data?.items.length ? (
        <>
          <div className='project-grid'>
            {data.items.map((project) => (
              <ProjectCard
                key={`${project.id}-${user?.id || 'guest'}`}
                project={project}
              />
            ))}
          </div>
          <Pagination
            page={data.page}
            pages={data.pages}
            onChange={(page) => {
              change('page', String(page));
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
          />
        </>
      ) : (
        <Empty
          title={
            filtered
              ? 'No projects match this search.'
              : 'Every community starts with one project.'
          }
          description={
            filtered
              ? 'Try a broader search or remove a filter.'
              : 'Share the first project.'
          }
          create={!filtered}
        />
      )}
    </div>
  );
}
