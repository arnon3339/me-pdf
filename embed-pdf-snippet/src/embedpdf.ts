import { EmbedPdfContainer } from "./web-components/container";

type BaseConfig = {

};

type ContainerConfig = BaseConfig & {
  type: 'container';
  target: Element;
};

customElements.define('embedpdf-container', EmbedPdfContainer);

function initContainer(config: ContainerConfig) {
  const embedPdfElement = document.createElement('embedpdf-container') as EmbedPdfContainer;
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
