# Estimator AI Design

## Usage
- Optional AI-assisted estimation using prompt templates.
- Fallback: deterministic heuristics if LLM fails.

## Estimation formula
- Base hours by ticket type:
  - EPIC: 40h
  - STORY: 8h
  - TASK: 4h
- Complexity factor: +1h per acceptance criteria item.
- Cap at tenant max hours per ticket.

Assumption: Historical actuals are available by Phase 2 for calibration.
