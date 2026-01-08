'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BusinessDocument } from '@/lib/business-document';
import { AlertTriangle, ChevronLeft, FileDown, LayoutList, Loader2 } from 'lucide-react';

export default function BusinessDocumentPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id: projectId, sessionId } = use(params);
  const router = useRouter();
  const [businessDocument, setBusinessDocument] = useState<BusinessDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/clarifier/sessions/${sessionId}/business-document`
      );
      if (!response.ok) {
        if (response.status === 404) {
          // Document doesn't exist, try to generate it
          const generateResponse = await fetch(
            `/api/clarifier/sessions/${sessionId}/business-document`,
            { method: 'POST' }
          );
          if (generateResponse.ok) {
            const data = await generateResponse.json();
            setBusinessDocument(data.businessDocument);
          } else {
            throw new Error('Failed to generate document');
          }
        } else {
          throw new Error('Failed to load document');
        }
      } else {
        const data = await response.json();
        setBusinessDocument(data.businessDocument);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const downloadDocument = async () => {
    if (!businessDocument || typeof window === 'undefined') return;

    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import('jspdf');

      // Create PDF document
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;
      const lineHeight = 7;
      const maxWidth = pageWidth - 2 * margin;

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setTextColor(color[0], color[1], color[2]);

        const lines = pdf.splitTextToSize(text, maxWidth);
        if (yPosition + (lines.length * lineHeight) > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * lineHeight + 3;
      };

      // Title
      addText(businessDocument.title, 18, true, [37, 99, 235]);
      yPosition += 5;

      // Executive Summary
      addText('Executive Summary', 14, true);
      addText(businessDocument.executiveSummary, 11);
      yPosition += 5;

      // Problem Statement
      addText('Problem Statement', 14, true);
      addText(businessDocument.problemStatement, 11);
      yPosition += 5;

      // Product Overview
      if (businessDocument.productOverview) {
        addText('Product Overview', 14, true);
        addText(businessDocument.productOverview, 11);
        yPosition += 5;
      }

      // System Design
      if (businessDocument.systemDesign) {
        addText('System Design', 14, true);
        addText(businessDocument.systemDesign, 11);
        yPosition += 5;
      }

      // Objectives
      if (businessDocument.objectives.length > 0) {
        addText('Objectives', 14, true);
        businessDocument.objectives.forEach((obj, i) => {
          addText(`${i + 1}. ${obj}`, 11);
        });
        yPosition += 5;
      }

      // Scope
      addText('Scope', 14, true);
      addText(businessDocument.scope, 11);
      yPosition += 5;

      // Stakeholders
      if (businessDocument.stakeholders.length > 0) {
        addText('Stakeholders', 14, true);
        businessDocument.stakeholders.forEach((stakeholder) => {
          addText(`• ${stakeholder}`, 11);
        });
        yPosition += 5;
      }

      // Requirements
      addText('Requirements', 14, true);

      if (businessDocument.requirements.functional.length > 0) {
        addText('Functional Requirements', 12, true);
        businessDocument.requirements.functional.forEach((req, i) => {
          addText(`${i + 1}. ${req}`, 11);
        });
        yPosition += 3;
      }

      if (businessDocument.requirements.nonFunctional.length > 0) {
        addText('Non-Functional Requirements', 12, true);
        businessDocument.requirements.nonFunctional.forEach((req, i) => {
          addText(`${i + 1}. ${req}`, 11);
        });
        yPosition += 5;
      }

      // Data Flows
      if (businessDocument.dataFlows && businessDocument.dataFlows.length > 0) {
        addText('Data Flows', 14, true);
        businessDocument.dataFlows.forEach((flow, i) => {
          addText(`${i + 1}. ${flow}`, 11);
        });
        yPosition += 5;
      }

      // Cost Cutting Concerns
      if (businessDocument.costCuttingConcerns && businessDocument.costCuttingConcerns.length > 0) {
        addText('Cost Cutting Concerns', 14, true);
        businessDocument.costCuttingConcerns.forEach((concern, i) => {
          addText(`${i + 1}. ${concern}`, 11);
        });
        yPosition += 5;
      }

      // Deployment
      if (businessDocument.deployment) {
        addText('Deployment', 14, true);
        addText(businessDocument.deployment, 11);
        yPosition += 5;
      }

      // Backlog
      if (businessDocument.backlog && businessDocument.backlog.length > 0) {
        addText('Backlog', 14, true);
        businessDocument.backlog.forEach((item, i) => {
          addText(`${i + 1}. ${item}`, 11);
        });
        yPosition += 5;
      }

      // Questions
      if (businessDocument.questions && businessDocument.questions.length > 0) {
        addText('Questions', 14, true);
        businessDocument.questions.forEach((question, i) => {
          addText(`${i + 1}. ${question}`, 11);
        });
        yPosition += 5;
      }

      // Assumptions
      if (businessDocument.assumptions.length > 0) {
        addText('Assumptions', 14, true);
        businessDocument.assumptions.forEach((ass, i) => {
          addText(`${i + 1}. ${ass}`, 11);
        });
        yPosition += 5;
      }

      // Constraints
      if (businessDocument.constraints.length > 0) {
        addText('Constraints', 14, true);
        businessDocument.constraints.forEach((constraint, i) => {
          addText(`${i + 1}. ${constraint}`, 11);
        });
        yPosition += 5;
      }

      // Success Criteria
      if (businessDocument.successCriteria.length > 0) {
        addText('Success Criteria', 14, true);
        businessDocument.successCriteria.forEach((criteria, i) => {
          addText(`${i + 1}. ${criteria}`, 11);
        });
        yPosition += 5;
      }

      // Risks
      if (businessDocument.risks.length > 0) {
        addText('Risks', 14, true);
        businessDocument.risks.forEach((risk, i) => {
          addText(`${i + 1}. ${risk}`, 11);
        });
        yPosition += 5;
      }

      // Timeline
      if (businessDocument.timeline) {
        addText('Timeline', 14, true);
        addText(businessDocument.timeline, 11);
        yPosition += 5;
      }

      // Dependencies
      if (businessDocument.dependencies && businessDocument.dependencies.length > 0) {
        addText('Dependencies', 14, true);
        businessDocument.dependencies.forEach((dep) => {
          addText(`• ${dep}`, 11);
        });
        yPosition += 5;
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      const footerText = `Generated on ${new Date().toLocaleDateString()}`;
      pdf.text(footerText, margin, pageHeight - 10);

      // Save PDF
      const fileName = `${businessDocument.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--color-primary)]" />
          <p className="text-sm font-semibold text-[color:var(--color-text)]">
            Loading business document...
          </p>
        </div>
      </div>
    );
  }

  if (error || !businessDocument) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-[color:rgba(185,28,28,0.3)] bg-[color:var(--color-surface)] p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:rgba(185,28,28,0.1)]">
            <AlertTriangle className="h-5 w-5 text-[color:var(--color-danger)]" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[color:var(--color-text)]">Unable to load</h2>
          <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.6)]">
            {error || 'Document not found'}
          </p>
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="mt-6 h-11 rounded-lg bg-[color:var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/projects/${projectId}?showRepoDetails=true`)}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)] transition hover:text-[color:rgba(15,23,42,0.7)]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Project</span>
          </button>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">
                {businessDocument.title}
              </h1>
              <p className="mt-1 text-sm text-[color:rgba(15,23,42,0.6)]">
                Business requirements document
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push(`/projects/${projectId}/hdd/${sessionId}`)}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] px-4 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:rgba(15,23,42,0.28)]"
              >
                <LayoutList className="h-4 w-4 text-[color:var(--color-primary)]" />
                <span>HLDs and LLDs</span>
              </button>
              <button
                onClick={downloadDocument}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-95"
              >
                <FileDown className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="space-y-8 rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm">
          {/* Executive Summary */}
          <section>
            <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
              Executive Summary
            </h2>
            <p className="text-sm leading-relaxed text-[color:rgba(15,23,42,0.75)]">
              {businessDocument.executiveSummary}
            </p>
          </section>

          {/* Problem Statement */}
          <section>
            <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
              Problem Statement
            </h2>
            <p className="text-sm leading-relaxed text-[color:rgba(15,23,42,0.75)]">
              {businessDocument.problemStatement}
            </p>
          </section>

          {/* Product Overview */}
          {businessDocument.productOverview && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Product Overview
              </h2>
              <p className="text-sm leading-relaxed text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.productOverview}
              </p>
            </section>
          )}

          {/* System Design */}
          {businessDocument.systemDesign && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                System Design
              </h2>
              <p className="text-sm leading-relaxed text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.systemDesign}
              </p>
            </section>
          )}

          {/* Objectives */}
          {businessDocument.objectives.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Objectives
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.objectives.map((obj, i) => (
                  <li key={i} className="leading-relaxed">
                    {obj}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Scope */}
          <section>
            <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
              Scope
            </h2>
            <p className="text-sm leading-relaxed text-[color:rgba(15,23,42,0.75)]">
              {businessDocument.scope}
            </p>
          </section>

          {/* Stakeholders */}
          {businessDocument.stakeholders.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Stakeholders
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.stakeholders.map((stakeholder, i) => (
                  <li key={i}>{stakeholder}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Requirements */}
          <section>
            <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
              Requirements
            </h2>
            {businessDocument.requirements.functional.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-[color:var(--color-text)]">
                  Functional requirements
                </h3>
                <ul className="list-decimal list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                  {businessDocument.requirements.functional.map((req, i) => (
                    <li key={i} className="leading-relaxed">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {businessDocument.requirements.nonFunctional.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[color:var(--color-text)]">
                  Non-functional requirements
                </h3>
                <ul className="list-decimal list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                  {businessDocument.requirements.nonFunctional.map((req, i) => (
                    <li key={i} className="leading-relaxed">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Data Flows */}
          {businessDocument.dataFlows && businessDocument.dataFlows.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Data Flows
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.dataFlows.map((flow, i) => (
                  <li key={i} className="leading-relaxed">
                    {flow}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Cost Cutting Concerns */}
          {businessDocument.costCuttingConcerns && businessDocument.costCuttingConcerns.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Cost Cutting Concerns
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.costCuttingConcerns.map((concern, i) => (
                  <li key={i} className="leading-relaxed">
                    {concern}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Deployment */}
          {businessDocument.deployment && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Deployment
              </h2>
              <p className="text-sm leading-relaxed text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.deployment}
              </p>
            </section>
          )}

          {/* Backlog */}
          {businessDocument.backlog && businessDocument.backlog.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Backlog
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.backlog.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Questions */}
          {businessDocument.questions && businessDocument.questions.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Questions
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.questions.map((question, i) => (
                  <li key={i} className="leading-relaxed">
                    {question}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Assumptions */}
          {businessDocument.assumptions.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Assumptions
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.assumptions.map((ass, i) => (
                  <li key={i} className="leading-relaxed">
                    {ass}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Constraints */}
          {businessDocument.constraints.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Constraints
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.constraints.map((constraint, i) => (
                  <li key={i} className="leading-relaxed">
                    {constraint}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Success Criteria */}
          {businessDocument.successCriteria.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Success Criteria
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.successCriteria.map((criteria, i) => (
                  <li key={i} className="leading-relaxed">
                    {criteria}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Risks */}
          {businessDocument.risks.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Risks
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.risks.map((risk, i) => (
                  <li key={i} className="leading-relaxed">
                    {risk}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Timeline */}
          {businessDocument.timeline && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Timeline
              </h2>
              <p className="text-sm leading-relaxed text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.timeline}
              </p>
            </section>
          )}

          {/* Dependencies */}
          {businessDocument.dependencies && businessDocument.dependencies.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[color:rgba(15,23,42,0.16)] pb-2 text-lg font-semibold text-[color:var(--color-text)]">
                Dependencies
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                {businessDocument.dependencies.map((dep, i) => (
                  <li key={i}>{dep}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
