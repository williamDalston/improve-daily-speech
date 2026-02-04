/**
 * Source citation parsing utilities
 */

export interface Source {
  id: number;
  title: string;
  author: string;
  year: string;
  type: string;
}

/**
 * Parse sources from research text
 * Looks for the SOURCES section and extracts structured citations
 */
export function parseSourcesFromResearch(research: string): Source[] {
  const sources: Source[] = [];

  // Find the SOURCES section (case-insensitive)
  const sourcesMatch = research.match(/(?:^|\n)\s*(?:\*\*)?(?:11\.\s*)?SOURCES(?:\*\*)?:?\s*([\s\S]*?)(?:$|\n\n(?!\[))/i);

  if (!sourcesMatch) {
    // Try alternate patterns
    const altMatch = research.match(/(?:^|\n)\s*(?:##\s*)?Sources(?:\s*(?:&|and)\s*References)?:?\s*([\s\S]*?)$/i);
    if (altMatch) {
      return parseSourceLines(altMatch[1]);
    }
    return sources;
  }

  return parseSourceLines(sourcesMatch[1]);
}

function parseSourceLines(sourcesText: string): Source[] {
  const sources: Source[] = [];
  const lines = sourcesText.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    const source = parseSourceLine(line);
    if (source) {
      sources.push(source);
    }
  }

  return sources;
}

function parseSourceLine(line: string): Source | null {
  // Pattern: [1] "Title" by Author(s) (Year) - Type
  // Also handles variations like:
  // [1] Title by Author (Year) - Type
  // 1. "Title" by Author (Year)
  // - "Title" by Author (Year) - Type

  const cleanLine = line.trim();
  if (!cleanLine) return null;

  // Extract ID number
  const idMatch = cleanLine.match(/^\[?(\d+)\]?\.?\s*/);
  const id = idMatch ? parseInt(idMatch[1], 10) : 0;

  // Remove the ID prefix
  let rest = cleanLine.replace(/^\[?\d+\]?\.?\s*[-–]?\s*/, '').trim();

  // Also remove bullet points
  rest = rest.replace(/^[-–•]\s*/, '').trim();

  // Try to extract title (in quotes or before "by")
  let title = '';
  let author = '';
  let year = '';
  let type = '';

  // Pattern 1: "Title" by Author (Year) - Type
  const quotedPattern = rest.match(/^[""]([^""]+)[""](?:\s+by\s+|\s*[-–]\s*)([^(]+)\s*\((\d{4})\)(?:\s*[-–]\s*(.+))?/i);
  if (quotedPattern) {
    title = quotedPattern[1].trim();
    author = quotedPattern[2].trim();
    year = quotedPattern[3];
    type = quotedPattern[4]?.trim() || 'Reference';
  } else {
    // Pattern 2: Title by Author (Year) - Type
    const unquotedPattern = rest.match(/^([^(]+?)\s+by\s+([^(]+)\s*\((\d{4})\)(?:\s*[-–]\s*(.+))?/i);
    if (unquotedPattern) {
      title = unquotedPattern[1].trim().replace(/^[""]|[""]$/g, '');
      author = unquotedPattern[2].trim();
      year = unquotedPattern[3];
      type = unquotedPattern[4]?.trim() || 'Reference';
    } else {
      // Pattern 3: Author (Year). Title. Type
      const academicPattern = rest.match(/^([^(]+)\s*\((\d{4})\)\.\s*([^.]+)\.\s*(.+)?/);
      if (academicPattern) {
        author = academicPattern[1].trim();
        year = academicPattern[2];
        title = academicPattern[3].trim().replace(/^[""]|[""]$/g, '');
        type = academicPattern[4]?.trim() || 'Reference';
      } else {
        // Pattern 4: Just try to extract year and use rest as title
        const simplePattern = rest.match(/(.+)\s*\((\d{4})\)/);
        if (simplePattern) {
          title = simplePattern[1].trim().replace(/^[""]|[""]$/g, '');
          year = simplePattern[2];
          author = 'Unknown';
          type = 'Reference';
        } else {
          // If no pattern matches, skip this line
          return null;
        }
      }
    }
  }

  // Clean up author (remove trailing commas, "et al" handling)
  author = author.replace(/,?\s*$/, '').trim();

  // Clean up type
  type = type.replace(/[.;,]$/, '').trim() || 'Reference';

  if (!title || title.length < 3) return null;

  return {
    id: id || (Math.random() * 10000) | 0,
    title,
    author,
    year,
    type,
  };
}

/**
 * Format sources for display
 */
export function formatSourceForDisplay(source: Source): string {
  if (source.author && source.author !== 'Unknown') {
    return `${source.title} by ${source.author} (${source.year})`;
  }
  return `${source.title} (${source.year})`;
}
