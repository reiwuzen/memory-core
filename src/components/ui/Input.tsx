import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = ({ className = "", ...props }: InputProps) => {
  return <input {...props} className={`ui-input ${className}`.trim()} />;
};

export default Input;
