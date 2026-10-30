import { ReferenceItem } from './types';

export function parseBibTeX(bibText: string): ReferenceItem[] {
  const items: ReferenceItem[] = [];
  const entries = bibText.split(/@(?=[a-zA-Z]+[\s\t\n]*\{)/);

  for (const entry of entries) {
    if (!entry.trim()) continue;
    const match = entry.match(/^([a-zA-Z]+)[\s\t\n]*\{[\s\t\n]*([^,]+),/);
    if (!match) continue;

    const type = match[1].toLowerCase();
    const key = match[2].trim();

    const fields: Record<string, string> = {};
    const fieldRegex = /([a-zA-Z_-]+)\s*=\s*(?:\{([^}]*)\}|"([^"]*)"|([0-9]+))/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(entry)) !== null) {
      const fieldName = fieldMatch[1].toLowerCase();
      const val = fieldMatch[2] ?? fieldMatch[3] ?? fieldMatch[4] ?? '';
      fields[fieldName] = val.trim();
    }

    const title = fields.title || fields.chapter || key;
    const authorStr = fields.author || '';
    const authors = authorStr
      ? authorStr.split(/\s+and\s+/i).map(a => a.trim().replace(/^\{+|\}+$/g, ''))
      : ['Unknown Author'];

    const year = fields.year ? parseInt(fields.year, 10) : undefined;
    const journal = fields.journal || fields.journaltitle;
    const booktitle = fields.booktitle;
    const volume = fields.volume;
    const issue = fields.number || fields.issue;
    const pages = fields.pages;
    const doi = fields.doi;
    const url = fields.url;
    const publisher = fields.publisher;

    const missingFields: string[] = [];
    if (!year) missingFields.push('Year');
    if (!journal && !booktitle && !publisher) missingFields.push('Venue / Journal');
    if (!doi && !url) missingFields.push('DOI / URL');
    if (!authorStr) missingFields.push('Authors');

    items.push({
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      key,
      title,
      authors,
      year,
      journal,
      booktitle,
      volume,
      issue,
      pages,
      doi,
      url,
      publisher,
      rawBibtex: `@${entry.trim()}`,
      isIncomplete: missingFields.length > 0,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
    });
  }

  return items;
}

