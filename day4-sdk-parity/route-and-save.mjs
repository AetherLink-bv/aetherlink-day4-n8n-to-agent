import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { route } from '../lib/switch.mjs';
import { saveReviewDraft } from './draft-client.mjs';

const lab = path.dirname(fileURLToPath(import.meta.url));

export function validateOutput(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Agent output must be an object. No draft was saved.');
  if (Object.keys(result).sort().join(',') !== 'message,priority') throw new Error('Agent output must contain only priority and message. No draft was saved.');
  const priority = typeof result.priority === 'string' ? result.priority.toLowerCase() : '';
  const selected = route(priority);
  if (!selected) throw new Error('Agent output has no valid low, medium or high priority. No draft was saved.');
  if (typeof result.message !== 'string' || !result.message.trim()) throw new Error('Agent output has no customer message. No draft was saved.');
  return { priority, message: result.message.trim(), route: selected };
}

export async function routeAndSave({ result, ticket, draftsDirectory = path.join(lab, 'review-drafts') }) {
  const valid = validateOutput(result);
  await saveReviewDraft({
    message_id: ticket.id,
    priority: valid.priority,
    route: valid.route.action,
    subject: ticket.subject,
    body: valid.message,
  }, { draftsDirectory });
  return { ...valid, path: path.join(draftsDirectory, `${ticket.id}.md`) };
}
