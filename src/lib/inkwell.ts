export type DraftBlocker = 'central-claim' | 'target-reader' | 'raw-material';
export type SectionRole = 'problem' | 'concept' | 'example' | 'objection' | 'steps' | 'closing' | 'support';
export type MissingPieceKind = 'central-claim' | 'target-reader' | 'example' | 'steps' | 'closing';

export interface DraftReadiness {
  ready: boolean;
  blockers: DraftBlocker[];
  wordCount: number;
  sectionCount: number;
}

export interface ArticleSection {
  id: string;
  title: string;
  role: SectionRole;
  body: string;
}

export interface MissingPiece {
  id: string;
  kind: MissingPieceKind;
  label: string;
  resolved: boolean;
}

export interface ArticleShape {
  ready: boolean;
  blockers: DraftBlocker[];
  centralClaim: string;
  targetReaderPromise: string;
  sections: ArticleSection[];
  missingPieces: MissingPiece[];
}

export interface ArticleShapeInput {
  markdown: string;
  centralClaim: string;
  targetReaderPromise: string;
}

export interface AcceptedAddition {
  heading: string;
  body: string;
}

export const SECTION_ROLE_OPTIONS: Array<{ value: SectionRole; label: string }> = [
  { value: 'problem', label: '提出问题' },
  { value: 'concept', label: '解释概念' },
  { value: 'example', label: '给出例子' },
  { value: 'objection', label: '回应反驳' },
  { value: 'steps', label: '提供步骤' },
  { value: 'closing', label: '收束结论' },
  { value: 'support', label: '支撑论点' },
];

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countTextUnits(markdown: string): number {
  const text = stripMarkdown(markdown);
  const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  const latinWords = text.match(/[A-Za-z0-9]+/g)?.length ?? 0;
  return chineseChars + latinWords;
}

function countSections(markdown: string): number {
  return markdown.split('\n').filter((line) => /^#{2,4}\s+\S/.test(line.trim())).length;
}

function isOneSentenceClaim(claim: string): boolean {
  const trimmed = claim.trim();
  if (!trimmed) return false;
  if (/[\n\r]/.test(trimmed)) return false;
  const sentenceMarks = trimmed.match(/[。！？.!?]/g)?.length ?? 0;
  return sentenceMarks <= 1;
}

function slugify(input: string, index: number): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'section'}-${index + 1}`;
}

function inferRole(title: string, body: string): SectionRole {
  if (/问题|痛点|难点|背景|困境|为什么/.test(title)) return 'problem';
  if (/是什么|概念|定义|原理/.test(title)) return 'concept';
  if (/例子|案例|比如|例如|举例/.test(title)) return 'example';
  if (/反驳|误解|但是|不过|质疑/.test(title)) return 'objection';
  if (/步骤|做法|方法|流程/.test(title)) return 'steps';
  if (/结论|总结|收束|最后/.test(title)) return 'closing';

  const text = `${title}\n${body}`;
  if (/问题|痛点|难点|背景|困境|为什么/.test(text)) return 'problem';
  if (/是什么|概念|定义|原理/.test(text)) return 'concept';
  if (/例子|案例|比如|例如|举例/.test(text)) return 'example';
  if (/反驳|误解|但是|不过|质疑/.test(text)) return 'objection';
  if (/步骤|做法|方法|流程|先|然后|最后/.test(text)) return 'steps';
  if (/结论|总结|收束|最后/.test(text)) return 'closing';
  return 'support';
}

function parseSections(markdown: string): ArticleSection[] {
  const lines = markdown.split('\n');
  const sections: Array<{ title: string; body: string[] }> = [];
  let current: { title: string; body: string[] } | null = null;

  for (const line of lines) {
    const heading = line.match(/^#{2,4}\s+(.+)$/);
    if (heading) {
      current = { title: heading[1].trim(), body: [] };
      sections.push(current);
    } else if (current) {
      current.body.push(line);
    }
  }

  if (sections.length === 0) {
    const fallback = stripMarkdown(markdown).slice(0, 24) || '未命名段落';
    sections.push({ title: fallback, body: [markdown] });
  }

  return sections.map((section, index) => {
    const body = section.body.join('\n').trim();
    return {
      id: slugify(section.title, index),
      title: section.title,
      role: inferRole(section.title, body),
      body,
    };
  });
}

export function createMissingPieces(
  input: Pick<ArticleShapeInput, 'centralClaim' | 'targetReaderPromise'>,
  sections: ArticleSection[],
): MissingPiece[] {
  const roles = new Set(sections.map((section) => section.role));
  const pieces: MissingPiece[] = [];

  if (!isOneSentenceClaim(input.centralClaim)) {
    pieces.push({
      id: 'central-claim',
      kind: 'central-claim',
      label: '把 Central Claim 收束成一句话。',
      resolved: false,
    });
  }
  if (!input.targetReaderPromise.trim()) {
    pieces.push({
      id: 'target-reader',
      kind: 'target-reader',
      label: '补上 Target Reader Promise。',
      resolved: false,
    });
  }
  if (!roles.has('example')) {
    pieces.push({
      id: 'example',
      kind: 'example',
      label: '加入一个能支撑 Central Claim 的具体例子。',
      resolved: false,
    });
  }
  if (!roles.has('steps')) {
    pieces.push({
      id: 'steps',
      kind: 'steps',
      label: '补上读者可以执行的步骤或判断方法。',
      resolved: false,
    });
  }
  if (!roles.has('closing')) {
    pieces.push({
      id: 'closing',
      kind: 'closing',
      label: '补一个回应 Target Reader Promise 的收束结论。',
      resolved: false,
    });
  }

  return pieces;
}

export function inspectImportedDraft(markdown: string): DraftReadiness {
  const wordCount = countTextUnits(markdown);
  const sectionCount = countSections(markdown);
  const blockers: DraftBlocker[] = [];

  if (wordCount < 80 && sectionCount < 2) {
    blockers.push('raw-material');
  }

  return {
    ready: blockers.length === 0,
    blockers,
    wordCount,
    sectionCount,
  };
}

export function createArticleShape(input: ArticleShapeInput): ArticleShape {
  const readiness = inspectImportedDraft(input.markdown);
  const sections = parseSections(input.markdown);
  const missingPieces = createMissingPieces(input, sections);
  const blockers = [...readiness.blockers];

  if (!isOneSentenceClaim(input.centralClaim)) blockers.push('central-claim');
  if (!input.targetReaderPromise.trim()) blockers.push('target-reader');

  return {
    ready: blockers.length === 0,
    blockers: Array.from(new Set(blockers)),
    centralClaim: input.centralClaim.trim(),
    targetReaderPromise: input.targetReaderPromise.trim(),
    sections,
    missingPieces,
  };
}

export function buildPublishableMarkdown(markdown: string, additions: AcceptedAddition[] = []): string {
  const accepted = additions
    .map((addition) => ({
      heading: addition.heading.trim(),
      body: addition.body.trim(),
    }))
    .filter((addition) => addition.heading && addition.body);

  if (accepted.length === 0) return markdown.trim();

  const appended = accepted
    .map((addition) => `## ${addition.heading}\n\n${addition.body}`)
    .join('\n\n');

  return `${markdown.trim()}\n\n${appended}`;
}
