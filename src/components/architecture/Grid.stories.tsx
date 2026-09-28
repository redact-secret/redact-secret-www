import type { Meta, StoryObj } from '@storybook/preact-vite';
import { StatusChip } from '../ui';
import { Card, Grid } from './Grid';

const meta: Meta = {
  title: 'Architecture/Grid',
  component: Grid,
};

export default meta;
type Story = StoryObj;

const card = (title: string, body: string) => (
  <Card>
    <h3>{title}</h3>
    <p>{body}</p>
  </Card>
);

export const TwoUp: Story = {
  render: () => (
    <Grid cols={2}>
      {card('What you get', 'No backtracking exists, so there is nowhere for a catastrophic input to live.')}
      {card('What it costs', 'Anything not shaped like a prefix and a bounded run is written by hand.')}
    </Grid>
  ),
};

export const ThreeUp: Story = {
  render: () => (
    <Grid cols={3}>
      {card('Luhn', 'Payment cards, checked with the card industry checksum.')}
      {card('IBAN mod-97', 'Account numbers, checked with the ISO remainder.')}
      {card('SSN allocation', 'Only the published structural exclusions.')}
    </Grid>
  ),
};

export const FourUpCompact: Story = {
  render: () => (
    <Grid cols={4}>
      {['JS / Node', 'Browser', 'Python', 'CLI'].map((name) => (
        <Card compact center key={name}>
          <b>{name}</b>
          <span class="tiny mono">binding</span>
        </Card>
      ))}
    </Grid>
  ),
};

export const WithStatus: Story = {
  render: () => (
    <Grid cols={2}>
      <Card>
        <h3>
          <StatusChip tone="none">Not caught</StatusChip>
        </h3>
        <p>A random-looking string standing alone.</p>
      </Card>
      <Card>
        <h3>
          <StatusChip tone="danger">Caught</StatusChip>
        </h3>
        <p>The same string after a credential-like name.</p>
      </Card>
    </Grid>
  ),
};
