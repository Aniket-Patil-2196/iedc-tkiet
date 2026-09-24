import React from "react";

/**
 * Renders blog manuscript body.
 * Plain \n\n paragraphs (legacy) keep the exact prior visual treatment.
 * Markdown / light HTML adds H2/H3, lists, emphasis, links, and blockquotes
 * without changing chrome or typography tokens for plain posts.
 */

const BODY_P =
  "font-book-body text-base sm:text-lg md:text-[19px] text-[var(--ink)] leading-[1.8] text-left [hyphens:manual]";
const BODY_H2 =
  "font-display text-xl sm:text-2xl font-bold text-[var(--ink-heading)] tracking-tight mt-2";
const BODY_H3 =
  "font-display text-lg sm:text-xl font-bold text-[var(--ink-heading)] tracking-tight mt-1";
const BODY_BQ =
  "font-book-body text-base sm:text-lg text-[var(--ink-muted)] italic border-l-2 border-[var(--ink-accent)]/40 pl-4 py-1 leading-relaxed";
const BODY_LIST =
  "font-book-body text-base sm:text-lg md:text-[19px] text-[var(--ink)] leading-[1.8] list-outside pl-6 space-y-1.5";
const BODY_LINK = "text-[var(--ink-accent)] underline underline-offset-2 hover:opacity-80";

function extractDropCap(text: string): { dropCap: string; remainder: string } {
  if (!text) return { dropCap: "", remainder: "" };
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      const it = segmenter.segment(text)[Symbol.iterator]();
      const first = it.next().value;
      if (first) {
        return { dropCap: first.segment, remainder: text.slice(first.segment.length) };
      }
    } catch {
      // fallback
    }
  }
  const first = Array.from(text)[0] || "";
  return { dropCap: first, remainder: text.slice(first.length) };
}

