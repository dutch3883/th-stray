interface ThemeColors {
  primary: string;
  secondary: string;
  primaryLight: string;
  secondaryLight: string;
  primaryDark: string;
  secondaryDark: string;
  primaryBg: string;
  secondaryBg: string;
  primaryText: string;
  secondaryText: string;
  gradientFrom: string;
  gradientTo: string;
  bgGradientFrom: string;
  bgGradientTo: string;
}

const reporterTheme: ThemeColors = {
  primary: 'blue-600',
  secondary: 'blue-400',
  primaryLight: 'blue-50',
  secondaryLight: 'blue-100',
  primaryDark: 'blue-700',
  secondaryDark: 'blue-500',
  primaryBg: 'bg-blue-50',
  secondaryBg: 'bg-blue-100',
  primaryText: 'text-blue-600',
  secondaryText: 'text-blue-400',
  gradientFrom: 'from-blue-400',
  gradientTo: 'to-blue-500',
  bgGradientFrom: 'from-blue-50',
  bgGradientTo: 'to-indigo-50'
};

const rescuerTheme: ThemeColors = {
  primary: 'emerald-600',
  secondary: 'emerald-400',
  primaryLight: 'emerald-50',
  secondaryLight: 'emerald-100',
  primaryDark: 'emerald-700',
  secondaryDark: 'emerald-500',
  primaryBg: 'bg-emerald-50',
  secondaryBg: 'bg-emerald-100',
  primaryText: 'text-emerald-600',
  secondaryText: 'text-emerald-400',
  gradientFrom: 'from-emerald-500',
  gradientTo: 'to-green-600',
  bgGradientFrom: 'from-emerald-50',
  bgGradientTo: 'to-green-50'
};

export const getTheme = (isRescueMode: boolean): ThemeColors => {
  return isRescueMode ? rescuerTheme : reporterTheme;
};

export const getThemeColor = (isActive: boolean, isRescueMode: boolean, shade: number = 600): string => {
  if (!isActive) return 'text-gray-400';
  return `text-${isRescueMode ? 'emerald' : 'blue'}-${shade}`;
};

export const getThemeBg = (isRescueMode: boolean): string => {
  return getTheme(isRescueMode).primaryBg;
};

export const getThemeBgLight = (isRescueMode: boolean): string => {
  return getTheme(isRescueMode).secondaryBg;
};

export const getThemeGradient = (isRescueMode: boolean): string => {
  const theme = getTheme(isRescueMode);
  return `${theme.gradientFrom} ${theme.gradientTo}`;
};

export const getBgGradient = (isRescueMode: boolean): string => {
  const theme = getTheme(isRescueMode);
  return `${theme.bgGradientFrom} ${theme.bgGradientTo}`;
};

export const getThemeBorder = (isRescueMode: boolean): string => {
  return `border-${getTheme(isRescueMode).primary}`;
};

export const getThemeFilter = (isRescueMode: boolean): string => {
  return isRescueMode ? 'filter-emerald' : 'filter-blue';
};

export const getButtonGradient = (isRescueMode: boolean): string => {
  const theme = getTheme(isRescueMode);
  return `${theme.gradientFrom} ${theme.gradientTo}`;
};

export const getSecondaryButtonGradient = (isRescueMode: boolean): string => {
  return isRescueMode 
    ? 'from-emerald-400 to-green-500' 
    : 'from-blue-300 to-indigo-400';
}; 