const { detectSentiment, extractTags } = require('../utils/mlPredict');

describe('mlPredict utilities', () => {
  test('detectSentiment identifies angry/frustrated/happy/neutral', () => {
    expect(detectSentiment('I am furious about this')).toBe('Angry');
    expect(detectSentiment('I am frustrated with this')).toBe('Frustrated');
    expect(detectSentiment('Thanks, that worked great')).toBe('Happy');
    expect(detectSentiment('This is fine')).toBe('Neutral');
  });

  test('extractTags finds known keywords', () => {
    const tags = extractTags('There is an API error and upload failed with a timeout');
    expect(tags).toEqual(expect.arrayContaining(['api', 'upload', 'timeout']));
  });
});
