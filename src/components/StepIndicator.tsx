"use client";

type Step = {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "active" | "completed";
};

type StepIndicatorProps = {
  steps: Step[];
};

export default function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-start justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 flex flex-col items-center">
            {/* Step Circle */}
            <div className="relative flex items-center justify-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ease-out ${
                  step.status === "completed"
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : step.status === "active"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {step.status === "completed" ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-6 left-1/2 w-full h-0.5 transition-colors duration-300 ease-out ${
                    step.status === "completed"
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                  style={{ width: "calc(100% - 3rem)", marginLeft: "1.5rem" }}
                />
              )}
            </div>
            {/* Step Title */}
            <div className="mt-3 text-center max-w-[120px]">
              <p
                className={`text-sm font-medium transition-colors duration-300 ease-out ${
                  step.status === "active"
                    ? "text-slate-900 font-semibold"
                    : step.status === "completed"
                    ? "text-emerald-600 font-semibold"
                    : "text-slate-400"
                }`}
              >
                {step.title}
              </p>
              {step.description && (
                <p className={`mt-1 text-xs transition-colors duration-300 ease-out ${
                  step.status === "active" || step.status === "completed"
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}>
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
