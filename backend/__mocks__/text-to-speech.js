/**
 * Mock for text-to-speech module
 */

const TextToSpeechV1 = jest.fn(() => ({
  synthesize: jest.fn().mockResolvedValue({
    audio: Buffer.from('mock audio data')
  })
}));

module.exports = {
  TextToSpeechV1
};
