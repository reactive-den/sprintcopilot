# Product and Domain Overview (HLD)

## Vision and goals
- Convert raw business ideas into validated, structured engineering artifacts in minutes.
- Provide end-to-end traceability from idea -> architecture -> tickets -> assignment -> time tracking.
- Deliver a multi-tenant SaaS with auditable, consent-based tracking and compliance controls.
- Add owner-facing insights and repo-driven sprint generation with review-first controls.

## Target personas
- Founder or PM: wants fast scope, risks, and a credible execution plan.
- Engineering Manager: wants clear tickets, estimates, and assignments aligned to capacity.
- Developer: wants unambiguous acceptance criteria and assignments.
- Compliance or HR: wants consent-based tracking with retention controls.

## Domain glossary
- Idea: raw text describing a business problem or feature request.
- Clarifier Session: AI-guided conversation and transcript.
- BDD: Business Draft Document produced by Clarifier.
- Architecture Document: HLD + LLD + data flows + NFRs.
- Ticket Set: Epics, stories, tasks derived from HLD/LLD.
- Estimate Set: Ticket sizes and hour estimates.
- Assignment Set: Ticket-to-developer assignments.
- Developer Profile: skills, availability, time zone.
- Policy: Tracking and retention rules.
- Consent Record: immutable acceptance of a policy version.
- Tracker Session: time-window of activity tracking.
- Owner Query: a progress question asked by an Owner/Manager.
- Repo Connection: a tenant-linked GitHub App installation for a repo.
- Repo Insight: grounded findings derived from repo artifacts and CI signals.
- Sprint Proposal: reviewable backlog derived from repo signals.

## Primary user journeys
1) Idea to BDD
   - Input: idea title, problem statement, constraints.
   - Clarifier prompts user, gathers answers, and produces BDD.
   - Output: BDD (JSON + markdown) with scope, assumptions, risks, open questions.
2) BDD to architecture docs
   - Input: BDD.
   - HLD Draft Service produces HLD/LLD/data flows/NFRs.
   - Output: architecture docs in markdown and JSON.
3) Docs to tickets
   - Input: HLD/LLD package.
   - Ticket Slicer generates epics, stories, tasks, and acceptance criteria.
   - Output: ticket set and optional Jira/ClickUp publication.
4) Estimation and assignment
   - Input: ticket set and developer profiles.
   - Estimator assigns sizes and hours, then assigns developers.
   - Output: assignment set synced to external tools.
5) Tracking and reporting
   - Input: assignment set and developer consent.
   - Agent captures activity and screenshots per policy.
   - Output: activity reports linked to tickets.
6) Owner progress query
   - Input: owner question (developer/sprint/time range).
   - Owner Bot validates RBAC + consent scopes and returns an auditable answer.
   - Output: summary with evidence, redactions, and referenced artifacts.
7) Repo to sprint proposal
   - Input: GitHub repo connection.
   - Repo Ingestor syncs issues/PRs/CI signals into events.
   - Repo Analyzer drafts findings, tickets, estimates, and assignments for approval.

## Non-goals
- Replacing full project management or HR suites.
- Real-time code repository mutation or automated PR creation.
- Non-consensual or stealth employee monitoring.
