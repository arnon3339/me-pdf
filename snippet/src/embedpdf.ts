import { EmbedPdfContainer } from "./web-components/container";
import { PDFViewerConfig } from './components/app';

type ContainerConfig = PDFViewerConfig & {
  type: 'container';
  target: Element;
};

customElements.define('embedpdf-container', EmbedPdfContainer);

function initContainer(config: ContainerConfig) {
  const { type, target, ...viewerConfig } = config;
  const embedPdfElement = document.createElement('embedpdf-container') as EmbedPdfContainer;
  embedPdfElement.config = viewerConfig;
  config.target.appendChild(embedPdfElement);

  return embedPdfElement;
}

export type ReturnContainerType = ReturnType<typeof initContainer>;

export default { 
  init: (config: ContainerConfig): ReturnType<typeof initContainer> 
    | ReturnContainerType 
    | undefined => {
    if (config.type === 'container') {
      return initContainer(config as ContainerConfig);
    }
  }
}
