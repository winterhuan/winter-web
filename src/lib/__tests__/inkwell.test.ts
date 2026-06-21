import { describe, expect, it } from 'vitest';
import { buildPublishableMarkdown, createArticleShape, inspectImportedDraft } from '../inkwell';

describe('Inkwell Completion Workflow', () => {
  it('does not treat title-only material as a Half-Finished Draft', () => {
    const readiness = inspectImportedDraft('# 我想写一篇关于写作的文章');

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain('raw-material');
  });

  it('creates an editable Article Shape from an Imported Draft', () => {
    const markdown = `# 写作系统为什么会失效

## 问题

很多独立写作者并不是没有想法，而是草稿太多，每一篇都停在半成品状态。

## 例子

比如一篇产品复盘已经有背景、观察和几个片段，但作者不知道哪些段落应该留下。

## 步骤

先确认文章主张，再整理段落顺序，最后补齐读者真正需要的解释。`;

    const shape = createArticleShape({
      markdown,
      centralClaim: '持续输出型写作者需要先收束半成品草稿，而不是继续制造更多空白文档。',
      targetReaderPromise: '写给有多篇草稿但发布很少的独立写作者，读完后能判断下一步该修哪一篇。',
    });

    expect(shape.ready).toBe(true);
    expect(shape.sections).toHaveLength(3);
    expect(shape.sections.map((section) => section.role)).toEqual(['problem', 'example', 'steps']);
    expect(shape.missingPieces.map((piece) => piece.kind)).toContain('closing');
  });

  it('requires the Central Claim to be one sentence before revision is ready', () => {
    const shape = createArticleShape({
      markdown: `# 写作系统为什么会失效

## 问题

很多独立写作者有足够素材，却因为草稿没有收束而无法发布。

## 例子

一篇复盘文章可能同时堆着背景、观察、步骤和结论草稿。

## 步骤

先收束主张，然后排序段落，最后补齐缺口。`,
      centralClaim: '写作者需要收束草稿。还需要建立发布节奏。',
      targetReaderPromise: '写给有草稿但发布很少的独立写作者。',
    });

    expect(shape.ready).toBe(false);
    expect(shape.blockers).toContain('central-claim');
  });

  it('keeps repeated section headings independently editable', () => {
    const shape = createArticleShape({
      markdown: `# 写作系统为什么会失效

## 例子

第一个例子说明草稿堆积的问题。

## 例子

第二个例子说明结构缺口的问题。`,
      centralClaim: '半成品草稿需要先整理结构再继续补写。',
      targetReaderPromise: '写给草稿很多但发布很少的独立写作者。',
    });

    expect(new Set(shape.sections.map((section) => section.id)).size).toBe(2);
  });

  it('builds Publishable Markdown from the Article Draft and accepted additions', () => {
    const markdown = `# 写作系统为什么会失效

## 问题

草稿多不等于文章快完成。`;

    const publishable = buildPublishableMarkdown(markdown, [
      { heading: '结论', body: '先完成一篇能发布的文章，再优化写作系统。' },
    ]);

    expect(publishable).toContain('草稿多不等于文章快完成。');
    expect(publishable).toContain('## 结论');
    expect(publishable).toContain('先完成一篇能发布的文章，再优化写作系统。');
  });
});
