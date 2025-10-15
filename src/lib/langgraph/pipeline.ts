import { StateGraph, END } from '@langchain/langgraph';
import { GraphState } from './state';
import { clarifierNode } from './nodes/clarifier';
import { hldDrafterNode } from './nodes/hld-drafter';
import { ticketSlicerNode } from './nodes/ticket-slicer';
import { estimatorNode } from './nodes/estimator';
import { prioritizerNode } from './nodes/prioritizer';

export function createPipeline() {
  const workflow = new StateGraph(GraphState)
    .addNode('clarifier', clarifierNode)
    .addNode('hld_drafter', hldDrafterNode)
    .addNode('ticket_slicer', ticketSlicerNode)
    .addNode('estimator', estimatorNode)
    .addNode('prioritizer', prioritizerNode)
    .addEdge('__start__', 'clarifier')
    .addEdge('clarifier', 'hld_drafter')
    .addEdge('hld_drafter', 'ticket_slicer')
    .addEdge('ticket_slicer', 'estimator')
    .addEdge('estimator', 'prioritizer')
    .addEdge('prioritizer', END);
  
  return workflow.compile();
}
