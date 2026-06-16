export * from './types';
export * from './multiple-choice';
export * from './free-text';
export * from './crm-prioritization';
export * from './notification-reaction';
export * from './email-response';
export * from './simulated-call';

import { multipleChoiceModule } from './multiple-choice';
import { freeTextModule } from './free-text';
import { crmPrioritizationModule } from './crm-prioritization';
import { notificationReactionModule } from './notification-reaction';
import { emailResponseModule } from './email-response';
import { simulatedCallModule } from './simulated-call';
import { SimulationModule } from './types';

export const moduleRegistry: Record<string, SimulationModule<any, any>> = {
  multiple_choice: multipleChoiceModule,
  free_text: freeTextModule,
  crm_prioritization: crmPrioritizationModule,
  notification_reaction: notificationReactionModule,
  email_response: emailResponseModule,
  simulated_call: simulatedCallModule,
};

export function getModule(type: string): SimulationModule<any, any> {
  const mod = moduleRegistry[type];
  if (!mod) throw new Error(`Unknown module type: ${type}`);
  return mod;
}
