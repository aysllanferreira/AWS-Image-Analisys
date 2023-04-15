const { get } = require('axios');

module.exports = class Handler {
  constructor({ rekoSvc, translatorSvc }) {
    this.rekoSvc = rekoSvc;
    this.translatorSvc = translatorSvc;
  }

  async getImageBuffer(imgURL) {
    const response = await get(imgURL, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'base64');
  }

  async detectImageLabels(imgBuffer) {
    const result = await this.rekoSvc.detectLabels({
      Image: {
        Bytes: imgBuffer,
      },
    }).promise();

    const workingItems = result.Labels.filter(({ Confidence }) => Confidence > 80);
    const names = workingItems.map(({ Name }) => Name).join(' and ');

    return {
      names,
      workingItems,
    };
  }

  async translateText(names) {
    const params = {
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'pt',
      Text: names,
    };

    const {TranslatedText} = await this.translatorSvc.translateText(params).promise();
    return TranslatedText.split(' e ');
  }

  formatTextResults(texts, workingItems) {
    const finalText = [];

    for(const indexText in texts) {
      const nameInPortuguese = texts[indexText];
      const confidence = workingItems[indexText].Confidence;
      
      finalText.push(
        `${confidence.toFixed(2)}% de ser do tipo ${nameInPortuguese}`
      )
    }

    return finalText.join('\n');
  }

  async main(event) {
    console.log('event', event);
    try {
      const { imageUrl } = event.queryStringParameters;

      if (!imageUrl) {
        return {
          statusCode: 400,
          body: 'an IMG URL is required',
        };
      }

      console.log('Downloading image...');
      const imgBuffer = await this.getImageBuffer(imageUrl);
      console.log('Image downloaded!');
      console.log('Detecting labels...');
      const {names, workingItems} = await this.detectImageLabels(imgBuffer);
      console.log('Labels detected!');
      console.log('Translating text...');
      const translatedText = await this.translateText(names);
      console.log('Text translated!');
      console.log('Formatting text...');
      const finalText = this.formatTextResults(translatedText, workingItems);
      console.log('Text formatted!');

      return {
        statusCode: 200,
        body: `A imagem tem: \n`.concat(finalText),
      };
    } catch (error) {
      console.log('error', error);
      return {
        statusCode: 500,
        body: 'Internal server error',
      };
    }
  }
};
