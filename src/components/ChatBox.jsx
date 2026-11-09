import React from 'react';
import { FloatingChatFAB } from './FloatingChatFAB';

// Hỗ trợ tái sử dụng cho các component đang import ChatBox
export function ChatBox(props) {
  return <FloatingChatFAB {...props} />;
}

export default ChatBox;
