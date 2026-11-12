// n8n: the Structured Output Parser after the AI Agent. It returns {priority, message} and the Switch reads priority.
export const workflowOutputSchema = {
  type: 'object',
  properties: {
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    message: { type: 'string' },
  },
  required: ['priority', 'message'],
  additionalProperties: false,
};
