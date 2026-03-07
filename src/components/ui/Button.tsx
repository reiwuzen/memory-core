import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "danger" | "success";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const Button = ({ variant = "ghost", className = "", ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className={`ui-btn ui-btn--${variant} ${className}`.trim()}
    />
  );
};

export default Button;
