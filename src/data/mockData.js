// Teams
export const mockTeams = [
    {
        id: 'team-1', name: 'Engineering', initials: 'EN', color: '#667eea',
        description: 'Core product engineering team responsible for building and maintaining the platform.',
        department: 'Engineering',
        members: ['user-1', 'user-3', 'user-4'],
        createdAt: '2025-01-15T09:00:00.000Z',
        settings: { sla: { critical: 4, high: 8, medium: 24, low: 72 }, workingHours: { start: '09:00', end: '18:00', timezone: 'America/New_York' }, assignmentStrategy: 'round-robin' },
    },
    {
        id: 'team-2', name: 'Support', initials: 'SU', color: '#10b981',
        description: 'Customer support team handling user inquiries and issue resolution.',
        department: 'Customer Success',
        members: ['user-2', 'user-5', 'user-6'],
        createdAt: '2025-02-01T09:00:00.000Z',
        settings: { sla: { critical: 2, high: 4, medium: 12, low: 48 }, workingHours: { start: '08:00', end: '20:00', timezone: 'America/New_York' }, assignmentStrategy: 'load-balanced' },
    },
    {
        id: 'team-3', name: 'Sales', initials: 'SA', color: '#f59e0b',
        description: 'Sales operations team managing deals and client relationships.',
        department: 'Sales',
        members: ['user-1', 'user-2'],
        createdAt: '2025-03-10T09:00:00.000Z',
        settings: { sla: { critical: 1, high: 4, medium: 8, low: 24 }, workingHours: { start: '09:00', end: '17:00', timezone: 'America/Chicago' }, assignmentStrategy: 'manual' },
    },
    {
        id: 'team-4', name: 'Design', initials: 'DE', color: '#ec4899',
        description: 'Product design team crafting user experiences and visual interfaces.',
        department: 'Product',
        members: ['user-2', 'user-4', 'user-6'],
        createdAt: '2025-04-05T09:00:00.000Z',
        settings: { sla: { critical: 8, high: 16, medium: 48, low: 120 }, workingHours: { start: '10:00', end: '19:00', timezone: 'America/Los_Angeles' }, assignmentStrategy: 'round-robin' },
    },
];

// Roles & Permissions
export const mockRoles = [
    {
        id: 'role-admin', name: 'Admin',
        permissions: { manageTeam: true, manageMembers: true, manageRoles: true, manageSettings: true, viewAnalytics: true, createTickets: true, assignTickets: true, deleteTickets: true, exportData: true },
    },
    {
        id: 'role-manager', name: 'Manager',
        permissions: { manageTeam: false, manageMembers: true, manageRoles: false, manageSettings: true, viewAnalytics: true, createTickets: true, assignTickets: true, deleteTickets: true, exportData: true },
    },
    {
        id: 'role-agent', name: 'Agent',
        permissions: { manageTeam: false, manageMembers: false, manageRoles: false, manageSettings: false, viewAnalytics: true, createTickets: true, assignTickets: false, deleteTickets: false, exportData: false },
    },
    {
        id: 'role-viewer', name: 'Viewer',
        permissions: { manageTeam: false, manageMembers: false, manageRoles: false, manageSettings: false, viewAnalytics: true, createTickets: false, assignTickets: false, deleteTickets: false, exportData: false },
    },
];

