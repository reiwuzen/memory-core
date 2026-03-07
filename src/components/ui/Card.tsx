import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

const Card = ({ className = "", ...props }: CardProps) => {
  return <div {...props} className={`ui-card ${className}`.trim()} />;
};

export default Card;
