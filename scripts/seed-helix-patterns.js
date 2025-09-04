#!/usr/bin/env node
/*
 * Seed HelixPatternEntries from .forge_workspace/patterns/*.json
 * - Builds DynamoDB BatchWriteItem payloads (<=25 items per chunk)
 * - Duplicates items per keyword to satisfy KeywordIndex
 * - Writes payload files to .forge_workspace/artifacts/helix-seed/
 */

const fs = require('fs');
const path = require('path');

const TABLE_NAME = process.env.HELIX_TABLE_NAME || 'HelixPatternEntries';
const WORKSPACE_PATTERNS_DIR = path.resolve('.forge_workspace/patterns');
const OUTPUT_DIR = path.resolve('.forge_workspace/artifacts/helix-seed');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function readPatterns(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Patterns directory not found: ${dir}`);
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const patterns = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    try {
      const data = JSON.parse(raw);
      patterns.push({ ...data, __sourceFile: f });
    } catch (e) {
      throw new Error(`Invalid JSON in ${f}: ${e.message}`);
    }
  }
  return patterns;
}

function strSet(values) {
  const arr = Array.isArray(values) ? values : (values ? [values] : []);
  const clean = arr.map(String).filter(Boolean);
  return clean.length ? { SS: clean } : undefined;
}

function num(n) {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return undefined;
  return { N: String(n) };
}

function str(s) {
  if (s === undefined || s === null) return undefined;
  return { S: String(s) };
}

function buildItemsForPattern(p) {
  // Derive required fields
  const category = p.agentType || 'general';
  const canon = p.canonicalName || p.patternId;
  const nowIso = new Date().toISOString();

  const baseAttrs = {
    category: str(category),
    intent: str(canon),
    patternId: str(p.patternId),
    version: num(p.version ?? 1),
    content: str(p.content || ''),
    context: str(JSON.stringify(p.context || {})),
    keywords: strSet(p.keywords || []),
    projectId: str(p.projectId || ''),
    agentType: str(p.agentType || ''),
    successRate: num(p.successRate ?? 0),
    usageCount: num(p.usageCount ?? 0),
    createdAt: str(p.createdAt || nowIso),
    updatedAt: str(p.updatedAt || nowIso),
    canonicalName: str(p.canonicalName || ''),
    aliases: strSet(p.aliases || []),
  };

  // Clean out undefined attributes (Dynamo requires explicit types only)
  const clean = (attrs) => Object.fromEntries(
    Object.entries(attrs).filter(([, v]) => v !== undefined)
  );

  const items = [];

  // Base item (no keyword attribute) — canonical record
  items.push(clean(baseAttrs));

  // Duplicate per keyword for KeywordIndex, ensure unique PK via intent suffix
  const keywords = Array.isArray(p.keywords) ? p.keywords : [];
  for (const kw of keywords) {
    const kwItem = clean({
      ...baseAttrs,
      intent: str(`${canon}#kw:${kw}`),
      keyword: str(String(kw).toLowerCase()),
    });
    items.push(kwItem);
  }

  return items;
}

function toPutRequest(item) {
  return { PutRequest: { Item: item } };
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
}

function main() {
  ensureDir(OUTPUT_DIR);
  const patterns = readPatterns(WORKSPACE_PATTERNS_DIR);
  if (patterns.length === 0) {
    console.error('No patterns found to seed.');
    process.exit(1);
  }

  const allItems = patterns.flatMap(buildItemsForPattern);
  const putRequests = allItems.map(toPutRequest);

  // BatchWriteItem limit is 25 WriteRequests per table per call
  const batches = chunk(putRequests, 25);

  batches.forEach((batch, idx) => {
    // AWS CLI expects --request-items to be the map itself, without RequestItems wrapper
    const payload = { [TABLE_NAME]: batch };
    const outFile = path.join(OUTPUT_DIR, `helix-batch-${String(idx + 1).padStart(4, '0')}.json`);
    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
    console.log(`Wrote ${batch.length} items to ${outFile}`);
  });

  console.log(`Prepared ${putRequests.length} write requests across ${batches.length} batch file(s).`);
  console.log(`Table: ${TABLE_NAME}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}
