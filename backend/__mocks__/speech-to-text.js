/**
 * Mock for speech-to-text module
 */

const SpeechToTextV1 = jest.fn(() => ({
  recognize: jest.fn().mockResolvedValue({
    result: {
      results: [{
        alternatives: [{
          transcript: 'أريد برجر مع بطاطس',
          confidence: 0.95
        }]
      }]
    }
  })
}));

module.exports = {
  SpeechToTextV1
};
