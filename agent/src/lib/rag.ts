export interface Chunk {
  proxyId: string;
  text: string;
  source: string;
  index: number;
}

// 将文本切分为约 500 字符的块，50 字符重叠
export function chunkText(
  text: string,
  proxyId: string,
  source: string,
  chunkSize = 500,
  overlap = 50
): Chunk[] {
  // 先按双换行分段
  const paragraphs = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const chunks: Chunk[] = [];
  let buffer = "";
  let idx = 0;

  for (const para of paragraphs) {
    if (buffer.length + para.length > chunkSize && buffer.length > 0) {
      chunks.push({ proxyId, text: buffer.trim(), source, index: idx++ });
      // 保留末尾 overlap 字符
      buffer = buffer.slice(-overlap) + "\n\n" + para;
    } else {
      buffer += (buffer ? "\n\n" : "") + para;
    }
  }
  if (buffer.trim()) {
    chunks.push({ proxyId, text: buffer.trim(), source, index: idx });
  }
  return chunks;
}

// 中文 bigram + 英文分词
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  // 提取英文单词
  const engMatches = text.match(/[a-zA-Z]+/g) || [];
  tokens.push(...engMatches.map((w) => w.toLowerCase()));
  // 中文 bigram
  const chinese = text.replace(/[a-zA-Z0-9\s]+/g, " ");
  for (let i = 0; i < chinese.length - 1; i++) {
    const c1 = chinese.charCodeAt(i);
    const c2 = chinese.charCodeAt(i + 1);
    if (c1 >= 0x4e00 && c1 <= 0x9fff) {
      if (c2 >= 0x4e00 && c2 <= 0x9fff) {
        tokens.push(chinese[i] + chinese[i + 1]);
      }
    }
  }
  // 单字也加入（权重会低一些）
  for (let i = 0; i < chinese.length; i++) {
    if (chinese.charCodeAt(i) >= 0x4e00 && chinese.charCodeAt(i) <= 0x9fff) {
      tokens.push(chinese[i]);
    }
  }
  return tokens;
}

// TF-IDF 搜索，返回最相关的 topK 个块
export function searchChunks(query: string, chunks: Chunk[], topK = 5): Chunk[] {
  if (chunks.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return chunks.slice(0, topK);

  // 预计算每个块的词频
  const chunkTokenSets = chunks.map((c) => {
    const tokens = tokenize(c.text);
    const freq: Record<string, number> = {};
    for (const t of tokens) {
      freq[t] = (freq[t] || 0) + 1;
    }
    return freq;
  });

  // IDF
  const df: Record<string, number> = {};
  for (const freq of chunkTokenSets) {
    for (const token of Object.keys(freq)) {
      df[token] = (df[token] || 0) + 1;
    }
  }
  const n = chunks.length;
  const idf: Record<string, number> = {};
  for (const [token, count] of Object.entries(df)) {
    idf[token] = Math.log((n + 1) / (count + 1)) + 1;
  }

  // 打分
  const scores = chunkTokenSets.map((freq) => {
    let score = 0;
    for (const qt of queryTokens) {
      const tf = freq[qt] || 0;
      if (tf > 0) {
        score += (1 + Math.log(tf)) * (idf[qt] || 1);
      }
    }
    return score;
  });

  // 排序取 topK
  const indexed = scores.map((s, i) => ({ score: s, index: i }));
  indexed.sort((a, b) => b.score - a.score);
  return indexed
    .filter((x) => x.score > 0)
    .slice(0, topK)
    .map((x) => chunks[x.index]);
}
