/**
 * تصدير نظام التصميم
 * Theme System Export
 */

export { colors, gradients } from './colors';
export { spacing, sizes } from './spacing';
export { typography, fontSizes, fontWeights } from './typography';

import colors from './colors';
import { spacing, sizes } from './spacing';
import typography from './typography';

const theme = {
  colors,
  spacing,
  sizes,
  typography,
};

export default theme;
