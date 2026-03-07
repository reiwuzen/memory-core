type SkeletonProps = {
  className?: string;
};

const Skeleton = ({ className = "" }: SkeletonProps) => {
  return <div className={`ui-skeleton ${className}`.trim()} aria-hidden="true" />;
};

export default Skeleton;
