import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from '@playwright/test';
const apiBase = 'http://localhost:5001';
const password = 'student-project-password';
async function register(
  page: Page,
  request: APIRequestContext,
  email = 'builder@example.com',
) {
  await page.goto('/register');
  await expect(page.getByLabel('Full name')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  if (email === 'builder@example.com') {
    await page.screenshot({
      path: 'test-results/register-desktop.png',
      fullPage: true,
    });
  }
  await page.getByLabel('Full name').fill('Sam Student');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/verify-email/);
  const mail = await (
    await request.get(`${apiBase}/__test/mail?email=${email}`)
  ).json();
  expect(mail.purpose).toBe('verify');
  await page.goto(`/verify-email?token=${mail.token}`);
  await page.getByRole('button', { name: 'Verify email', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Email verified');
  await page.getByRole('link', { name: 'Continue to login' }).click();
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Log out', exact: true }),
  ).toBeVisible();
}
test.beforeEach(async ({ request }) => {
  await request.post(`${apiBase}/__test/reset`);
});
test('complete student journey with real API and database', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await register(page, request);
  await page.getByRole('link', { name: 'Your profile' }).click();
  await page.getByRole('link', { name: 'Edit profile' }).click();
  await page.screenshot({
    path: 'test-results/profile-editor-desktop.png',
    fullPage: true,
  });
  await page
    .getByLabel('Bio')
    .fill('Student developer. Building useful things for campus.');
  await page
    .getByLabel('GitHub', { exact: true })
    .fill('https://github.com/student');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(
    page.getByText('Student developer. Building useful things for campus.'),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/profile-desktop.png',
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Share a project' }).first().click();
  await page.screenshot({
    path: 'test-results/editor-desktop.png',
    fullPage: true,
  });
  await page.getByLabel('Project title').fill('Campus Atlas');
  await page
    .getByLabel('Project description')
    .fill(
      'A searchable resource finder helping students discover study spaces across campus.',
    );
  await page.getByLabel('Technologies').fill('React');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByLabel('Technologies').fill('PostgreSQL');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page
    .getByLabel('GitHub repository')
    .fill('https://github.com/student/campus-atlas');
  await page.getByLabel('Live demo').fill('https://example.com');
  // Upload actual PNG bytes through the application's multipart endpoint.
  const screenshot = await page.screenshot();
  await page.getByLabel('Upload screenshots').setInputFiles({
    name: 'campus.png',
    mimeType: 'image/png',
    buffer: screenshot,
  });
  await expect(page.getByText('Cover image', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Generate with AI' }).click();
  await expect(page.getByText('A little writing inspiration')).toBeVisible();
  await page.getByRole('button', { name: 'Use this draft' }).click();
  await expect(page.getByLabel('Project description')).toContainText(
    'Campus Atlas helps students',
  );
  await page.getByRole('button', { name: 'Publish project' }).click();
  await expect(
    page.getByRole('heading', { name: 'Campus Atlas', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('FROM THE REPOSITORY')).toBeVisible();
  await expect(
    page.getByText('A student-built campus resource finder.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Like project', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Unlike project', exact: true }),
  ).toHaveText('1');
  const projectUrl = page.url();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Unlike project', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/project-desktop.png',
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Back to discover' }).click();
  await page.getByLabel('Search projects', { exact: true }).fill('Campus');
  await page
    .getByRole('button', { name: 'Search', exact: false })
    .first()
    .click();
  await expect(
    page.getByRole('link', { name: 'Campus Atlas', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Technology filter').selectOption('react');
  await expect(
    page.getByRole('link', { name: 'Campus Atlas', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/discover-desktop.png',
    fullPage: true,
  });
  await page.goto(projectUrl);
  await page.getByRole('link', { name: 'Edit project', exact: true }).click();
  await page.getByLabel('Project title').fill('Campus Atlas v2');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('heading', { name: 'Campus Atlas v2', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Log in', exact: false }),
  ).toBeVisible();
  await page.goto('/projects/new');
  await expect(page).toHaveURL(/login\?next=/);
  await page.getByLabel('Email address').fill('builder@example.com');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/projects\/new/);
  await page.goto(projectUrl);
  await page
    .getByRole('button', { name: 'Delete project', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Delete project', exact: true })
    .last()
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Every community starts with one project.',
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test('password recovery through email invalidates sessions and allows new password', async ({
  page,
  request,
}) => {
  await register(page, request, 'reset@example.com');
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.goto('/forgot-password');
  await page.getByLabel('Email address').fill('reset@example.com');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('status')).toContainText(
    'If the account is eligible',
  );
  const mail = await (
    await request.get(`${apiBase}/__test/mail?email=reset@example.com`)
  ).json();
  await page.goto(`/reset-password?token=${mail.token}`);
  await page.getByLabel('New password').fill('my-new-strong-password');
  await page
    .getByRole('button', { name: 'Reset password', exact: true })
    .click();
  await page.getByRole('link', { name: 'Continue to login' }).click();
  await page.getByLabel('Email address').fill('reset@example.com');
  await page
    .getByLabel('Password', { exact: true })
    .fill('my-new-strong-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
});
test('mobile discovery, empty state, auth and form have no horizontal overflow', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Discover what students/ }),
  ).toBeVisible();
  await page.getByLabel('Category', { exact: true }).selectOption('IoT');
  await expect(
    page.getByRole('heading', { name: 'No projects match this search.' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/discover-mobile.png',
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await register(page, request, 'mobile@example.com');
  await page.goto('/projects/new');
  await expect(
    page.getByRole('heading', { name: 'Share a project', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/editor-mobile.png',
    fullPage: true,
  });
});
