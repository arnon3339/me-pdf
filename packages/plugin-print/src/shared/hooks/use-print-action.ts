import { PrintOptions } from '@embedpdf/plugin-print';
import { usePrintContext } from '../components';

export const usePrintAction = () => {
  const { executePrint, progress, isReady, isPrinting, parsePageRange } = usePrintContext();

  return {
    executePrint,
    progress,
    isReady,
    isPrinting,
    parsePageRange,
  };
};
