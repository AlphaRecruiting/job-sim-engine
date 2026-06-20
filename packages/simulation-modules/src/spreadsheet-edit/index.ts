import { z } from 'zod';
import { StepScore } from '@job-sim/shared';
import { SimulationModule, ModuleScoringInput, ModuleAnalytics, validate } from '../types';

const CellSchema = z.object({
  ref: z.string(),
  label: z.string(),
  cellType: z.enum(['numeric', 'formula', 'text', 'comment']),
  expectedValue: z.string().optional(),
  numericTolerance: z.number().optional(),
  weight: z.number().default(1),
});

const ConfigSchema = z.object({
  scenarioContext: z.string(),
  taskPrompt: z.string(),
  templateSheetUrl: z.string(),
  cells: z.array(CellSchema).default([]),
  textRubric: z.array(z.object({
    key: z.string(),
    label: z.string(),
    maxScore: z.number(),
    description: z.string(),
  })).default([]),
  expectedSignals: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([]),
});

const AnswerSchema = z.object({
  candidateSheetId: z.string(),
  capturedCells: z.array(z.object({
    ref: z.string(),
    value: z.string(),
  })),
});

type Config = z.infer<typeof ConfigSchema>;
type Answer = z.infer<typeof AnswerSchema>;

export const spreadsheetEditModule: SimulationModule<Config, Answer> = {
  type: 'spreadsheet_edit',
  label: 'Foglio di calcolo',
  description: 'Il candidato compila un Google Sheet con celle specifiche.',

  configSchema: ConfigSchema,
  answerSchema: AnswerSchema,

  validateConfig: (c) => validate(ConfigSchema, c),
  validateAnswer: (a) => validate(AnswerSchema, a),

  getPublicCandidateConfig(config: Config) {
    return {
      scenarioContext: config.scenarioContext,
      taskPrompt: config.taskPrompt,
      cells: config.cells?.map(c => ({ ref: c.ref, label: c.label, cellType: c.cellType })),
    };
  },

  async score(input: ModuleScoringInput<Config, Answer>): Promise<StepScore> {
    const { config, answer } = input;
    const cells = config.cells ?? [];
    const totalWeight = cells.reduce((s, c) => s + (c.weight ?? 1), 0) || 1;
    const numericCells = cells.filter(c => c.cellType === 'numeric' || c.cellType === 'formula');
    const textCells = cells.filter(c => c.cellType === 'text' || c.cellType === 'comment');

    let numericScore = 0;
    const criteria: StepScore['criteria'] = [];

    for (const cell of numericCells) {
      const captured = answer.capturedCells.find(c => c.ref === cell.ref);
      const capturedValue = captured?.value ?? '';
      let matched = false;

      if (cell.cellType === 'numeric' && cell.expectedValue !== undefined) {
        const expected = parseFloat(cell.expectedValue.replace(',', '.'));
        const actual = parseFloat(capturedValue.replace(',', '.'));
        const tolerance = cell.numericTolerance ?? 0;
        matched = !isNaN(expected) && !isNaN(actual) && (
          tolerance === 0
            ? Math.abs(actual - expected) < 0.001
            : Math.abs(actual - expected) <= Math.abs(expected) * (tolerance / 100)
        );
      } else if (cell.cellType === 'formula') {
        matched = capturedValue.trim().toLowerCase() === (cell.expectedValue ?? '').trim().toLowerCase();
      }

      const cellMaxScore = Math.round((cell.weight ?? 1) / totalWeight * 100);
      const cellScore = matched ? cellMaxScore : 0;
      numericScore += cellScore;
      criteria.push({ key: cell.ref, label: cell.label, score: cellScore, maxScore: cellMaxScore, evidence: capturedValue || undefined });
    }

    for (const cell of textCells) {
      const cellMaxScore = Math.round((cell.weight ?? 1) / totalWeight * 100);
      criteria.push({ key: cell.ref, label: cell.label, score: 0, maxScore: cellMaxScore });
    }

    const hasTextCells = textCells.length > 0;

    return {
      stepId: input.sessionContext.sessionId,
      stepType: 'spreadsheet_edit',
      totalScore: numericScore,
      maxScore: 100,
      criteria,
      skillScores: [],
      redFlags: [],
      summary: hasTextCells
        ? `Celle numeriche: ${numericScore} punti. Celle testuali in valutazione AI.`
        : `Punteggio: ${numericScore}/100`,
      scoringMode: hasTextCells ? 'hybrid' : 'deterministic',
      confidence: hasTextCells ? 0.5 : 1,
      needsManualReview: false,
    };
  },

  async summarizeAnalytics(submissions): Promise<ModuleAnalytics> {
    const scores = submissions.map(s => (s.score as any)?.totalScore ?? 0).filter((s: number) => s > 0);
    const avg = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
    return {
      moduleType: 'spreadsheet_edit',
      totalSubmissions: submissions.length,
      averageScore: avg,
      scoreDistribution: {},
      commonRedFlags: [],
      averageTimeSeconds: 0,
      completionRate: 1,
    };
  },
};
