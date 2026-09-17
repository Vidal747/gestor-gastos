import Link from 'next/link';
import { buttonVariants } from '@heroui/styles';

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger';
  className?: string;
}) {
  return (
    <Link className={buttonVariants({ className, variant })} href={href}>
      {children}
    </Link>
  );
}
