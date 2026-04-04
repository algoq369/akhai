import type { GroundingAlertType, ReasoningStep } from './VerificationWindow.types';

/**
 * Grounding Guard action handlers and round pause handlers.
 * Extracted from useVerificationStream for file-size compliance.
 */
export function createRoundPauseHandlers(
  setRoundPaused: (val: boolean) => void,
  setPausedRound: (val: number | null) => void,
  pausedRound: number | null,
  setIsComplete: (val: boolean) => void,
  setError: (val: string | null) => void,
  addReasoningStep: (phase: string, message: string, data?: any) => void
) {
  const handleContinue = () => {
    setRoundPaused(false);
    setPausedRound(null);
    addReasoningStep('Round Continue', `Continuing to next round after round ${pausedRound}`);
  };

  const handleAccept = () => {
    setRoundPaused(false);
    setPausedRound(null);
    setIsComplete(true);
    addReasoningStep(
      'Round Accept',
      `Accepted consensus from round ${pausedRound}, skipping further rounds`
    );
  };

  const handleCancel = () => {
    setRoundPaused(false);
    setPausedRound(null);
    setError('Query cancelled by user');
    addReasoningStep('Round Cancel', `Query cancelled during round ${pausedRound} pause`);
  };

  return { handleContinue, handleAccept, handleCancel };
}

export function createGroundingHandlers(
  addReasoningStep: (phase: string, message: string, data?: any) => void,
  setGroundingAlerts: React.Dispatch<React.SetStateAction<GroundingAlertType[]>>
) {
  const handleRefine = (alert: GroundingAlertType) => {
    const prompts: Record<string, string> = {
      hype: 'provide specific data and sources to verify these claims',
      echo: 'challenge assumptions and present alternative viewpoints',
      drift: 'summarize insights and connect back to original question',
      factuality: 'verify claims and cite sources',
    };
    addReasoningStep('Grounding Refine', `User requested refinement for ${alert.type} alert`);
    console.log('Refinement prompt:', prompts[alert.type]);
  };

  const handleContinueAlert = (alert: GroundingAlertType) => {
    addReasoningStep('Grounding Continue', `User acknowledged ${alert.type} alert`);
  };

  const handlePivot = (alert: GroundingAlertType) => {
    const prompts: Record<string, string> = {
      hype: 'focus only on verified facts - what do we know with certainty?',
      echo: "play devil's advocate - what are the strongest counterarguments?",
      drift: 'return to original question - what is the direct answer?',
      factuality: 'what claims can we support with citations?',
    };
    addReasoningStep('Grounding Pivot', `User requested pivot for ${alert.type} alert`);
    console.log('Pivot prompt:', prompts[alert.type]);
  };

  const handleDismissAlert = (index: number) => {
    setGroundingAlerts((prev) => prev.filter((_, i) => i !== index));
  };

  return { handleRefine, handleContinueAlert, handlePivot, handleDismissAlert };
}
