import type { Meta, StoryObj } from '@storybook/preact-vite';
import { content } from '../../content';
import { communityUrls } from '../../content/community';
import type { Locale } from '../../i18n';
import { SecurityPanel } from './SecurityPanel';

const meta: Meta = {
  title: 'Community/SecurityPanel',
  component: SecurityPanel,
  render: (_args, { globals }) => (
    <SecurityPanel
      copy={content[globals.locale as Locale].community.security}
      advisoryHref={communityUrls.advisory}
      policyHref={communityUrls.securityPolicy}
    />
  ),
};

export default meta;
export const Default: StoryObj = {};
