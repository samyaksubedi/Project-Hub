import { test, expect } from '@playwright/test';
import { categories, type Project, type User } from '../src/types';

test('populated gallery and editor fit phone, tablet, and desktop', async ({
  page,
}) => {
  const user: User = {
    id: 'layout-user',
    username: 'student',
    name: 'Sam Student',
    bio: '',
    avatarUrl: null,
    githubUrl: null,
    linkedinUrl: null,
    portfolioUrl: null,
    createdAt: '2026-01-01',
    emailVerified: true,
  };
  const projects: Project[] = Array.from({ length: 6 }, (_, i) => ({
    id: `layout-${i}`,
    title: [
      'Campus Atlas',
      'Accessible learning tools for university students',
      'Community garden',
      'Student research library',
      'Open course planner',
      'Robotics lab',
    ][i],
    description:
      'A student-built project exploring practical tools for the campus community. Includes source code, documentation, and a working demonstration.',
    category: categories[i],
    semester: i + 1,
    githubUrl: null,
    demoUrl: null,
    ownerId: user.id,
    owner: user,
    technologies: [{ id: 'react', name: 'React' }],
    screenshots: [],
    members: [],
    likeCount: 0,
    liked: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }));
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown;
    if (path.endsWith('/auth/refresh'))
      data = { user, accessToken: 'layout-test' };
    else if (path.endsWith('/projects/options'))
      data = { categories, technologies: [{ name: 'React' }] };
    else if (path.endsWith('/projects/layout-1')) data = projects[1];
    else if (path.endsWith('/users/student'))
      data = { ...user, projectCount: 6, likesReceived: 0 };
    else if (path.endsWith('/projects'))
      data = { items: projects, total: 6, page: 1, pages: 1 };
    else throw new Error(`Unexpected layout request: ${path}`);
    await route.fulfill({ json: { success: true, data } });
  });
  for (const width of [360, 600, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.locator('.project-card')).toHaveCount(6);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const cards = await page.locator('.project-card').evaluateAll((elements) =>
      elements.map((e) => {
        const rect = e.getBoundingClientRect();
        return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
      }),
    );
    for (let i = 1; i < cards.length; i++) {
      expect(
        cards[i].y >= cards[i - 1].bottom - 1 ||
          cards[i].x >= cards[i - 1].right - 1,
      ).toBe(true);
    }
    await page.screenshot({
      path: `test-results/gallery-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole('link', { name: 'Share a project', exact: true })
      .click();
    await expect(page.getByLabel('Project title')).toBeVisible();
    if (width === 1440) {
      await page.getByLabel('Project title').fill('Library Seat Finder');
      await page
        .getByLabel('Project description')
        .fill(
          'Shows students which library areas have open seats before they walk across campus.',
        );
      await expect(page.locator('.project-preview')).toContainText(
        'Library Seat Finder',
      );
      await expect(page.locator('.project-preview')).toContainText(
        'Shows students which library areas have open seats',
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/form-${width}.png`,
      fullPage: true,
    });
    for (const [path, heading, name] of [
      ['/projects/layout-1', projects[1].title, 'details'],
      ['/profile/student', user.name, 'profile'],
      ['/profile/edit', 'Edit profile', 'profile-edit'],
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole('heading', { name: heading, exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width === 360 || width === 1440) {
        await page.screenshot({
          path: `test-results/${name}-${width}.png`,
          fullPage: true,
        });
      }
    }
  }
});
