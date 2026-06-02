import { KnowledgeDoc } from '../data/evFaultKnowledge';

export interface PromptContext {
  query: string;
  retrievedDocs: KnowledgeDoc[];
  sessionHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export const SYSTEM_PROMPT = `You are an expert EV (Electric Vehicle) charger fault diagnostics assistant for a fleet management platform. You have deep technical knowledge of EVSE (Electric Vehicle Supply Equipment) hardware, OCPP protocols, electrical safety standards (IEC 61851, IEC 62196), and charge point management systems.

Your role is to:
1. Analyze reported fault symptoms and identify root causes
2. Provide structured diagnostic guidance with clear resolution steps
3. Prioritize user and technician safety in all recommendations
4. Reference specific fault codes, standards, and measurement procedures

Always structure your response with:
- **Fault Analysis**: Identified fault type and fault code
- **Severity**: Critical / High / Medium / Low with justification
- **Root Cause Analysis**: Most likely causes ranked by probability
- **Resolution Steps**: Numbered, actionable steps with specific measurements
- **Safety Note**: Any relevant safety warnings before proceeding
- **Estimated Downtime**: Realistic resolution timeframe

If the fault involves electrical safety risks (ground faults, overcurrent, thermal events), always recommend taking the unit out of service before performing any inspection.`;

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildUserPrompt(ctx: PromptContext): string {
  const contextBlock = ctx.retrievedDocs.length > 0
    ? `\n\n## Retrieved Knowledge Base Context\n${ctx.retrievedDocs.map((doc, i) =>
        `### [${i + 1}] ${doc.title} (Fault Code: ${doc.metadata.faultCode})\n${doc.content}\n**Known Resolution Steps:** ${doc.metadata.resolution.join('; ')}`
      ).join('\n\n')}`
    : '';

  return `## User Query\n${ctx.query}${contextBlock}

Based on the above context, provide a comprehensive diagnostic analysis following the structured response format.`;
}

export function buildDemoResponse(query: string, doc: KnowledgeDoc): string {
  const { title, metadata, content } = doc;
  const severityEmoji = { low: '🟢', medium: '🟡', high: '🟠', critical: '🔴' }[metadata.severity];

  return `**Fault Analysis: ${title}**

**Fault Code**: \`${metadata.faultCode}\` | **Severity**: ${severityEmoji} ${metadata.severity.charAt(0).toUpperCase() + metadata.severity.slice(1)} | **Category**: ${metadata.category}

---

**Diagnosis:**
${content}

---

**Root Cause Analysis:**
Based on the reported symptoms, the most probable causes in order of likelihood are:

1. **Primary** — Hardware or configuration fault at the charge point level requiring on-site inspection
2. **Secondary** — Network or backend system issue affecting real-time communication
3. **Tertiary** — Intermittent fault triggered by environmental conditions (temperature, moisture, load variation)

---

**Resolution Steps:**
${metadata.resolution.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---

**Safety Note:**
${metadata.severity === 'critical' || metadata.severity === 'high'
  ? '⚠️ **This fault may present a safety risk. Take the unit out of service immediately and ensure the area is clear before inspection. Only qualified electricians should perform internal hardware inspections.**'
  : '✅ This fault is generally safe to diagnose remotely. Follow standard electrical safety precautions if physical inspection is required.'}

---

**Estimated Downtime**: ${metadata.estimatedDowntime}

*Diagnostics powered by EV Fault RAG Engine — retrieved from knowledge base document \`${doc.id}\`*`;
}
