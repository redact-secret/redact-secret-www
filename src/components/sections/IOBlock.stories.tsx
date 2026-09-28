import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import type { Locale } from '../../i18n';
import { Rich } from '../ui/Rich';
import { IOBlock } from './IOBlock';

const meta: Meta = {
  title: 'Sections/Parts/IOBlock',
  component: IOBlock,
  render: (_args, { globals }) => {
    const { io } = content[globals.locale as Locale].home.hero;
    return (
      <div style={{ maxWidth: '560px' }}>
        <IOBlock caption={io.caption} footnote={<Rich value={io.footnote} />} />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj;

export const English: Story = {};
export const Korean: Story = { globals: { locale: 'ko' } };
