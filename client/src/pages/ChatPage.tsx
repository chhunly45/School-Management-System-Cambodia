import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { connectSocket, disconnectSocket } from '../services/socket';
import { getChat, listChats, markChatRead } from '../services/chat.api';

const decodeTokenUserId = (): string | null => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId;
  } catch {
    return null;
  }
};

const ChatPage = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState('');
  const [activeTitle, setActiveTitle] = useState('Select a conversation');
  const socketRef = useRef<any>(null);
  const selectedChatIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = useMemo(() => decodeTokenUserId(), []);
  const { id: routeChatId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const selectedChat = useMemo(
    () => chats.find((chat) => chat._id === selectedChatId),
    [chats, selectedChatId]
  );

  const getContact = (chat: any) => {
    if (!currentUserId) return chat.seller;
    return chat.buyer._id === currentUserId ? chat.seller : chat.buyer;
  };

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket?.on('online_users', (users: string[]) => {
      setOnlineUsers(users);
    });
    socket?.on('connect', () => {
      if (selectedChatIdRef.current) {
        socket.emit('join_chat', { chatId: selectedChatIdRef.current });
      }
    });
    socket?.on('new_message', ({ chatId, message, unreadCount }: any) => {
      setChats((prev) => prev.map((chat) => chat._id === chatId ? {
        ...chat,
        unreadCount,
        lastMessage: { content: message.content, createdAt: message.createdAt }
      } : chat));
    });
    socket?.on('message_received', (message: any) => {
      if (message.chatId === selectedChatIdRef.current) {
        setMessages((prev) => {
          if (message._id && prev.some((msg) => msg._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    });
    socket?.on('chat_updated', ({ chatId, unreadCount, lastMessageAt }: any) => {
      setChats((prev) => prev.map((chat) => chat._id === chatId ? {
        ...chat,
        unreadCount: typeof unreadCount === 'number' ? unreadCount : chat.unreadCount,
        lastMessageAt: lastMessageAt || chat.lastMessageAt
      } : chat));
    });

    socket?.connect();

    return () => {
      socket?.off('online_users');
      socket?.off('connect');
      socket?.off('new_message');
      socket?.off('message_received');
      socket?.off('chat_updated');
      disconnectSocket();
      socketRef.current = null;
    };
  }, [currentUserId]);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const data = await listChats();
        setChats(data);
        setStatus('');
        if (routeChatId) {
          const exists = data.some((chat: any) => chat._id === routeChatId);
          if (exists) {
            setSelectedChatId(routeChatId);
            return;
          }
        }

        if (data.length > 0) {
          setSelectedChatId(data[0]._id);
          navigate(`/messages/${data[0]._id}`, { replace: true });
        }
      } catch (error) {
        setStatus('Unable to load chats.');
      }
    };

    loadChats();
  }, [routeChatId, navigate]);

  useEffect(() => {
    if (!selectedChatId) return;

    const loadChat = async () => {
      try {
        setStatus('');
        setActiveTitle('Loading conversation...');
        const data = await getChat(selectedChatId);
        setMessages(data.messages);
        const contact = getContact(data.chat);
        setActiveTitle(`${data.chat.product.title} · ${contact.displayName}`);
        await markChatRead(selectedChatId);
        if (socketRef.current) {
          socketRef.current.emit('join_chat', { chatId: selectedChatId });
          socketRef.current.emit('mark_read', { chatId: selectedChatId });
        }
      } catch (error) {
        setStatus('Unable to load chat history.');
      }
    };
    loadChat();
  }, [selectedChatId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChat = (chatId: string) => {
    setStatus('');
    setActiveTitle('Loading conversation...');
    setSelectedChatId(chatId);
    navigate(`/messages/${chatId}`);
  };

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim() || !selectedChatId || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      chatId: selectedChatId,
      content: inputValue.trim()
    });

    setInputValue('');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Inbox</h2>
            <p className="text-sm text-muted">{onlineUsers.length} users online</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {chats.map((chat) => {
            const contact = getContact(chat);
            const isOnline = onlineUsers.includes(contact._id);
            return (
              <button
                key={chat._id}
                type="button"
                onClick={() => handleSelectChat(chat._id)}
                className={`w-full rounded-3xl border p-4 text-left transition ${selectedChatId === chat._id ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary hover:bg-background'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text-primary">{contact.displayName || 'Conversation'}</p>
                    <p className="mt-1 text-sm text-muted">{chat.product.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOnline && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
                    {chat.unreadCount > 0 && <span className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white">{chat.unreadCount}</span>}
                  </div>
                </div>
                {chat.lastMessage?.content && <p className="mt-3 text-sm text-text-secondary truncate">{chat.lastMessage.content}</p>}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
        <div className="flex items-center justify-between gap-4 border-b border-muted pb-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Live chat</p>
            <h1 className="text-2xl font-semibold text-text-primary">{activeTitle}</h1>
          </div>
          <span className="rounded-full bg-background px-4 py-2 text-sm text-text-secondary">{selectedChat?.status || 'Active'}</span>
        </div>

        <div className="mt-6 min-h-[420px] space-y-3 overflow-y-auto pr-2">
          {messages.map((message, index) => {
            const isMine = message.sender === currentUserId;
            return (
              <div key={index} className={`rounded-3xl px-4 py-3 text-sm ${isMine ? 'ml-auto bg-primary text-white' : 'bg-background text-text-secondary'} max-w-[80%]`}>
                {message.content}
                <div className="mt-2 text-[11px] text-muted">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form className="mt-6 flex gap-3" onSubmit={handleSendMessage}>
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Type your message"
            className="flex-1 rounded-full border border-muted bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="rounded-full bg-text-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Send
          </button>
        </form>

        {status && <p className="mt-4 text-sm text-text-secondary">{status}</p>}
      </section>
    </div>
  );
};

export default ChatPage;


