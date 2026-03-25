'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, IconButton, Paper, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

export default function ChatBox({ requestId, receiverId }: { requestId: string, receiverId: string }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const { socket } = useSocket();
    const { user } = useAuth();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch initial chat history
        api.get(`/chat/${requestId}`).then(res => setMessages(res.data)).catch(console.error);

        if (socket) {
            socket.emit('join_chat', { requestId });

            socket.on('new_message', (msg) => {
                if (msg.requestId === requestId) {
                    setMessages(prev => [...prev, msg]);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('new_message');
            }
        };
    }, [requestId, socket]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !socket) return;

        socket.emit('send_message', { requestId, receiverId, content: input });
        setInput('');
    };

    return (
        <Paper sx={{ display: 'flex', flexDirection: 'column', height: 400, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="subtitle1" fontWeight="bold">Chat</Typography>
            </Box>

            <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, bgcolor: '#f8f9fa' }}>
                {messages.map((m, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: m.senderId === user?.id ? 'flex-end' : 'flex-start' }}>
                        {m.senderId !== user?.id && <Avatar sx={{ width: 24, height: 24, mr: 1, mt: 0.5 }} />}
                        <Paper sx={{ p: 1.5, maxWidth: '75%', bgcolor: m.senderId === user?.id ? 'primary.light' : 'white', color: m.senderId === user?.id ? 'white' : 'text.primary', borderRadius: 2 }}>
                            <Typography variant="body2">{m.content}</Typography>
                        </Paper>
                    </Box>
                ))}
                <div ref={bottomRef} />
            </Box>

            <Box sx={{ display: 'flex', p: 1, borderTop: '1px solid #ddd', bgcolor: 'white' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    sx={{ mr: 1 }}
                />
                <IconButton color="primary" onClick={handleSend} disabled={!input.trim()}>
                    <SendIcon />
                </IconButton>
            </Box>
        </Paper>
    );
}
