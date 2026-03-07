import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement>;

const Badge = ({ className = "", ...props }: BadgeProps) => {
  return <span {...props} className={`ui-badge ${className}`.trim()} />;
};

export default Badge;
