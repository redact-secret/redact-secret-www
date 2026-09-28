import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Rich, RichLocale } from './Rich';

const meta = {
  title: 'UI/Rich',
  component: Rich,
  args: {
    value: [
      'Text with ',
      { b: 'bold' },
      ', ',
      { em: 'emphasis' },
      ', ',
      { code: 'code' },
      ', a ',
      { a: 'page on this site', to: 'architecture/vault' },
      ', an ',
      { a: 'external link', href: 'https://benchmarks.redactsecret.dev' },
      ', a ',
      { status: 'Pending', tone: 'none' },
      ' chip, a placeholder ',
      { placeholder: '<SECRET_1>' },
      ' and a slot: ',
      { var: 'version' },
      '.',
    ],
    vars: { version: '0.1.0-beta.10' },
  },
} satisfies Meta<typeof Rich>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every inline node the locale copy may use (schemas/locale-common-v1.schema.json). */
export const AllNodes: Story = {};

export const PlainString: Story = { args: { value: 'A plain string renders as text.' } };

/** Internal links resolve in the page's locale: `architecture/vault` → `/ko/architecture/vault/`. */
export const KoreanLinks: Story = {
  globals: { locale: 'ko' },
  args: { value: ['그것은 ', { a: '볼트', to: 'architecture/vault' }, '의 일입니다.'] },
  render: (args) => (
    <RichLocale.Provider value="ko">
      <Rich {...args} />
    </RichLocale.Provider>
  ),
};

export const LineBreak: Story = {
  args: { value: ['Secrets spread fast.', { br: true }, 'Stop them before they spread.'] },
};
