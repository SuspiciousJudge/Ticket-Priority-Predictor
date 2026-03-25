import { cn } from '../../lib/utils';

export default function Card({
    children,
    className = '',
    glassmorphism = false,
    hover = true,
    clickable = false,
    onClick,
    ...props
}) {
    return (
        <div
            className={cn(
                'bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-150',
                clickable && 'cursor-pointer hover:border-gray-300 hover:shadow-md',
                !clickable && hover && 'hover:shadow-md',
                glassmorphism && 'bg-white/80 backdrop-blur-sm',
                className
            )}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
}
