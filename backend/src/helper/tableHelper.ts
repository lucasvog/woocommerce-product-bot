/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { JSDOM } from 'jsdom';

/**
 * Extrahiert die erste valide HTML-Tabelle (case-insensitive) aus einem Text.
 * Gibt den HTML-String der Tabelle zurück oder `undefined`, wenn keine oder ungültige Tabelle gefunden wird.
 */
export function extractHtmlTable(text: string): string | undefined {
  try {
    if (typeof text !== 'string' || text.trim().length === 0) {
      return undefined;
    }

    // Case-insensitive Suche nach einer <table> ... </table>
    const tableMatch = text.match(/<table[\s\S]*?<\/table>/i);
    if (!tableMatch) {
      return undefined;
    }

    const tableHtml = tableMatch[0];

    // Mit jsdom sicher parsen
    const dom = new JSDOM(tableHtml);
    const table = dom.window.document.querySelector('table');
    if (!table) {
      return undefined;
    }

    // Prüfe, ob Tabelle überhaupt Daten enthält
    const hasRows = table.querySelectorAll('tr').length > 0;
    const hasCells = table.querySelectorAll('td, th').length > 0;
    if (!hasRows || !hasCells) {
      return undefined;
    }

    // Gib die bereinigte (valide) Tabelle zurück
    return table.outerHTML.trim();
  } catch (err) {
    console.error(err);
    return undefined;
  }
}
