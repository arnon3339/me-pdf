import { h, JSX } from 'preact';
import { Button } from './ui/button';
import { Icon } from './ui/icon';
import { RedactionItem } from '@embedpdf/plugin-redaction';
import { useRedactionCapability } from '@embedpdf/plugin-redaction/preact';

type RedactionMenuProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> & {
  item: RedactionItem;
  pageIndex: number;
  style?: JSX.CSSProperties;
};

export const RedactionMenu = ({ item, pageIndex, ...props }: RedactionMenuProps) => {
  const { provides: redactionCapability } = useRedactionCapability();

  const handleDeleteClick = () => {
    redactionCapability?.removePending(pageIndex, item.id);
  };

  return (
    <div
      {...props}
      className="flex flex-row gap-1 rounded-md border border-[#cfd4da] bg-[#f8f9fa] p-1"
    >
      <Button onClick={handleDeleteClick}>
        <Icon icon="trash" className="h-5 w-5" />
      </Button>
    </div>
  );
};
