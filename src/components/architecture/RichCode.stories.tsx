import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Dim, Flag, RichCode } from './RichCode';

const meta: Meta = {
  title: 'Architecture/RichCode',
  component: RichCode,
};

export default meta;
type Story = StoryObj;

export const Ruleset: Story = {
  render: () => (
    <RichCode label="Ruleset example">
      {['ruleset-revision: 1', 'detector: acme-internal-token', 'specificity: contextual', 'prefix: "ACME_"', 'alphabet: alnum-dash', 'run: at-least 20', 'validator: none'].join('\n')}
    </RichCode>
  ),
};

export const WithMarks: Story = {
  render: () => (
    <RichCode label="A provisional row">
      <Dim>// provisional row</Dim>
      {'\n'}"status": "provisional",
      {'\n'}  documented.minimumPositiveCases: <Flag>5 &lt; 6</Flag>
      {'\n'}  documented.minimumBenignCases:   <Flag>5 &lt; 8</Flag>
    </RichCode>
  ),
};