function hasStructuredMarkup(content: string): boolean {
  if (/<\/?(?:h[23]|ul|ol|li|blockquote|strong|em|a|p|br)\b/i.test(content)) return true;
  if (/^(#{2,3}\s|[-*]\s|\d+\.\s|>\s)/m.test(content)) return true;
  if (/\*\*[^*]+\*\*|__[^_]+__|\[[^\]]+\]\([^)]+\)/.test(content)) return true;
  // Single-asterisk italic only when clearly paired (avoid false positives)
  if (/(^|[^*])\*[^*\n]+\*(?!\*)/.test(content)) return true;
  return false;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Links, bold, italic — process sequentially with a simple tokenizer
  const tokenRe =
    /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\*([^*\n]+)\*)|(_([^_\n]+)_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = tokenRe.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    if (m[1]) {
      nodes.push(
        <a
          key={`${keyPrefix}-a-${i++}`}
          href={m[3]}
          target="_blank"
          rel="noopener noreferrer"
          className={BODY_LINK}
        >
          {m[2]}
        </a>
      );
    } else if (m[4] || m[6]) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i++}`}>{m[5] || m[7]}</strong>
      );
    } else if (m[8] || m[10]) {
      nodes.push(<em key={`${keyPrefix}-i-${i++}`}>{m[9] || m[11]}</em>);
    }
    last = m.index + m[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length ? nodes : [text];
}

type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "bq"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "html"; html: string };

function parseMarkdownBlocks(content: string): Block[] {
  // If content is primarily HTML with allowed tags, pass through after minor normalize
  if (/<\/?(?:h[23]|ul|ol|li|blockquote|p)\b/i.test(content) && !/^(#{2,3}\s)/m.test(content)) {
    return [{ type: "html", html: content }];
  }

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join("\n").trim();
    if (text) blocks.push({ type: "p", text });
    para = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) {
      listType = null;
      listItems = [];
      return;
    }
    blocks.push({ type: listType, items: listItems });
    listType = null;
    listItems = [];
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    const bq = line.match(/^>\s?(.*)$/);
    const ul = line.match(/^[-*]\s+(.+)$/);
    const ol = line.match(/^\d+\.\s+(.+)$/);

    if (h2 || h3 || bq || ul || ol || line.trim() === "") {
      flushPara();
    }

    if (h2) {
      flushList();
      blocks.push({ type: "h2", text: h2[1].trim() });
    } else if (h3) {
      flushList();
      blocks.push({ type: "h3", text: h3[1].trim() });
    } else if (bq) {
      flushList();
      blocks.push({ type: "bq", text: bq[1] });
    } else if (ul) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(ul[1]);
    } else if (ol) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(ol[1]);
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }

  flushPara();
  flushList();
  return blocks;
}

function DropCapParagraph({ text, isFirst }: { text: string; isFirst: boolean }) {
  if (isFirst) {
    const { dropCap, remainder } = extractDropCap(text);
    return (
      <p className={BODY_P}>
        {dropCap && (
          <span className="float-left text-5xl sm:text-6xl font-book-handwriting font-bold text-[var(--ink-accent)] mr-3.5 sm:mr-4 leading-[0.75] select-none">
            {dropCap}
          </span>
        )}
        {renderInline(remainder, "first")}
      </p>
    );
  }

  return <p className={BODY_P}>{renderInline(text, "p")}</p>;
}

interface BlogManuscriptBodyProps {
  content: string;
}

export function BlogManuscriptBody({ content }: BlogManuscriptBodyProps) {
  if (!content?.trim()) return null;

  // Legacy plain posts: identical paragraph + drop-cap rendering
  if (!hasStructuredMarkup(content)) {
    const paragraphs = content.split("\n\n").filter(Boolean);
    const firstParagraph = paragraphs[0] || "";
    const remainingParagraphs = paragraphs.slice(1);
    const { dropCap, remainder: firstParaRemainder } = extractDropCap(firstParagraph);

    return (
      <section className="space-y-6 pt-4 pb-12 relative z-10">
        {firstParagraph && (
          <p className={BODY_P}>
            {dropCap && (
              <span className="float-left text-5xl sm:text-6xl font-book-handwriting font-bold text-[var(--ink-accent)] mr-3.5 sm:mr-4 leading-[0.75] select-none">
                {dropCap}
              </span>
            )}
            {firstParaRemainder}
          </p>
        )}

        {remainingParagraphs.map((para, idx) => (
          <p key={idx} className={BODY_P}>
            {para}
          </p>
        ))}
      </section>
    );
  }

  const blocks = parseMarkdownBlocks(content);
  let firstParagraphRendered = false;

  return (
    <section className="space-y-6 pt-4 pb-12 relative z-10">
      {blocks.map((block, idx) => {
        if (block.type === "html") {
          return (
            <div
              key={idx}
              className={`prose-blog space-y-6 ${BODY_P}`}
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          );
        }

        if (block.type === "h2") {
          return (
            <h2 key={idx} className={BODY_H2}>
              {renderInline(block.text, `h2-${idx}`)}
            </h2>
          );
        }

        if (block.type === "h3") {
          return (
            <h3 key={idx} className={BODY_H3}>
              {renderInline(block.text, `h3-${idx}`)}
            </h3>
          );
        }

        if (block.type === "bq") {
          return (
            <blockquote key={idx} className={BODY_BQ}>
              {renderInline(block.text, `bq-${idx}`)}
            </blockquote>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={idx} className={`${BODY_LIST} list-disc`}>
              {block.items.map((item, i) => (
                <li key={i}>{renderInline(item, `ul-${idx}-${i}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={idx} className={`${BODY_LIST} list-decimal`}>
              {block.items.map((item, i) => (
                <li key={i}>{renderInline(item, `ol-${idx}-${i}`)}</li>
              ))}
            </ol>
          );
        }

        // paragraph
        const isFirst = !firstParagraphRendered;
        firstParagraphRendered = true;
        return <DropCapParagraph key={idx} text={block.text} isFirst={isFirst} />;
      })}
    </section>
  );
}
