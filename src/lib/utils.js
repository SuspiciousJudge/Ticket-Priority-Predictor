import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function getPriorityColor(priority) {
    const colors = {
        critical: 'text-danger-600 bg-danger-50 border-danger-200',
        high: 'text-orange-600 bg-orange-50 border-orange-200',
        medium: 'text-warning-600 bg-warning-50 border-warning-200',
        low: 'text-success-600 bg-success-50 border-success-200',
    };
    return colors[priority?.toLowerCase()] || colors.low;
}
export function getStatusColor(status) {
    const colors = {
        open: 'text-primary-600 bg-primary-50 border-primary-200',
        'in progress': 'text-secondary-600 bg-secondary-50 border-secondary-200',
        resolved: 'text-success-600 bg-success-50 border-success-200',
        closed: 'text-gray-600 bg-gray-50 border-gray-200',
    };
    return colors[status?.toLowerCase()] || colors.open;
}
export function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}
export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
export function calculateSLAStatus(ticket) {
    if (!ticket?.slaDeadline) {
        return { status: 'met', remaining: null };
    }
    const now = new Date();
    const deadline = new Date(ticket.slaDeadline);
    const diff = deadline - now;
    const hoursRemaining = diff / (1000 * 60 * 60);

    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        return { status: 'met', remaining: hoursRemaining };
    }
    if (diff <= 0) {
        return { status: 'breached', remaining: hoursRemaining };
    }
    if (hoursRemaining <= 2) {
        return { status: 'at_risk', remaining: hoursRemaining };
    }
    return { status: 'met', remaining: hoursRemaining };
}
