import { Annotation } from '@langchain/langgraph';
import type { Clarifications, HLD, RawTicket, EstimatedTicket, FinalTicket } from '@/types';

export const GraphState = Annotation.Root({
  // Input
  projectId: Annotation<string>,
  title: Annotation<string>,
  problem: Annotation<string>,
  constraints: Annotation<string | undefined>,

  // Clarifier outputs
  clarifications: Annotation<Clarifications | undefined>,

  // HLD outputs
  hld: Annotation<HLD | undefined>,

  // Ticket slicer outputs
  rawTickets: Annotation<RawTicket[] | undefined>,

  // Estimator outputs
  estimatedTickets: Annotation<EstimatedTicket[] | undefined>,

  // Prioritizer outputs
  finalTickets: Annotation<FinalTicket[] | undefined>,

  // Metadata
  currentStep: Annotation<string>,
  errors: Annotation<string[]>,
  tokensUsed: Annotation<number>,
});

export type GraphStateType = typeof GraphState.State;
