export const routes = {
  low: { action: 'auto_reply', team: 'Self-service support' },
  medium: { action: 'investigate', team: 'Support team' },
  high: { action: 'escalate', team: 'Payments escalation team' },
};

export function route(priority) {
  if (typeof priority !== 'string') {
    return null;
  }

  return routes[priority.toLowerCase()] ?? null;
}