// Team Activities
export const mockTeamActivities = [
    { id: 'ta-1', teamId: 'team-1', type: 'member_added', user: 'John Doe', target: 'Mike Johnson', message: 'added Mike Johnson to Engineering', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'ta-2', teamId: 'team-1', type: 'settings_changed', user: 'John Doe', message: 'updated SLA settings for Engineering', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'ta-3', teamId: 'team-2', type: 'member_removed', user: 'Sarah Smith', target: 'Lisa Chen', message: 'removed Lisa Chen from Support', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
    { id: 'ta-4', teamId: 'team-1', type: 'role_changed', user: 'Emily Davis', target: 'John Doe', message: 'changed John Doe\'s role to Senior Agent', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
    { id: 'ta-5', teamId: 'team-2', type: 'team_created', user: 'David Wilson', message: 'created the Support team', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ta-6', teamId: 'team-3', type: 'member_added', user: 'John Doe', target: 'Sarah Smith', message: 'added Sarah Smith to Sales', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
    { id: 'ta-7', teamId: 'team-4', type: 'settings_changed', user: 'Emily Davis', message: 'updated working hours for Design', timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
    { id: 'ta-8', teamId: 'team-1', type: 'member_added', user: 'Emily Davis', target: 'Emily Davis', message: 'joined Engineering team', timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString() },
];

const teamIds = ['team-1', 'team-2', 'team-3', 'team-4'];

const generateTickets = () => {
    const titles = [
        'Login page not responding',
        'Database connection timeout',
        'Payment gateway integration error',
        'Email notification system down',
        'User profile image upload failing',
        'Search feature returning incorrect results',
        'API rate limiting too aggressive',
        'Mobile app crashing on startup',
        'Report generation taking too long',
        'Dashboard charts not loading',
        'Unable to reset password',
        'File download not working',
        'Session timeout too short',
        'Dark mode toggle broken',
        'Notification bell not showing count',
        'CSV export missing columns',
        'Sidebar navigation stuck',
        'Form validation errors unclear',
        'Page load time very slow',
        'Memory leak in analytics page',
    ];

    const descriptions = [
        'Users are experiencing issues when trying to access this feature. Multiple reports have been filed from enterprise customers.',
        'The system is throwing an error when performing this operation. Stack trace shows a null pointer exception in the core module.',
        'This functionality needs immediate attention as it affects multiple users across different regions.',
        'The performance is degraded and needs optimization. Response times have increased by 300% since last deployment.',
        'We need to investigate why this is happening in production. Cannot reproduce locally.',
    ];

    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    const categories = ['Bug', 'Feature', 'Enhancement', 'Support', 'Security'];
    const sentiments = ['Angry', 'Frustrated', 'Neutral', 'Satisfied'];
    const customerTiers = ['Enterprise', 'Business', 'Professional', 'Free'];
    const users = [
        { id: 1, name: 'John Doe', email: 'john@example.com', avatar: 'JD' },
        { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', avatar: 'SS' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', avatar: 'MJ' },
        { id: 4, name: 'Emily Davis', email: 'emily@example.com', avatar: 'ED' },
        { id: 5, name: 'David Wilson', email: 'david@example.com', avatar: 'DW' },
    ];

    const tagOptions = [
        ['critical', 'authentication', 'safari'],
        ['performance', 'database', 'backend'],
        ['payment', 'integration', 'api'],
        ['email', 'notification', 'smtp'],
        ['upload', 'storage', 'frontend'],
        ['search', 'elasticsearch', 'indexing'],
        ['api', 'rate-limit', 'infrastructure'],
        ['mobile', 'crash', 'ios'],
        ['report', 'performance', 'timeout'],
        ['charts', 'rendering', 'frontend'],
    ];

    const tickets = [];
    for (let i = 0; i < 50; i++) {
        const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        tickets.push({
            id: String(1000 + i),
            title: titles[i % titles.length] + (i >= titles.length ? ` (${Math.floor(i / titles.length) + 1})` : ''),
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            priority,
            status,
            category: categories[Math.floor(Math.random() * categories.length)],
            teamId: teamIds[i % teamIds.length],
            assignee: users[Math.floor(Math.random() * users.length)],
            reporter: users[Math.floor(Math.random() * users.length)],
            createdAt: createdDate.toISOString(),
            updatedAt: new Date(createdDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
            dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
            aiConfidence: Math.floor(Math.random() * 30) + 70,
            estimatedResolutionTime: `${Math.floor(Math.random() * 48) + 1}h`,
            tags: tagOptions[i % tagOptions.length].slice(0, Math.floor(Math.random() * 2) + 1),
            comments: Math.floor(Math.random() * 10),
            attachments: Math.floor(Math.random() * 5),
            sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
            customerTier: customerTiers[Math.floor(Math.random() * customerTiers.length)],
            affectedUsers: Math.floor(Math.random() * 500) + 1,
            similarTickets: [
                { id: String(900 + Math.floor(Math.random() * 50)), similarity: +(Math.random() * 0.3 + 0.6).toFixed(2), resolutionTime: Math.floor(Math.random() * 8) + 1 },
                { id: String(850 + Math.floor(Math.random() * 50)), similarity: +(Math.random() * 0.3 + 0.5).toFixed(2), resolutionTime: Math.floor(Math.random() * 12) + 2 },
                { id: String(800 + Math.floor(Math.random() * 50)), similarity: +(Math.random() * 0.2 + 0.4).toFixed(2), resolutionTime: Math.floor(Math.random() * 16) + 3 },
            ],
        });
    }

    return tickets;
};

export const mockTickets = generateTickets();

export const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', avatar: 'JD', role: 'Developer' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', avatar: 'SS', role: 'Designer' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', avatar: 'MJ', role: 'Manager' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', avatar: 'ED', role: 'QA Engineer' },
    { id: 5, name: 'David Wilson', email: 'david@example.com', avatar: 'DW', role: 'Product Owner' },
];

export const mockTeamMembers = [
    {
        id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'Senior Agent',
        avatar: 'JD', teamId: 'team-1', expertise: ['Security', 'API', 'Database'],
        currentTickets: 5, resolvedToday: 8, resolvedThisWeek: 34,
        avgResolutionTime: 4.5, satisfaction: 4.8, status: 'online',
    },
    {
        id: 'user-2', name: 'Sarah Smith', email: 'sarah@example.com', role: 'Team Lead',
        avatar: 'SS', teamId: 'team-2', expertise: ['Frontend', 'UX', 'Performance'],
        currentTickets: 3, resolvedToday: 6, resolvedThisWeek: 28,
        avgResolutionTime: 3.2, satisfaction: 4.9, status: 'online',
    },
    {
        id: 'user-3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Support Agent',
        avatar: 'MJ', teamId: 'team-1', expertise: ['Backend', 'Infrastructure', 'DevOps'],
        currentTickets: 7, resolvedToday: 4, resolvedThisWeek: 22,
        avgResolutionTime: 6.1, satisfaction: 4.5, status: 'away',
    },
    {
        id: 'user-4', name: 'Emily Davis', email: 'emily@example.com', role: 'QA Specialist',
        avatar: 'ED', teamId: 'team-1', expertise: ['Testing', 'Automation', 'Mobile'],
        currentTickets: 4, resolvedToday: 9, resolvedThisWeek: 40,
        avgResolutionTime: 2.8, satisfaction: 4.7, status: 'online',
    },
    {
        id: 'user-5', name: 'David Wilson', email: 'david@example.com', role: 'Admin',
        avatar: 'DW', teamId: 'team-2', expertise: ['Security', 'Compliance', 'Integration'],
        currentTickets: 2, resolvedToday: 3, resolvedThisWeek: 18,
        avgResolutionTime: 5.0, satisfaction: 4.6, status: 'offline',
    },
    {
        id: 'user-6', name: 'Lisa Chen', email: 'lisa@example.com', role: 'Support Agent',
        avatar: 'LC', teamId: 'team-2', expertise: ['Email', 'Customer Success', 'Onboarding'],
        currentTickets: 6, resolvedToday: 7, resolvedThisWeek: 31,
        avgResolutionTime: 3.9, satisfaction: 4.8, status: 'online',
    },
];

export const mockNotifications = [
    { id: 'notif-1', type: 'ticket_created', message: 'New critical ticket assigned to you: "Login page not responding"', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), read: false, ticketId: '1000' },
    { id: 'notif-2', type: 'ticket_updated', message: 'Priority changed to High on ticket #1023', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), read: false, ticketId: '1023' },
    { id: 'notif-3', type: 'comment', message: 'Sarah Smith commented on ticket #1005', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: false, ticketId: '1005' },
    { id: 'notif-4', type: 'resolved', message: 'Ticket #1018 has been resolved by Mike Johnson', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), read: true, ticketId: '1018' },
    { id: 'notif-5', type: 'assigned', message: 'You have been assigned to ticket #1032', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), read: true, ticketId: '1032' },
    { id: 'notif-6', type: 'sla_warning', message: 'SLA breach warning for ticket #1012 — due in 2 hours', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), read: false, ticketId: '1012' },
    { id: 'notif-7', type: 'ticket_created', message: 'New ticket created: "Payment gateway integration error"', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), read: true, ticketId: '1002' },
    { id: 'notif-8', type: 'system', message: 'System maintenance scheduled for tonight at 11 PM EST', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), read: true },
];

