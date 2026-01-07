'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BusinessDocument } from '@/lib/business-document';

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
      addText(businessDocument.title, 18, true, [0, 51, 102]);
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading business document...</p>
        </div>
      </div>
    );
  }

  if (error || !businessDocument) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-center">
            <span className="text-4xl mb-4 block">❌</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Document not found'}</p>
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="text-indigo-600 hover:text-indigo-700 font-semibold mb-6 flex items-center gap-2 transition-colors group"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Project</span>
          </button>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {businessDocument.title}
              </h1>
              <p className="text-gray-600">Business Requirements Document</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white rounded-xl hover:from-purple-600 hover:to-fuchsia-700 font-semibold transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <span>🧭</span>
                <span>Repo Analysis</span>
              </button>
              <button
                onClick={() => router.push(`/projects/${projectId}/hdd/${sessionId}`)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 font-semibold transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <span>📋</span>
                <span>View HDD</span>
              </button>
              <button
                onClick={downloadDocument}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <span>📥</span>
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Executive Summary */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
              Executive Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">{businessDocument.executiveSummary}</p>
          </section>

          {/* Problem Statement */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
              Problem Statement
            </h2>
            <p className="text-gray-700 leading-relaxed">{businessDocument.problemStatement}</p>
          </section>

          {/* Product Overview */}
          {businessDocument.productOverview && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Product Overview
              </h2>
              <p className="text-gray-700 leading-relaxed">{businessDocument.productOverview}</p>
            </section>
          )}

          {/* System Design */}
          {businessDocument.systemDesign && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                System Design
              </h2>
              <p className="text-gray-700 leading-relaxed">{businessDocument.systemDesign}</p>
            </section>
          )}

          {/* Objectives */}
          {businessDocument.objectives.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Objectives
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-gray-700">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
              Scope
            </h2>
            <p className="text-gray-700 leading-relaxed">{businessDocument.scope}</p>
          </section>

          {/* Stakeholders */}
          {businessDocument.stakeholders.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Stakeholders
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {businessDocument.stakeholders.map((stakeholder, i) => (
                  <li key={i}>{stakeholder}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Requirements */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
              Requirements
            </h2>
            {businessDocument.requirements.functional.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Functional Requirements</h3>
                <ul className="list-decimal list-inside space-y-2 text-gray-700">
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
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Non-Functional Requirements</h3>
                <ul className="list-decimal list-inside space-y-2 text-gray-700">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Data Flows
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-gray-700">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Cost Cutting Concerns
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-gray-700">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Deployment
              </h2>
              <p className="text-gray-700 leading-relaxed">{businessDocument.deployment}</p>
            </section>
          )}

          {/* Backlog */}
          {businessDocument.backlog && businessDocument.backlog.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Backlog
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-gray-700">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Questions
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-gray-700">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Assumptions
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-gray-700">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Constraints
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-gray-700">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Success Criteria
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-gray-700">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Risks
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-gray-700">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Timeline
              </h2>
              <p className="text-gray-700 leading-relaxed">{businessDocument.timeline}</p>
            </section>
          )}

          {/* Dependencies */}
          {businessDocument.dependencies && businessDocument.dependencies.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2">
                Dependencies
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
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
