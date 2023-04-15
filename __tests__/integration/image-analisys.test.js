const { describe, it, expect } = require('@jest/globals');
const aws = require('aws-sdk');

aws.config.update({
  region: 'us-east-1',
});

const requestMock = require('./../mocks/request.json');
const { main } = require('./../../src/');

describe('Image analyser test suite', () => {
  it('it should analyse sucessfuly the image returning the results', async () => {
    const finalText = [
      "99.43% de ser do tipo Anime",
      "98.41% de ser do tipo bebê",
      "98.41% de ser do tipo pessoa",
      "93.37% de ser do tipo rosto",
      "93.37% de ser do tipo cabeça"
    ].join('\n');
    const expected = {
      statusCode: 200,
      body: `A imagem tem: \n`.concat(finalText),
    };
    const result = await main(requestMock);
    expect(result).toStrictEqual(expected);
  });
  it('given an empty queryString it should return status code 400', async () => {
    const expected = {
      statusCode: 400,
      body: 'an IMG URL is required',
    };
    const result = await main({ queryStringParameters: {} });
    expect(result).toStrictEqual(expected);
  });
  it('given an invalid img URL it should return status code 500', async () => {
    const expected = {
      statusCode: 500,
      body: 'Internal server error',
    };
    const result = await main({ queryStringParameters: { imageUrl: 'invalid' } });
    expect(result).toStrictEqual(expected);
  });
});
