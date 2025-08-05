export const isProductionMode = (): boolean => {
  return process.env.NEXT_PUBLIC_APP_VERSION === 'production';
};
