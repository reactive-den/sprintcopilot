import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  problem: z.string().min(20, 'Problem statement must be at least 20 characters').max(2000, 'Problem statement too long'),
  constraints: z.string().max(1000, 'Constraints too long').optional(),
});

export const createRunSchema = z.object({
  projectId: z.string().cuid('Invalid project ID'),
});

export const runStatusSchema = z.enum([
  'PENDING',
  'CLARIFYING',
  'DRAFTING_HLD',
  'SLICING_TICKETS',
  'ESTIMATING',
  'PRIORITIZING',
  'COMPLETED',
  'FAILED',
]);

export const tshirtSizeSchema = z.enum(['XS', 'S', 'M', 'L', 'XL']);

export const ticketStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

export const ticketSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().min(1, 'Description required'),
  acceptanceCriteria: z.string().min(1, 'Acceptance criteria required'),
  estimateHours: z.number().positive().optional(),
  tshirtSize: tshirtSizeSchema.optional(),
  priority: z.number().min(1).max(10),
  sprint: z.number().positive().optional(),
  dependencies: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const clarificationsSchema = z.object({
  questions: z.array(z.string()),
  assumptions: z.array(z.string()),
  scope: z.string(),
});

export const hldSchema = z.object({
  modules: z.array(z.string()),
  dataFlows: z.array(z.string()),
  risks: z.array(z.string()),
  nfrs: z.array(z.string()),
});
