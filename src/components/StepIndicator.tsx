"use client";

type Step = {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "active" | "completed";
};

type StepIndicatorProps = {
  steps: Step[];
  variant?: "default" | "glass";
};

export default function StepIndicator({ steps, variant = "default" }: StepIndicatorProps) {
  const isGlass = variant === "glass";

  const circleClasses = (step: Step) => {
    if (step.status === "completed") {
      return isGlass ? "bg-[#b4e237] border-[#b4e237] text-white" : "bg-emerald-500 border-emerald-500 text-white";
    }
    if (step.status === "active") {
      return isGlass ? "bg-white/30 border-white/50 text-white" : "bg-slate-900 border-slate-900 text-white";
    }
    return isGlass ? "bg-white/10 border-white/20 text-white/50" : "bg-white border-slate-300 text-slate-400";
  };

  const lineClasses = (step: Step) => {
    if (step.status === "completed") {
      return isGlass ? "bg-[#b4e237]/60" : "bg-emerald-500";
    }
    return isGlass ? "bg-white/20" : "bg-slate-300";
  };

  const titleClasses = (step: Step) => {
    if (step.status === "active") {
      return isGlass ? "text-white font-semibold" : "text-slate-900 font-semibold";
    }
    if (step.status === "completed") {
      return isGlass ? "text-[#b4e237] font-semibold" : "text-emerald-600 font-semibold";
    }
    return isGlass ? "text-white/50" : "text-slate-400";
  };

  const descClasses = (step: Step) => {
    if (step.status === "active" || step.status === "completed") {
      return isGlass ? "text-white/70" : "text-slate-600";
    }
    return isGlass ? "text-white/40" : "text-slate-400";
  };

  return (
    <div className="w-full">
      <div className="flex items-start justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ease-out ${circleClasses(step)}`}
              >
                {step.status === "completed" ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-6 left-1/2 w-full h-0.5 transition-colors duration-300 ease-out ${lineClasses(step)}`}
                  style={{ width: "calc(100% - 3rem)", marginLeft: "1.5rem" }}
                />
              )}
            </div>
            <div className="mt-3 text-center max-w-[120px]">
              <p className={`text-sm font-medium transition-colors duration-300 ease-out ${titleClasses(step)}`}>
                {step.title}
              </p>
              {step.description && (
                <p className={`mt-1 text-xs transition-colors duration-300 ease-out ${descClasses(step)}`}>
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
