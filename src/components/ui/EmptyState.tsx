import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

const EmptyState = ({ title, description, action, className = "" }: EmptyStateProps) => {
  return (
    <div className={`ui-empty ${className}`.trim()}>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div style={{ marginTop: "12px" }}>{action}</div> : null}
    </div>
  );
};

export default EmptyState;