export function parseRIS(risText: string): ReferenceItem[] {
  const items: ReferenceItem[] = [];
  const records = risText.split(/ER\s+-\s*/);

  for (const record of records) {
    if (!record.trim()) continue;
    const lines = record.split(/\r?\n/);
    let title = '';
    const authors: string[] = [];
    let year: number | undefined;
    let journal = '';
    let volume = '';
    let issue = '';
    let pages = '';
    let doi = '';
    let url = '';

    for (const line of lines) {
      const tagMatch = line.match(/^([A-Z0-9]{2})\s+-\s+(.*)$/);
      if (!tagMatch) continue;
      const tag = tagMatch[1];
      const val = tagMatch[2].trim();

      if (tag === 'TI' || tag === 'T1') title = val;
      else if (tag === 'AU' || tag === 'A1') authors.push(val);
      else if (tag === 'PY' || tag === 'Y1') {
        const yr = parseInt(val.substring(0, 4), 10);
        if (!isNaN(yr)) year = yr;
      }
      else if (tag === 'JF' || tag === 'JO' || tag === 'T2') journal = val;
      else if (tag === 'VL') volume = val;
      else if (tag === 'IS') issue = val;
      else if (tag === 'SP') pages = val;
      else if (tag === 'EP' && pages) pages += `-${val}`;
      else if (tag === 'DO') doi = val;
      else if (tag === 'UR') url = val;
    }

    if (!title && authors.length === 0) continue;

    const key = (authors[0] ? authors[0].split(',')[0].toLowerCase() : 'ref') + (year || '');
    const missingFields: string[] = [];
    if (!year) missingFields.push('Year');
    if (!journal) missingFields.push('Journal / Venue');
    if (!doi && !url) missingFields.push('DOI');

    items.push({
      id: `ref-ris-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      key,
      title: title || 'Untitled Record',
      authors: authors.length > 0 ? authors : ['Unknown Author'],
      year,
      journal,
      volume,
      issue,
      pages,
      doi,
      url,
      isIncomplete: missingFields.length > 0,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
    });
  }

  return items;
}

export function exportToBibTeX(references: ReferenceItem[]): string {
  return references
    .map(ref => {
      if (ref.rawBibtex) return ref.rawBibtex;
      const authorStr = ref.authors.join(' and ');
      const lines = [
        `@article{${ref.key},`,
        `  title = {${ref.title}},`,
        `  author = {${authorStr}},`,
      ];
      if (ref.year) lines.push(`  year = {${ref.year}},`);
      if (ref.journal) lines.push(`  journal = {${ref.journal}},`);
      if (ref.booktitle) lines.push(`  booktitle = {${ref.booktitle}},`);
      if (ref.volume) lines.push(`  volume = {${ref.volume}},`);
      if (ref.issue) lines.push(`  number = {${ref.issue}},`);
      if (ref.pages) lines.push(`  pages = {${ref.pages}},`);
      if (ref.doi) lines.push(`  doi = {${ref.doi}},`);
      if (ref.url) lines.push(`  url = {${ref.url}},`);
      lines.push('}');
      return lines.join('\n');
    })
    .join('\n\n');
}

export function formatReferenceText(ref: ReferenceItem, style: 'ieee' | 'apa' | 'nature' | 'chicago', index: number): string {
  const authorInitials = ref.authors.map(a => {
    const parts = a.split(/[\s,]+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
    }
    return a;
  });

  const authorsText = authorInitials.length > 3
    ? `${authorInitials.slice(0, 3).join(', ')}, et al.`
    : authorInitials.join(', ');

  switch (style) {
    case 'ieee': {
      let text = `[${index}] ${authorsText}, "${ref.title}," `;
      if (ref.journal) text += `${ref.journal}`;
      else if (ref.booktitle) text += `in ${ref.booktitle}`;
      else if (ref.publisher) text += `${ref.publisher}`;
      if (ref.volume) text += `, vol. ${ref.volume}`;
      if (ref.issue) text += `, no. ${ref.issue}`;
      if (ref.pages) text += `, pp. ${ref.pages}`;
      if (ref.year) text += `, ${ref.year}.`;
      if (ref.doi) text += ` DOI: ${ref.doi}.`;
      return text;
    }

    case 'apa': {
      let text = `${ref.authors.join(', ')} (${ref.year || 'n.d.'}). ${ref.title}. `;
      if (ref.journal) {
        text += `${ref.journal}`;
        if (ref.volume) text += `, ${ref.volume}`;
        if (ref.issue) text += `(${ref.issue})`;
        if (ref.pages) text += `, ${ref.pages}.`;
      } else if (ref.booktitle) {
        text += `In ${ref.booktitle}.`;
      }
      if (ref.doi) text += ` https://doi.org/${ref.doi}`;
      return text;
    }

    case 'nature': {
      let text = `${index}. ${authorsText} ${ref.title}. `;
      if (ref.journal) text += `${ref.journal} `;
      if (ref.volume) text += `${ref.volume}, `;
      if (ref.pages) text += `${ref.pages} `;
      if (ref.year) text += `(${ref.year}).`;
      return text;
    }

    case 'chicago': {
      let text = `${ref.authors.join(', ')}. "${ref.title}." `;
      if (ref.journal) text += `${ref.journal} `;
      if (ref.volume) text += `${ref.volume}`;
      if (ref.issue) text += `, no. ${ref.issue} `;
      if (ref.year) text += `(${ref.year})`;
      if (ref.pages) text += `: ${ref.pages}.`;
      return text;
    }

    default:
      return `[${index}] ${authorsText}, "${ref.title}," ${ref.year || ''}.`;
  }
}
