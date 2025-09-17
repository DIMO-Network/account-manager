import React from 'react';
import type { FC } from 'react';
import type { IconProps } from './index';

type ChevronOrientation = 'up' | 'down' | 'left' | 'right';

type ChevronIconProps = {
  orientation?: ChevronOrientation;
} & IconProps;

const getRotationClass = (orientation: ChevronOrientation): string => {
  switch (orientation) {
    case 'up':
      return 'rotate-90';
    case 'down':
      return '-rotate-90';
    case 'left':
      return 'rotate-180';
    case 'right':
    default:
      return '';
  }
};

export const ChevronIcon: FC<ChevronIconProps> = ({
  className = '',
  orientation = 'right',
}) => (
  <svg
    width="6"
    height="8"
    viewBox="0 0 6 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${getRotationClass(orientation)} ${className}`}
  >
    <path d="M0.999993 0.473735C0.739993 0.733735 0.739993 1.15373 0.999993 1.41373L3.58666 4.0004L0.999993 6.58707C0.739993 6.84707 0.739993 7.26707 0.999993 7.52707C1.25999 7.78707 1.67999 7.78707 1.93999 7.52707L4.99999 4.46707C5.25999 4.20707 5.25999 3.78707 4.99999 3.52707L1.93999 0.467068C1.68666 0.213734 1.25999 0.213735 0.999993 0.473735Z" fill="currentColor" />
  </svg>
);

export default ChevronIcon;
