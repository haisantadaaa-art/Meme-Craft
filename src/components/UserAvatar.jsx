import React from 'react';

export function UserAvatar({
  avatar,
  className = 'w-9 h-9',
  textClassName = 'text-2xl',
  border = true,
}) {
  if (!avatar) {
    return <span className={`${textClassName} leading-none select-none`}>👩‍🍳</span>;
  }

  const isImage =
    typeof avatar === 'string' &&
    (avatar.startsWith('data:image') ||
      avatar.startsWith('http://') ||
      avatar.startsWith('https://'));

  if (isImage) {
    return (
      <div
        className={`${className} rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-amber-50 ${
          border ? 'border border-amber-400 shadow-xs' : ''
        }`}
      >
        <img
          src={avatar}
          alt="Avatar"
          className="w-full h-full object-cover select-none pointer-events-none"
          onError={(e) => {
            // Fallback nếu ảnh lỗi
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <span className={`${textClassName} leading-none select-none shrink-0 inline-flex items-center justify-center`}>
      {avatar}
    </span>
  );
}

export default UserAvatar;
