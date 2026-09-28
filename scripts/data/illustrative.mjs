// Illustrative formats in locale copy that the published core detects, by
// design: /architecture/detection/ shows what a detector selects, so its
// examples are shapes a detector matches. Each entry was reviewed as a format,
// not a value (CONVENTIONS.md § Synthetic data). It exempts exactly one whole
// string, for one detector, under one path prefix; any edit to the string
// makes the secret scan fail again until the change is reviewed here.
export const illustrative = [
  {
    under: 'i18n/',
    detector: 'connection-string',
    text: 'postgres://user:pw@host',
    why: 'The connection-URL row names the parts a detector selects (`pw`), not a credential.',
  },
  {
    under: 'i18n/',
    detector: 'generic-token',
    text: 'password=a8f3k29dj4ms91x',
    why: 'Tier 1 example: the same random-looking string as the unflagged card, now behind a key name.',
  },
];
