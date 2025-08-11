import { Fragment } from '@framework';
import { MarqueeRedact } from './marquee-redact';
import { SelectionRedact } from './selection-redact';
import { PendingRedactions } from './pending-redactions';

interface RedactionLayerProps {
  pageIndex: number;
  scale: number;
}

export const RedactionLayer = ({ pageIndex, scale }: RedactionLayerProps) => {
  return (
    <Fragment>
      <PendingRedactions pageIndex={pageIndex} scale={scale} />
      <MarqueeRedact pageIndex={pageIndex} scale={scale} />
      <SelectionRedact pageIndex={pageIndex} scale={scale} />
    </Fragment>
  );
};
