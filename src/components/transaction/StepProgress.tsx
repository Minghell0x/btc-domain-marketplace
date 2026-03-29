import type { ReactElement } from 'react';

interface Step {
    number: number;
    label: string;
}

interface StepProgressProps {
    steps: Step[];
    currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps): ReactElement {
    return (
        <div className="flex items-center gap-2 mb-8">
            {steps.map((step, i) => {
                const isActive = step.number === currentStep;
                const isCompleted = step.number < currentStep;
                return (
                    <div key={step.number} className="flex items-center gap-2">
                        {i > 0 && (
                            <div className={`w-8 h-px ${isCompleted ? 'bg-primary' : 'bg-outline'}`} />
                        )}
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                                isCompleted ? 'bg-primary text-black' :
                                isActive ? 'bg-primary/20 text-primary border border-primary' :
                                'bg-surface-container-high text-on-surface-muted'
                            }`}>
                                {isCompleted ? '\u2713' : step.number}
                            </div>
                            <span className={`text-xs font-semibold tracking-wider ${
                                isActive ? 'text-on-surface' : 'text-on-surface-muted'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
