const TARGET_CHUNK_CHARS = 3500;

export function splitIntoParagraphBlocks(text: string): string[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length > 0) {
    return blocks;
  }

  const trimmed = text.trim();
  return trimmed ? [trimmed] : [];
}

export function buildOrderedChunks(
  text: string,
  maxChunkChars = TARGET_CHUNK_CHARS,
): string[] {
  const blocks = splitIntoParagraphBlocks(text);
  if (blocks.length === 0) return [];

  if (text.length <= maxChunkChars) {
    return [text.trim()];
  }

  const chunks: string[] = [];
  let current = "";

  for (const block of blocks) {
    if (block.length > maxChunkChars) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }

      // Oversized single block: split on single newlines, then hard-wrap as last resort.
      const lines = block.split("\n");
      let lineChunk = "";
      for (const line of lines) {
        const next = lineChunk ? `${lineChunk}\n${line}` : line;
        if (next.length > maxChunkChars && lineChunk) {
          chunks.push(lineChunk.trim());
          lineChunk = line;
        } else if (line.length > maxChunkChars) {
          if (lineChunk.trim()) {
            chunks.push(lineChunk.trim());
            lineChunk = "";
          }
          for (let i = 0; i < line.length; i += maxChunkChars) {
            chunks.push(line.slice(i, i + maxChunkChars));
          }
        } else {
          lineChunk = next;
        }
      }
      if (lineChunk.trim()) {
        chunks.push(lineChunk.trim());
      }
      continue;
    }

    const next = current ? `${current}\n\n${block}` : block;
    if (next.length > maxChunkChars && current) {
      chunks.push(current.trim());
      current = block;
    } else {
      current = next;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

export function joinChunksInOrder(chunks: string[]): string {
  return chunks
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
