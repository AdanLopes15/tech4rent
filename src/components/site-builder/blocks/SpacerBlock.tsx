// src/components/site-builder/blocks/SpacerBlock.tsx

type Props = { height?: number };

const SpacerBlock = ({ height = 60 }: Props) => {
  return <div aria-hidden style={{ height: `${Math.max(8, Math.min(400, Number(height) || 60))}px` }} />;
};

export default SpacerBlock;
