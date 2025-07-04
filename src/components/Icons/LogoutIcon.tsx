import type { FC } from 'react';
import type { IconProps } from './index';
import React from 'react';

export const LogoutIcon: FC<IconProps> = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M14.1667 6.66667L12.9917 7.84167L14.3083 9.16667H7.5V10.8333H14.3083L12.9917 12.15L14.1667 13.3333L17.5 10L14.1667 6.66667ZM4.16667 4.16667H10V2.5H4.16667C3.25 2.5 2.5 3.25 2.5 4.16667V15.8333C2.5 16.75 3.25 17.5 4.16667 17.5H10V15.8333H4.16667V4.16667Z"
        fill="#A7A7A7"
      />
    </svg>
  );
};