export const mockComments = [
    {
        id: 1,
        ticketId: '1000',
        user: mockUsers[0],
        content: 'I\'ve started investigating this issue. Will update soon.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 2,
        ticketId: '1000',
        user: mockUsers[1],
        content: 'This seems to be affecting multiple users. Priority should be higher.',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
];

export const mockActivities = [
    { id: 1, type: 'created', user: mockUsers[0], message: 'created ticket #1025', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { id: 2, type: 'updated', user: mockUsers[1], message: 'changed priority from Medium to High on #1023', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { id: 3, type: 'commented', user: mockUsers[2], message: 'commented on ticket #1020', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { id: 4, type: 'resolved', user: mockUsers[3], message: 'resolved ticket #1018', timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
    { id: 5, type: 'assigned', user: mockUsers[4], message: 'assigned ticket #1022 to Mike Johnson', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString() },
];

export const mockAnalyticsData = {
    ticketsOverTime: [
        { date: 'Mon', open: 12, resolved: 8, total: 20 },
        { date: 'Tue', open: 15, resolved: 10, total: 25 },
        { date: 'Wed', open: 18, resolved: 12, total: 30 },
        { date: 'Thu', open: 14, resolved: 16, total: 30 },
        { date: 'Fri', open: 20, resolved: 14, total: 34 },
        { date: 'Sat', open: 16, resolved: 18, total: 34 },
        { date: 'Sun', open: 22, resolved: 15, total: 37 },
    ],
    ticketsByCategory: [
        { category: 'Bug', count: 120, fill: '#dc2626' },
        { category: 'Feature', count: 85, fill: '#667eea' },
        { category: 'Enhancement', count: 62, fill: '#06b6d4' },
        { category: 'Support', count: 45, fill: '#f59e0b' },
        { category: 'Security', count: 28, fill: '#10b981' },
    ],
    priorityDistribution: [
        { name: 'Critical', value: 15, color: '#dc2626' },
        { name: 'High', value: 28, color: '#ea580c' },
        { name: 'Medium', value: 35, color: '#eab308' },
        { name: 'Low', value: 22, color: '#22c55e' },
    ],
    heatmapData: (() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const hours = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
        const data = [];
        days.forEach(day => {
            hours.forEach(hour => {
                data.push({ day, hour, value: Math.floor(Math.random() * 20) + 1 });
            });
        });
        return data;
    })(),
    funnelData: [
        { stage: 'Reported', value: 340, fill: '#667eea' },
        { stage: 'Triaged', value: 280, fill: '#764ba2' },
        { stage: 'In Progress', value: 210, fill: '#06b6d4' },
        { stage: 'Review', value: 150, fill: '#f59e0b' },
        { stage: 'Resolved', value: 120, fill: '#10b981' },
    ],
    resolutionRate: [
        { month: 'Jan', rate: 78 },
        { month: 'Feb', rate: 82 },
        { month: 'Mar', rate: 85 },
        { month: 'Apr', rate: 79 },
        { month: 'May', rate: 88 },
        { month: 'Jun', rate: 92 },
    ],
};
