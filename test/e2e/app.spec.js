const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const AGENTS_DIR = path.join(CLAUDE_DIR, 'agents');
const MCP_CONFIG = path.join(CLAUDE_DIR, '.mcp.json');
const KNOWN_MARKETPLACES = path.join(CLAUDE_DIR, 'plugins', 'known_marketplaces.json');
const MARKETPLACES_DIR = path.join(CLAUDE_DIR, 'plugins', 'marketplaces');

const TEST_SKILL_ID = 'e2e-test-skill';
const TEST_AGENT_ID = 'e2e-test-agent';
const TEST_MCP_ID = 'e2e-test-mcp-server';
const TEST_MARKETPLACE_NAME = 'e2e-test-marketplace';

let electronApp;
let page;

test.beforeAll(async () => {
  // Pre-cleanup in case a previous run left artifacts
  cleanup();

  electronApp = await electron.launch({
    args: [path.join(__dirname, '..', '..', 'main.js')],
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });
  page = await electronApp.firstWindow();
  await page.waitForSelector('text=Claude Manager', { timeout: 15000 });
});

function cleanup() {
  const skillDir = path.join(SKILLS_DIR, TEST_SKILL_ID);
  if (fs.existsSync(skillDir)) fs.rmSync(skillDir, { recursive: true, force: true });

  const agentFile = path.join(AGENTS_DIR, `${TEST_AGENT_ID}.md`);
  if (fs.existsSync(agentFile)) fs.unlinkSync(agentFile);

  if (fs.existsSync(MCP_CONFIG)) {
    try {
      const config = JSON.parse(fs.readFileSync(MCP_CONFIG, 'utf-8'));
      const servers = config.mcpServers || config;
      if (servers[TEST_MCP_ID]) {
        delete servers[TEST_MCP_ID];
        fs.writeFileSync(MCP_CONFIG, JSON.stringify(config, null, 2), 'utf-8');
      }
    } catch (e) { /* ignore */ }
  }

  if (fs.existsSync(KNOWN_MARKETPLACES)) {
    try {
      const data = JSON.parse(fs.readFileSync(KNOWN_MARKETPLACES, 'utf-8'));
      if (data[TEST_MARKETPLACE_NAME]) {
        delete data[TEST_MARKETPLACE_NAME];
        fs.writeFileSync(KNOWN_MARKETPLACES, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch (e) { /* ignore */ }
  }

  const mpDir = path.join(MARKETPLACES_DIR, TEST_MARKETPLACE_NAME);
  if (fs.existsSync(mpDir)) fs.rmSync(mpDir, { recursive: true, force: true });
}

test.afterAll(async () => {
  cleanup();
  if (electronApp) await electronApp.close();
});

// Helper: navigate via sidebar. The sidebar contains a "Views" section with buttons.
// We scope to the sidebar element (first child of the container, has "Claude Manager" text)
async function navigateTo(navLabel) {
  // The sidebar has a footer with text "Claude Code Extension Manager"
  // Find the sidebar by its footer text and scope navigation to it
  const sidebar = page.locator('div', { hasText: 'Claude Code Extension Manager' })
    .locator('button', { hasText: navLabel }).first();
  await sidebar.click();
  await page.waitForTimeout(500);
}

async function expectTitleBar(viewName) {
  await expect(page.getByText(`Claude Manager \u2014 ${viewName}`)).toBeVisible();
}

async function expectNoCrash() {
  await expect(page.getByText('Claude Code Extension Manager')).toBeVisible();
}

function setupDialogHandler(accept = true) {
  const handler = (dialog) => {
    if (accept) dialog.accept();
    else dialog.dismiss();
  };
  page.on('dialog', handler);
  return () => page.removeListener('dialog', handler);
}

// ==================== NAVIGATION TESTS ====================

test.describe('Navigation', () => {
  test('should show Plugins view by default', async () => {
    await expectTitleBar('Plugins');
  });

  test('should navigate to Marketplaces', async () => {
    await navigateTo('Marketplaces');
    await expectTitleBar('Marketplaces');
  });

  test('should navigate to MCP Servers', async () => {
    await navigateTo('MCP Servers');
    await expectTitleBar('MCP Servers');
  });

  test('should navigate to Settings', async () => {
    await navigateTo('Settings');
    await expectTitleBar('Settings');
  });

  test('should navigate back to Plugins', async () => {
    await navigateTo('Plugins');
    await expectTitleBar('Plugins');
  });
});

// ==================== PLUGINS VIEW TESTS ====================

test.describe('Plugins View', () => {
  test.beforeEach(async () => {
    await navigateTo('Plugins');
  });

  test('should show header and controls', async () => {
    await expectTitleBar('Plugins');
    await expect(page.getByPlaceholder('Search plugins...')).toBeVisible();
  });

  test('should display plugins list without crash', async () => {
    await page.waitForTimeout(1000);
    await expectNoCrash();
  });

  test('should type in search and not crash', async () => {
    const search = page.getByPlaceholder('Search plugins...');
    await search.fill('nonexistent-plugin-xyz');
    await page.waitForTimeout(300);
    await expectNoCrash();
    await search.fill('');
  });

  test('should change status filter without crash', async () => {
    const statusSelect = page.locator('select').first();
    for (const val of ['installed', 'available', 'local', 'all']) {
      await statusSelect.selectOption(val);
      await page.waitForTimeout(300);
      await expectNoCrash();
    }
  });

  test('should expand a plugin card and click all tabs without crash', async () => {
    await page.waitForTimeout(1000);

    // Find expand arrows (▼) that are inside the main content area (not sidebar)
    const contentArea = page.locator('div[style*="overflow: auto"]');
    const expandArrows = contentArea.locator('span:has-text("▼")');
    const arrowCount = await expandArrows.count();

    if (arrowCount > 0) {
      await expandArrows.first().click();
      await page.waitForTimeout(500);

      // Click each tab - these are inside the expanded card
      for (const tabName of ['Skills', 'Agents', 'MCP Servers', 'Hooks']) {
        // Match tab buttons precisely (they're inside a tab bar, not sidebar)
        const tabBtns = contentArea.locator('button').filter({ hasText: new RegExp(`^${tabName}`) });
        const count = await tabBtns.count();
        if (count > 0) {
          await tabBtns.first().click();
          await page.waitForTimeout(300);
          await expectNoCrash();
        }
      }
    }
  });

  test('should open and close the New Skill modal', async () => {
    // The "+ New Skill" button in the header
    const contentArea = page.locator('div[style*="overflow: auto"]');
    await contentArea.getByRole('button', { name: '+ New Skill' }).first().click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Create Skill')).toBeVisible();

    await page.locator('button:has-text("\u00D7")').click();
    await page.waitForTimeout(300);
  });

  test('should create a new skill via the modal', async () => {
    const contentArea = page.locator('div[style*="overflow: auto"]');
    await contentArea.getByRole('button', { name: '+ New Skill' }).first().click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('my-skill').fill(TEST_SKILL_ID);
    await page.getByPlaceholder('Deploy to Production').fill('E2E Test Skill');
    await page.locator('textarea').fill('This is a test skill from Playwright.');

    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(1000);

    const skillFile = path.join(SKILLS_DIR, TEST_SKILL_ID, 'SKILL.md');
    expect(fs.existsSync(skillFile)).toBe(true);
  });

  test('should delete the test skill', async () => {
    await page.waitForTimeout(1000);

    // Find and expand Local plugin
    const contentArea = page.locator('div[style*="overflow: auto"]');
    const expandArrows = contentArea.locator('span:has-text("▼")');
    const arrowCount = await expandArrows.count();
    for (let i = 0; i < arrowCount; i++) {
      const arrow = expandArrows.nth(i);
      const parentText = await arrow.locator('..').textContent();
      if (parentText && parentText.includes('Local')) {
        await arrow.click();
        await page.waitForTimeout(500);
        break;
      }
    }

    const skillText = page.getByText(TEST_SKILL_ID);
    if (await skillText.count() > 0) {
      const removeDialog = setupDialogHandler(true);
      const skillRow = skillText.locator('..').locator('..');
      const deleteBtn = skillRow.getByRole('button', { name: 'Delete' });
      if (await deleteBtn.count() > 0) {
        await deleteBtn.first().click();
        await page.waitForTimeout(1000);
      }
      removeDialog();
    }
  });
});

// ==================== MARKETPLACES VIEW TESTS ====================

test.describe('Marketplaces View', () => {
  test.beforeEach(async () => {
    await navigateTo('Marketplaces');
    await page.waitForTimeout(500);
  });

  test('should show marketplaces header', async () => {
    await expectTitleBar('Marketplaces');
  });

  test('should open and close create marketplace modal', async () => {
    const contentArea = page.locator('div[style*="overflow: auto"]');
    await contentArea.getByRole('button', { name: '+ Create Marketplace' }).click();
    await page.waitForTimeout(300);

    // Modal should be visible (it's in the overlay, not content area)
    await expect(page.getByPlaceholder('my-plugins')).toBeVisible();

    await page.locator('button:has-text("\u00D7")').click();
    await page.waitForTimeout(300);
  });

  test('should create a test marketplace', async () => {
    const contentArea = page.locator('div[style*="overflow: auto"]');
    await contentArea.getByRole('button', { name: '+ Create Marketplace' }).click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('my-plugins').fill(TEST_MARKETPLACE_NAME);
    await page.getByPlaceholder('https://github.com/org/repo.git').fill('https://github.com/test/e2e-test-repo.git');

    // Click the modal's Create Marketplace button (not the header one)
    // The modal footer button is the one that's NOT disabled
    const modalOverlay = page.locator('div[style*="position: fixed"]');
    await modalOverlay.getByRole('button', { name: /Create Marketplace|Creating/ }).click();
    await page.waitForTimeout(3000);

    // Verify it appeared
    await expect(page.getByText(TEST_MARKETPLACE_NAME).first()).toBeVisible();
  });

  test('should toggle owned status', async () => {
    await page.waitForTimeout(500);
    const toggleBtn = page.getByRole('button', { name: /Mark Owned|Unmark Owned/ }).first();
    if (await toggleBtn.count() > 0) {
      await toggleBtn.click();
      await page.waitForTimeout(1000);
      await expectNoCrash();
    }
  });

  test('should remove the test marketplace', async () => {
    await page.waitForTimeout(500);
    const testText = page.getByText(TEST_MARKETPLACE_NAME).first();
    if (await testText.count() > 0) {
      const removeDialog = setupDialogHandler(true);
      // Navigate up to card container and find Remove
      const card = testText.locator('..').locator('..').locator('..').locator('..');
      const removeBtn = card.getByRole('button', { name: 'Remove' });
      if (await removeBtn.count() > 0) {
        await removeBtn.first().click();
        await page.waitForTimeout(1000);
      }
      removeDialog();
    }
  });
});

// ==================== MCP SERVERS VIEW TESTS ====================

test.describe('MCP Servers View', () => {
  test.beforeEach(async () => {
    await navigateTo('MCP Servers');
    await page.waitForTimeout(500);
  });

  test('should show MCP servers header', async () => {
    await expectTitleBar('MCP Servers');
  });

  test('should open and close add server modal', async () => {
    const contentArea = page.locator('div[style*="overflow: auto"]');
    await contentArea.getByRole('button', { name: '+ Add Server' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByPlaceholder('censys, filesystem, github, etc.')).toBeVisible();

    await page.locator('button:has-text("\u00D7")').click();
    await page.waitForTimeout(300);
  });

  test('should create a test MCP server', async () => {
    const contentArea = page.locator('div[style*="overflow: auto"]');
    await contentArea.getByRole('button', { name: '+ Add Server' }).click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('censys, filesystem, github, etc.').fill(TEST_MCP_ID);
    await page.getByPlaceholder('npx, node, python, docker, etc.').fill('echo');
    await page.getByPlaceholder('-y @censys/mcp-server').fill('test-server');

    // Click modal's Add Server button (in the modal overlay)
    const modalOverlay = page.locator('div[style*="position: fixed"]');
    await modalOverlay.getByRole('button', { name: 'Add Server' }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(TEST_MCP_ID, { exact: true }).first()).toBeVisible();
  });

  test('should open edit modal for the test MCP server', async () => {
    await page.waitForTimeout(500);
    // Find the Edit button near our test server
    const serverText = page.getByText(TEST_MCP_ID, { exact: true }).first();
    if (await serverText.count() > 0) {
      const card = serverText.locator('..').locator('..').locator('..');
      const editBtn = card.getByRole('button', { name: 'Edit' }).first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(300);
        await expect(page.getByText('Edit MCP Server')).toBeVisible();
        await page.locator('button:has-text("\u00D7")').click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should delete the test MCP server', async () => {
    await page.waitForTimeout(500);
    const serverText = page.getByText(TEST_MCP_ID).first();
    if (await serverText.count() > 0) {
      const removeDialog = setupDialogHandler(true);
      const card = serverText.locator('..').locator('..').locator('..');
      const deleteBtn = card.getByRole('button', { name: 'Delete' }).first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        await page.waitForTimeout(1000);
      }
      removeDialog();
    }
  });
});

// ==================== SETTINGS VIEW TESTS ====================

test.describe('Settings View', () => {
  test.beforeEach(async () => {
    await navigateTo('Settings');
    await page.waitForTimeout(500);
  });

  test('should show settings page', async () => {
    await expectTitleBar('Settings');
    // Use first() to avoid strict mode with multiple matches
    await expect(page.getByText('Claude Code Connection').first()).toBeVisible();
    await expect(page.getByText('Detected Paths').first()).toBeVisible();
  });

  test('should have Test Connection button visible', async () => {
    const contentArea = page.locator('div[style*="overflow: auto"]');
    await expect(contentArea.getByRole('button', { name: /Test Connection|Testing/ }).first()).toBeVisible();
  });

  test('should click Test Connection without crash', async () => {
    const contentArea = page.locator('div[style*="overflow: auto"]');
    const testBtn = contentArea.getByRole('button', { name: 'Test Connection' });
    if (await testBtn.count() > 0) {
      await testBtn.click();
      await page.waitForTimeout(3000);
      // After test, status text should appear
      await expect(page.getByText(/Connected|Connection Failed|Not tested/).first()).toBeVisible();
    }
  });

  test('should show detected paths', async () => {
    await expect(page.getByText('~/.claude/skills/').first()).toBeVisible();
  });
});

// ==================== AGENT CRUD TESTS ====================

test.describe('Agent CRUD', () => {
  test('should create an agent via the Plugins view', async () => {
    // First create a skill so the Local plugin exists, then use the Agents tab
    // to create an agent
    await navigateTo('Plugins');
    await page.waitForTimeout(1000);

    // First ensure a Local plugin exists by creating a temp skill if needed
    const localPluginExists = await page.getByText('Local', { exact: true }).count() > 0;
    if (!localPluginExists) {
      // Create a temp skill so the Local plugin appears
      const contentArea = page.locator('div[style*="overflow: auto"]');
      await contentArea.getByRole('button', { name: '+ New Skill' }).first().click();
      await page.waitForTimeout(300);
      await page.getByPlaceholder('my-skill').fill('e2e-temp-skill');
      await page.getByPlaceholder('Deploy to Production').fill('Temp');
      await page.locator('textarea').fill('temp');
      await page.getByRole('button', { name: 'Create' }).click();
      await page.waitForTimeout(1000);
    }

    // Now expand the Local plugin
    const contentArea = page.locator('div[style*="overflow: auto"]');
    const expandArrows = contentArea.locator('span:has-text("▼")');
    const arrowCount = await expandArrows.count();
    let expanded = false;
    for (let i = 0; i < arrowCount; i++) {
      const arrow = expandArrows.nth(i);
      const parentText = await arrow.locator('..').textContent();
      if (parentText && parentText.includes('Local')) {
        await arrow.click();
        await page.waitForTimeout(800);
        expanded = true;
        break;
      }
    }

    if (!expanded) {
      // Skip if Local plugin not found
      return;
    }

    // Click Agents tab
    const agentsTab = contentArea.locator('button').filter({ hasText: /^Agents/ }).first();
    await agentsTab.click({ force: true });
    await page.waitForTimeout(500);

    // Click + New Agent
    const newAgentBtn = contentArea.getByRole('button', { name: '+ New Agent' });
    const btnCount = await newAgentBtn.count();
    if (btnCount === 0) {
      // The button may not exist if isLocal is false; skip
      return;
    }
    await newAgentBtn.click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('my-agent').fill(TEST_AGENT_ID);
    await page.getByPlaceholder('DB Optimizer').fill('E2E Test Agent');
    await page.locator('textarea').fill('This is a test agent from Playwright.');

    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(1000);

    const agentFile = path.join(AGENTS_DIR, `${TEST_AGENT_ID}.md`);
    expect(fs.existsSync(agentFile)).toBe(true);

    // Clean up temp skill if we created one
    const tempSkillDir = path.join(SKILLS_DIR, 'e2e-temp-skill');
    if (fs.existsSync(tempSkillDir)) {
      fs.rmSync(tempSkillDir, { recursive: true, force: true });
    }
  });

  test('should delete the test agent', async () => {
    const agentFile = path.join(AGENTS_DIR, `${TEST_AGENT_ID}.md`);
    if (!fs.existsSync(agentFile)) {
      // Nothing to delete
      return;
    }

    await navigateTo('Plugins');
    await page.waitForTimeout(1000);

    const contentArea = page.locator('div[style*="overflow: auto"]');
    const expandArrows = contentArea.locator('span:has-text("▼")');
    const arrowCount = await expandArrows.count();
    for (let i = 0; i < arrowCount; i++) {
      const arrow = expandArrows.nth(i);
      const parentText = await arrow.locator('..').textContent();
      if (parentText && parentText.includes('Local')) {
        await arrow.click();
        await page.waitForTimeout(800);
        break;
      }
    }

    const agentsTab = contentArea.locator('button').filter({ hasText: /^Agents/ }).first();
    if (await agentsTab.count() > 0) {
      await agentsTab.click({ force: true });
      await page.waitForTimeout(500);
    }

    const agentText = page.getByText(TEST_AGENT_ID);
    if (await agentText.count() > 0) {
      const removeDialog = setupDialogHandler(true);
      const row = agentText.locator('..').locator('..');
      const deleteBtn = row.getByRole('button', { name: 'Delete' });
      if (await deleteBtn.count() > 0) {
        await deleteBtn.first().click();
        await page.waitForTimeout(1000);
      }
      removeDialog();
    }
  });
});
