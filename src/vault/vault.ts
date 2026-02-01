import { platform } from "../platform/index.ts";

export interface VaultDoc {
  path: string;
  name: string;
  title: string;
  content: string;
  tags: string[];
  links: string[];
}

export interface VaultIndexEntry {
  path: string;
  title: string;
  tags: string[];
  links: string[];
  backlinks: string[];
  excerpt: string;
}

const WORKSPACE_DIR_NAME = "ai-workstation";
const VAULT_DIR_NAME = "workspace";

const linkPattern = /\[\[([^\]]+)\]\]/g;
const tagPattern = /(?:^|\s)#([a-zA-Z0-9/_-]+)/g;

const unique = (values: string[]) => Array.from(new Set(values));

export const getVaultRoot = async (workspaceRoot?: string | null) => {
  if (workspaceRoot) {
    return workspaceRoot;
  }
  const p = platform();
  const root = await p.getAppDataDir();
  return p.joinPath(root, WORKSPACE_DIR_NAME, VAULT_DIR_NAME);
};

export const ensureVaultRoot = async (workspaceRoot?: string | null) => {
  const p = platform();
  const root = await getVaultRoot(workspaceRoot);
  const already = await p.exists(root);
  if (!already) {
    await p.mkdir(root);
  }
  return root;
};

export const listMarkdownFiles = async (workspaceRoot?: string | null) => {
  const p = platform();
  const root = await ensureVaultRoot(workspaceRoot);
  const entries = await p.readDir(root, { recursive: true });
  const files: string[] = [];

  const walk = (items: typeof entries) => {
    for (const item of items) {
      if (item.children) {
        walk(item.children);
      } else if (item.path.endsWith(".md")) {
        files.push(item.path);
      }
    }
  };

  walk(entries);
  return { root, files };
};

export const readMarkdownFile = async (path: string) => {
  return platform().readTextFile(path);
};

export const writeMarkdownFile = async (path: string, content: string) => {
  await platform().writeTextFile(path, content);
};

export const createMarkdownFile = async (
  name: string,
  content: string,
  workspaceRoot?: string | null
) => {
  const p = platform();
  const root = await ensureVaultRoot(workspaceRoot);
  const filePath = await p.joinPath(root, name.endsWith(".md") ? name : `${name}.md`);
  await writeMarkdownFile(filePath, content);
  return filePath;
};

export const parseVaultDoc = (path: string, content: string): VaultDoc => {
  const name = path.split(/[\\/]/).pop() ?? path;
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : name.replace(/\.md$/i, "");

  const links = unique(
    Array.from(content.matchAll(linkPattern)).map((match) => match[1].trim())
  );
  const tags = unique(
    Array.from(content.matchAll(tagPattern)).map((match) => match[1].trim())
  );

  return { path, name, title, content, tags, links };
};

export const buildVaultIndex = (docs: VaultDoc[]): VaultIndexEntry[] => {
  const titleToPath = new Map<string, string>();
  docs.forEach((doc) => titleToPath.set(doc.title, doc.path));

  const backlinkMap = new Map<string, string[]>();
  docs.forEach((doc) => {
    doc.links.forEach((link) => {
      const targetPath = titleToPath.get(link) ?? link;
      const list = backlinkMap.get(targetPath) ?? [];
      list.push(doc.path);
      backlinkMap.set(targetPath, list);
    });
  });

  return docs.map((doc) => ({
    path: doc.path,
    title: doc.title,
    tags: doc.tags,
    links: doc.links,
    backlinks: unique(backlinkMap.get(doc.path) ?? []),
    excerpt: doc.content.slice(0, 240).replace(/\s+/g, " ").trim()
  }));
};
