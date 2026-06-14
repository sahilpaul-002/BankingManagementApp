import { type FC } from "react";

const shimmerStyle = `
  @keyframes shimmer {
    0% {
      background-position: -700px 0;
    }

    100% {
      background-position: 700px 0;
    }
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .shimmer {
    background: linear-gradient(
      90deg,
      rgba(16, 24, 46, 0.88) 0%,
      rgba(24, 36, 66, 0.95) 35%,
      rgba(72, 88, 126, 0.32) 50%,
      rgba(24, 36, 66, 0.95) 65%,
      rgba(16, 24, 46, 0.88) 100%
    );

    background-size: 700px 100%;

    border: 1px solid rgba(255,255,255,0.04);

    box-shadow:
      inset 0 0 10px rgba(255,255,255,0.02),
      0 0 20px rgba(0,0,0,0.18);

    animation: shimmer 2s linear infinite;

    border-radius: 10px;
  }

  .fade-up {
    opacity: 0;
    animation: fadeUp 0.5s ease forwards;
  }
`;

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  delay?: number;
}

const Skeleton: FC<SkeletonProps> = ({
  width = "w-full",
  height = "h-4",
  className = "",
  delay = 0,
}) => (
  <div
    className={`shimmer ${width} ${height} ${className}`}
    style={{ animationDelay: `${delay}s` }}
  />
);

interface FieldProps {
  labelWidth?: string;
  delay?: number;
}

const Field: FC<FieldProps> = ({ labelWidth = "w-20", delay = 0 }) => (
  <div className="flex flex-col gap-2">
    <Skeleton width={labelWidth} height="h-3" delay={delay} />
    <Skeleton width="w-full" height="h-11" className="rounded-lg" delay={delay + 0.05} />
  </div>
);

const FormSkeleton: FC = () => {
  return (
    <>
      <style>{shimmerStyle}</style>

      <div className="w-full h-full flex items-center justify-center px-4">
        <div className="w-full max-w-md fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="p-8!">
            {/* Title block */}
            <div className="flex flex-col gap-2 mb-8!">
              <Skeleton width="w-40" height="h-5" className="rounded-md" delay={0.1} />
              <Skeleton width="w-64" height="h-3" delay={0.15} />
            </div>

            {/* Fields — all in one flex column with uniform gap */}
            <div className="flex flex-col gap-5">
              <Field labelWidth="w-16" delay={0.2} />
              <Field labelWidth="w-24" delay={0.3} />
              <Field labelWidth="w-20" delay={0.4} />
              <Field labelWidth="w-28" delay={0.5} />
            </div>

            {/* Submit button */}
            <div className="mt-6!">
              <Skeleton width="w-full" height="h-11" className="rounded-xl" delay={0.6} />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex justify-center">
            <Skeleton width="w-48" height="h-3" delay={0.7} />
          </div>
        </div>
      </div>
    </>
  );
};

export default FormSkeleton;