import { Annotation } from '@langchain/langgraph';

export const GraphState = Annotation.Root({
  // Input
  projectId: Annotation<string>,
  title: Annotation<string>,
  problem: Annotation<string>,
  constraints: Annotation<string | undefined>,

  // Clarifier outputs
  clarifications: Annotation<
    | {
        questions: string[];
        assumptions: string[];
        scope: string;
      }
    | undefined
  >,

  // HLD outputs
  hld: Annotation<
    | {
        modules: string[];
        dataFlows: string[];
        risks: string[];
        nfrs: string[];
      }
    | undefined
  >,

  // Ticket slicer outputs
  rawTickets: Annotation<
    | Array<{
        title: string;
        description: string;
        acceptanceCriteria: string;
      }>
    | undefined
  >,

  // Estimator outputs
  estimatedTickets: Annotation<
    | Array<{
        title: string;
        description: string;
        acceptanceCriteria: string;
        estimateHours: number;
        tshirtSize: string;
      }>
    | undefined
  >,

  // Prioritizer outputs
  finalTickets: Annotation<
    | Array<{
        title: string;
        description: string;
        acceptanceCriteria: string;
        estimateHours: number;
        tshirtSize: string;
        priority: number;
        sprint: number;
        dependencies: string[];
        tags: string[];
      }>
    | undefined
  >,

  // Metadata
  currentStep: Annotation<string>,
  errors: Annotation<string[]>,
  tokensUsed: Annotation<number>,
});

export type GraphStateType = typeof GraphState.State;
