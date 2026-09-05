import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { X, Send, Users, CircleDot, Image as ImageIcon, AtSign, Paperclip, CheckCheck, User } from 'lucide-react';
import { usersAPI } from '../../services/api';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

const seedMessages = [
  { id: 1, user: 'Priya', role: 'Lead', text: 'Please pick up the login outage ticket and confirm the root cause.', at: '2 min ago', side: 'left', channel: 'incident-room', reactions: [{ emoji: '👍', count: 2 }] },
  { id: 2, user: 'You', role: 'Agent', text: 'I am checking Jira and the codebase now.', at: '1 min ago', side: 'right', channel: 'support', readState: 'read', reactions: [{ emoji: '👀', count: 1 }] },
  { id: 3, user: 'Maya', role: 'Support', text: 'Announcements will be shared here for the full shift.', at: 'Just now', side: 'left', channel: 'announcements' },
];

const channels = [
  { key: 'incident-room', label: 'Incident Room', unread: 3 },
  { key: 'support', label: 'Support', unread: 1 },
  { key: 'announcements', label: 'Announcements', unread: 0 },
];

export default function TeamChatWidget() {
  const { teamChatOpen, setTeamChatOpen } = useStore();
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('team-chat-messages') || 'null') || seedMessages;
    } catch {
      return seedMessages;
    }
  });
  const [input, setInput] = useState('');
  const [recipientMode, setRecipientMode] = useState('team');
  const [recipientId, setRecipientId] = useState('');
  const [activeTab, setActiveTab] = useState('incident-room');
  const [typingUser] = useState({ name: 'Maya', role: 'Support', initials: 'M' });
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState('');
  const fileRef = useRef(null);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-chat-users'],
    queryFn: () => usersAPI.getAll().then((res) => res.data.data || []),
  });

  useEffect(() => {
    localStorage.setItem('team-chat-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setTeamChatOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTeamChatOpen]);

  useEffect(() => {
    return undefined;
  }, [attachmentPreview]);

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment(file);

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentPreview(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const send = () => {
    if (!input.trim() && !attachment) return;
    if (recipientMode === 'individual' && !recipientId) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: 'You',
        role: recipientMode === 'team' ? 'Agent' : 'Direct',
        text: input.trim() || 'Photo shared',
        at: 'Now',
        side: 'right',
        channel: activeTab,
        readState: 'delivered',
        recipientMode,
        recipientId,
        attachmentName: attachment?.name || '',
        attachmentPreview: attachmentPreview || '',
      },
    ]);

    setInput('');
    setRecipientId('');
    setAttachment(null);
    setAttachmentPreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const visibleMessages = useMemo(
    () => messages.filter((message) => (message.channel || 'support') === activeTab),
    [messages, activeTab]
  );

  const onlineCount = 6;

  return (
    <>
      <AnimatePresence>
        {teamChatOpen && (
          <motion.aside
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-6 right-4 z-50 flex h-[560px] max-h-[calc(100vh-3rem)] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-dark-border dark:bg-dark-surface md:right-6 md:w-[380px]"
          >
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-surface">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#534AB7] dark:bg-dark-bg dark:text-[#A9A4F0]">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Chat</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/25 dark:text-green-300">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {onlineCount} online
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Side-by-side with the workspace</p>
              </div>
              <button onClick={() => setTeamChatOpen(false)} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-bg" aria-label="Close chat">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-2 dark:border-dark-border dark:bg-dark-surface">
              {channels.map((channel) => (
                <button
                  key={channel.key}
                  type="button"
                  onClick={() => setActiveTab(channel.key)}
                  className={cn(
                    'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    activeTab === channel.key
                      ? 'bg-gray-100 text-gray-900 dark:bg-dark-bg dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-dark-bg'
                  )}
                >
                  {channel.label}
                  {channel.unread > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {channel.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2 border-b border-gray-100 px-4 py-3 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setRecipientMode('team')}
                className={cn(
                  'flex-1 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                  recipientMode === 'team'
                    ? 'border-[#534AB7] bg-[#534AB7] text-white'
                    : 'border-gray-200 bg-white text-gray-600 dark:border-dark-border dark:bg-dark-bg dark:text-gray-300'
                )}
              >
                Team
              </button>
              <button
                type="button"
                onClick={() => setRecipientMode('individual')}
                className={cn(
                  'flex-1 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                  recipientMode === 'individual'
                    ? 'border-[#534AB7] bg-[#534AB7] text-white'
                    : 'border-gray-200 bg-white text-gray-600 dark:border-dark-border dark:bg-dark-bg dark:text-gray-300'
                )}
              >
                Individual
              </button>
            </div>

            {recipientMode === 'individual' && (
              <div className="px-4 pt-3">
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-white"
                >
                  <option value="">Choose a person</option>
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex-1 space-y-4 overflow-y-auto bg-[#fafafa] p-4 dark:bg-dark-bg">
              {visibleMessages.map((message) => {
                const isOwn = message.side === 'right';
                const initials = (message.user || 'U')
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div key={message.id} className={cn('flex gap-3', isOwn ? 'justify-end' : 'justify-start')}>
                    {!isOwn && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-dark-border dark:text-gray-200">
                        {initials}
                      </div>
                    )}

                    <div className={cn('flex max-w-[76%] flex-col gap-1', isOwn ? 'items-end text-right' : 'items-start text-left')}>
                      <div className={cn('flex items-center gap-2 text-xs', isOwn ? 'justify-end' : 'justify-start')}>
                        <span className="font-semibold text-gray-900 dark:text-white">{message.user}</span>
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:border-dark-border dark:bg-dark-surface dark:text-gray-300">
                          {message.role}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">{message.at}</span>
                      </div>

                      <div
                        className={cn(
                          'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                          isOwn
                            ? 'bg-[#534AB7] text-white'
                            : 'border border-gray-200 bg-white text-gray-900 dark:border-dark-border dark:bg-dark-surface dark:text-gray-100'
                        )}
                      >
                        {message.text}

                        {message.attachmentPreview && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-white/20 bg-white/10">
                            <img src={message.attachmentPreview} alt={message.attachmentName || 'Attachment'} className="h-36 w-full object-cover" />
                            {message.attachmentName && (
                              <div className="border-t border-white/10 px-3 py-2 text-left text-[11px] font-medium text-white/80">
                                {message.attachmentName}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={cn('flex flex-wrap gap-2 text-xs', isOwn ? 'justify-end' : 'justify-start')}>
                        {message.reactions?.map((reaction) => (
                          <span key={`${message.id}-${reaction.emoji}`} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-600 dark:border-dark-border dark:bg-dark-surface dark:text-gray-300">
                            <span>{reaction.emoji}</span>
                            <span>{reaction.count}</span>
                          </span>
                        ))}
                      </div>

                      {isOwn && (
                        <div className="flex items-center justify-end gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <CheckCheck className="h-3.5 w-3.5 text-[#534AB7]" />
                          <span>{message.readState === 'read' ? 'Read' : 'Delivered'}</span>
                        </div>
                      )}
                    </div>

                    {isOwn && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#534AB7] text-xs font-semibold text-white">
                        ME
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-start gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-dark-border dark:text-gray-200">
                  M
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-900 dark:text-white">{typingUser.name}</span>
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:border-dark-border dark:bg-dark-surface dark:text-gray-300">
                      {typingUser.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 pb-2 pt-3 dark:bg-dark-surface">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAttachmentChange} className="hidden" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 text-xs font-medium text-[#534AB7] hover:underline dark:text-[#A9A4F0]"
              >
                <ImageIcon className="h-3.5 w-3.5" /> Upload photo
              </button>
              {attachment && (
                <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600 dark:border-dark-border dark:bg-dark-bg dark:text-gray-300">
                  {attachment.name}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-white p-3 dark:border-dark-border dark:bg-dark-surface">
              <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 dark:border-dark-border dark:bg-dark-bg">
                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 dark:border-dark-border dark:text-gray-400 dark:hover:bg-dark-border" aria-label="Mention someone">
                  <AtSign className="h-4 w-4" />
                </button>
                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 dark:border-dark-border dark:text-gray-400 dark:hover:bg-dark-border" aria-label="Attach file" onClick={() => fileRef.current?.click()}>
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message the team…"
                  className="flex-1 bg-transparent px-1 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                />
                <button onClick={send} className="inline-flex h-9 items-center gap-2 rounded-full bg-[#534AB7] px-4 text-sm font-medium text-white">
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}